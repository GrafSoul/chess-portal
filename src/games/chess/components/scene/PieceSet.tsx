import { useState } from 'react';
import { Piece } from './Piece';
import { parseFenBoard } from '../../utils/fenUtils';
import type { PieceType, PieceColor, Square } from '../../engine/types';

interface PieceSetProps {
  fen: string;
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

/** Squared euclidean distance between two squares (in board units). */
function squareDistanceSq(a: Square, b: Square): number {
  const af = a.charCodeAt(0) - 97;
  const ar = parseInt(a[1], 10) - 1;
  const bf = b.charCodeAt(0) - 97;
  const br = parseInt(b[1], 10) - 1;
  return (af - bf) ** 2 + (ar - br) ** 2;
}

/**
 * Computes a stable mapping of board pieces with persistent identities.
 *
 * Two-pass matching:
 * 1. Exact-square match — pieces that didn't move keep their identity.
 * 2. Closest unmatched piece of same type+color — the moved piece is paired
 *    with the previous piece nearest to its new square. Prevents the cascade
 *    swap bug where naive "first available" matching misassigns identities
 *    and causes neighbor pieces to visibly shift.
 */
function computeTrackedPieces(
  fen: string,
  prev: TrackedPiece[],
  startId: number,
): { pieces: TrackedPiece[]; nextId: number } {
  // Parse FEN directly — we avoid chess.js here because it rejects positions
  // without both kings, and tutorial demos intentionally use minimal positions
  // (e.g. a single knight on an empty board).
  const boardPart = fen.split(' ')[0] ?? '';
  const grid = parseFenBoard(boardPart); // row 0 = rank 8

  // Build current board state
  const current: { type: PieceType; color: PieceColor; square: Square }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const ch = grid[row]?.[col];
      if (!ch || ch === '.') continue;
      const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b';
      const type = ch.toLowerCase() as PieceType;
      // row 0 is rank 8 → file+rank (rank = 8 - row)
      const square = (String.fromCharCode(97 + col) + (8 - row)) as Square;
      current.push({ type, color, square });
    }
  }

  const result: TrackedPiece[] = new Array(current.length);
  const usedPrevIds = new Set<string>();
  let nextId = startId;

  // Pass 1: exact square match (pieces that didn't move)
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
    let best: TrackedPiece | null = null;
    let bestDist = Infinity;
    for (const pp of prev) {
      if (usedPrevIds.has(pp.id)) continue;
      if (pp.type !== cp.type || pp.color !== cp.color) continue;
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
      // New piece (promotion or initial render)
      result[i] = { ...cp, id: `piece-${nextId++}` };
    }
  }

  return { pieces: result, nextId };
}

/** Renders all pieces with stable identity tracking across moves. */
export function PieceSet({ fen, onPieceClick }: PieceSetProps) {
  // "Adjusting state while rendering" pattern — React allows queuing setState
  // during render to derive state from props with memory of previous renders.
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
        <Piece
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
