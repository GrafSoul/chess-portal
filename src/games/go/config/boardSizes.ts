/**
 * Board size configurations for Go.
 *
 * Provides star-point (hoshi) coordinates and default komi for the two
 * standard sizes: 9×9 (teaching / quick games) and 19×19 (full game).
 */

import type { BoardSize, Point } from '../engine/types';

/** Runtime configuration for one board size. */
export interface BoardConfig {
  /** Edge length of the square board. */
  size: BoardSize;
  /** Hoshi (star-point) coordinates used for visual reference and handicap. */
  starPoints: Point[];
  /** Default komi used when none is supplied explicitly. */
  defaultKomi: number;
}

/**
 * Star-point layouts.
 *
 * 9×9: four corner points plus the center (tengen).
 * 19×19: nine standard hoshi — four corners (4,4), (4,16), (16,4), (16,16);
 * four side midpoints (4,10), (10,4), (10,16), (16,10); and the center (10,10).
 * These are expressed in 0-based coordinates below.
 */
export const BOARD_CONFIGS: Record<BoardSize, BoardConfig> = {
  9: {
    size: 9,
    // Corners at (2,2), (2,6), (6,2), (6,6) and tengen at (4,4).
    starPoints: [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
      { x: 4, y: 4 },
    ],
    defaultKomi: 7.5,
  },
  19: {
    size: 19,
    // Nine standard hoshi on the 4th / 10th / 16th lines (0-based: 3, 9, 15).
    starPoints: [
      { x: 3, y: 3 },
      { x: 9, y: 3 },
      { x: 15, y: 3 },
      { x: 3, y: 9 },
      { x: 9, y: 9 },
      { x: 15, y: 9 },
      { x: 3, y: 15 },
      { x: 9, y: 15 },
      { x: 15, y: 15 },
    ],
    defaultKomi: 7.5,
  },
};
