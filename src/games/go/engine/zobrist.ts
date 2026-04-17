/**
 * Zobrist hashing for Go positions.
 *
 * A Zobrist hash represents a board position as the XOR of random 64-bit
 * values — one per (point, color) combination. Identical positions always
 * produce the same hash; this is later used for positional superko
 * detection (illegal to recreate any previous whole-board position).
 *
 * Here we use `bigint` for a 64-bit-like value. It's generated from 8
 * bytes of cryptographically strong random data when available, falling
 * back to `Math.random` if not.
 */

import type { Board, Stone } from './types';

/** 64-bit mask used to keep hash values within the 64-bit range. */
const MASK_64 = (1n << 64n) - 1n;

/**
 * Generate a single 64-bit random bigint.
 *
 * Uses `crypto.getRandomValues` when available for quality; otherwise
 * falls back to a `Math.random` combination. Either way the output is
 * strictly a 64-bit non-negative bigint.
 */
function random64(): bigint {
  // Prefer Web Crypto when available (browser or modern Node).
  const g = globalThis as { crypto?: { getRandomValues?: (arr: Uint8Array) => void } };
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    g.crypto.getRandomValues(bytes);
    let result = 0n;
    for (const byte of bytes) {
      result = (result << 8n) | BigInt(byte);
    }
    return result & MASK_64;
  }

  // Fallback: combine two 32-bit Math.random values.
  const hi = BigInt(Math.floor(Math.random() * 0x1_0000_0000));
  const lo = BigInt(Math.floor(Math.random() * 0x1_0000_0000));
  return ((hi << 32n) | lo) & MASK_64;
}

/**
 * Precomputed table of random values for (point, color) pairs.
 *
 * The table size is `boardSize × boardSize × 2` (two colors). Look up
 * `keyFor(x, y, color)` to get the per-stone contribution to the hash.
 */
export class ZobristTable {
  /** Board edge length this table was constructed for. */
  public readonly size: number;

  /** Flat table of random values indexed by `(y*size + x)*2 + colorIndex`. */
  private readonly table: bigint[];

  /**
   * Build a fresh Zobrist table.
   *
   * @param size - Board edge length (e.g. 9 or 19).
   */
  constructor(size: number) {
    this.size = size;
    const count = size * size * 2;
    this.table = new Array<bigint>(count);
    for (let i = 0; i < count; i++) {
      this.table[i] = random64();
    }
  }

  /**
   * Get the random bigint associated with a particular stone placement.
   *
   * @param x - Column.
   * @param y - Row.
   * @param color - Stone color.
   * @returns The 64-bit random key.
   */
  public keyFor(x: number, y: number, color: Stone): bigint {
    const colorIndex = color === 'b' ? 0 : 1;
    return this.table[(y * this.size + x) * 2 + colorIndex];
  }

  /**
   * Compute the Zobrist hash of a full board position.
   *
   * The hash is the XOR of `keyFor(x, y, color)` for every stone on the
   * board. Empty intersections contribute nothing.
   *
   * @param board - Board to hash.
   * @returns The 64-bit position hash.
   */
  public hashBoard(board: Board): bigint {
    let hash = 0n;
    for (let y = 0; y < this.size; y++) {
      const row = board[y];
      for (let x = 0; x < this.size; x++) {
        const cell = row[x];
        if (cell) {
          hash ^= this.keyFor(x, y, cell);
        }
      }
    }
    return hash;
  }
}

/**
 * Convenience: hash a board using a fresh table.
 *
 * Prefer reusing a persistent `ZobristTable` in the engine so that
 * consecutive positions share the same random values.
 *
 * @param board - Board to hash.
 * @returns Hash of the board.
 */
export function hashBoard(board: Board): bigint {
  const table = new ZobristTable(board.length);
  return table.hashBoard(board);
}
