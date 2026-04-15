import { useState } from 'react';
import { CheckerPiece } from './CheckerPiece';
import type { PieceType, PieceColor, Square } from '../../engine/types';

interface CheckerPieceSetProps {
  /** Current checkers FEN string */
  fen: string;
  /** Called when a piece is clicked */
  onPieceClick: (square: Square) => void;
}

interface TrackedPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  square: Square;
}

interface TrackingState {
  fen: string;
  pieces: TrackedPiece[];
  nextId: number;
}

const INITIAL_STATE: TrackingState = { fen: '', pieces: [], nextId: 0 };

/** Squared euclidean distance between two algebraic squares */
function squareDistanceSq(a: Square, b: Square): number {
  const af = a.charCodeAt(0) - 97;
  const ar = parseInt(a[1], 10) - 1;
  const bf = b.charCodeAt(0) - 97;
  const br = parseInt(b[1], 10) - 1;
  return (af - bf) ** 2 + (ar - br) ** 2;
}

/**
 * Parse a checkers FEN board string into a list of pieces.
 *
 * FEN format: ranks separated by '/', rank 8 first (top of board).
 * Characters: 'w' = white man, 'W' = white king,
 *             'b' = black man, 'B' = black king,
 *             '1'-'8' = empty squares.
 */
function parseFenPieces(
  fen: string,
): { type: PieceType; color: PieceColor; square: Square }[] {
  const boardPart = fen.split(' ')[0] ?? '';
  const ranks = boardPart.split('/');
  const result: { type: PieceType; color: PieceColor; square: Square }[] = [];

  for (let i = 0; i < ranks.length; i++) {
    const rank = ranks[i];
    const row = 7 - i; // FEN rank 8 is first → row index 7
    let col = 0;
    for (const ch of rank) {
      if (ch >= '1' && ch <= '8') {
        col += parseInt(ch, 10);
      } else {
        const color: PieceColor = ch === 'w' || ch === 'W' ? 'w' : 'b';
        const type: PieceType = ch === 'W' || ch === 'B' ? 'king' : 'man';
        const square = (String.fromCharCode(97 + col) + (row + 1)) as Square;
        result.push({ type, color, square });
        col += 1;
      }
    }
  }

  return result;
}

/**
 * Compute stable tracked pieces with persistent identities.
 *
 * Two-pass matching (same algorithm as chess PieceSet):
 * 1. Exact-square match — unmoved pieces keep their identity.
 * 2. Closest unmatched piece of same type+color — moved piece pairs with
 *    the nearest previous piece, ensuring smooth animation without cascade swaps.
 */
function computeTrackedPieces(
  fen: string,
  prev: TrackedPiece[],
  startId: number,
): { pieces: TrackedPiece[]; nextId: number } {
  const current = parseFenPieces(fen);
  const result: TrackedPiece[] = new Array(current.length);
  const usedPrevIds = new Set<string>();
  let nextId = startId;

  // Pass 1: exact square match
  const unmatchedIdx: number[] = [];
  for (let i = 0; i < current.length; i++) {
    const cp = current[i];
    const exact = prev.find(
      (pp) =>
        !usedPrevIds.has(pp.id) &&
        pp.type === cp.type &&
        pp.color === cp.color &&
        pp.square === cp.square,
    );
    if (exact) {
      usedPrevIds.add(exact.id);
      result[i] = { ...cp, id: exact.id };
    } else {
      unmatchedIdx.push(i);
    }
  }

  // Pass 2: greedy closest match for moved pieces
  for (const i of unmatchedIdx) {
    const cp = current[i];

    // For promotion (man→king), also match same-color man at closest square
    let best: TrackedPiece | null = null;
    let bestDist = Infinity;
    for (const pp of prev) {
      if (usedPrevIds.has(pp.id)) continue;
      if (pp.color !== cp.color) continue;
      // Accept same type OR type change (promotion: man→king)
      if (pp.type !== cp.type && pp.type !== 'man') continue;
      const d = squareDistanceSq(cp.square, pp.square);
      if (d < bestDist) {
        bestDist = d;
        best = pp;
      }
    }

    if (best) {
      usedPrevIds.add(best.id);
      result[i] = { ...cp, id: best.id };
    } else {
      result[i] = { ...cp, id: `checker-${nextId++}` };
    }
  }

  return { pieces: result, nextId };
}

/** Renders all checker pieces with stable identity tracking across moves */
export function CheckerPieceSet({ fen, onPieceClick }: CheckerPieceSetProps) {
  const [tracking, setTracking] = useState<TrackingState>(INITIAL_STATE);

  let pieces = tracking.pieces;
  if (fen !== tracking.fen) {
    const computed = computeTrackedPieces(fen, tracking.pieces, tracking.nextId);
    pieces = computed.pieces;
    setTracking({ fen, pieces: computed.pieces, nextId: computed.nextId });
  }

  return (
    <group>
      {pieces.map((p) => (
        <CheckerPiece
          key={p.id}
          type={p.type}
          color={p.color}
          square={p.square}
          onClick={onPieceClick}
        />
      ))}
    </group>
  );
}
