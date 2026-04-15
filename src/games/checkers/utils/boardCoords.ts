import type { Square } from '../engine/types';

/**
 * Convert a checkers square (e.g. 'c3') to a 3D world position [x, y, z].
 *
 * Matches the coordinate system used by CheckerPiece.tsx:
 *   x = col - 3.5
 *   z = -(row - 3.5)
 *
 * @param square Algebraic square notation (a1–h8)
 * @returns [x, y, z] world-space coordinates
 */
export function squareTo3D(square: Square): [number, number, number] {
  const col = square.charCodeAt(0) - 97; // a=0 .. h=7
  const row = parseInt(square[1], 10) - 1; // 1=0 .. 8=7
  return [col - 3.5, 0, row - 3.5];
}
