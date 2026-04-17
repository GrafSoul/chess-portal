/**
 * Shared 3D layout constants and helpers for the Go scene.
 *
 * Centralizes cell sizing and the board ↔ world coordinate transform so that
 * every piece (board, grid, stones, hit targets, markers) stays in sync.
 */

import type { BoardSize, Point } from '../../engine/types';

/** Distance between adjacent intersections in world units. */
export const CELL_SIZE = 0.45;

/** Padding (world units) from the outermost line to the edge of the wooden board. */
export const BOARD_PADDING = 0.7;

/** Y offset of the board surface (stones/markers sit slightly above this). */
export const BOARD_SURFACE_Y = 0;

/**
 * World size (edge length) of the wooden board for a given grid size.
 *
 * @param size - 9 or 19.
 * @returns World edge length.
 */
export function boardWorldSize(size: BoardSize): number {
  return (size - 1) * CELL_SIZE + BOARD_PADDING * 2;
}

/**
 * Convert a grid point to world `(x, z)` coordinates. The board is centered
 * at the origin and lies on the XZ plane.
 *
 * @param point - 0-based grid point.
 * @param size - Board dimension (for centering).
 * @returns World `[x, z]` pair.
 */
export function pointToWorld(point: Point, size: BoardSize): [number, number] {
  const half = (size - 1) / 2;
  return [(point.x - half) * CELL_SIZE, (point.y - half) * CELL_SIZE];
}
