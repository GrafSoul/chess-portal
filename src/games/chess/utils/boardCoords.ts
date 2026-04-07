import type { Square } from '../engine/types';

const HALF = 4;

/** Convert chess square (e.g. 'a1') to 3D position [x, y, z] */
export function squareTo3D(square: Square): [number, number, number] {
  const file = square.charCodeAt(0) - 97; // a=0 .. h=7
  const rank = parseInt(square[1], 10) - 1; // 1=0 .. 8=7
  return [file - HALF + 0.5, 0, rank - HALF + 0.5];
}

/** Convert 3D position [x, z] to chess square, or null if out of bounds */
export function threeDToSquare(x: number, z: number): Square | null {
  const file = Math.round(x + HALF - 0.5);
  const rank = Math.round(z + HALF - 0.5);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return String.fromCharCode(97 + file) + (rank + 1);
}

/** Get row and column from square index (0-63) */
export function indexToRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / 8), col: index % 8 };
}

/** Check if a square is light-colored */
export function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}
