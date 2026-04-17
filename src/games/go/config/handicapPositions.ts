/**
 * Standard handicap stone placements for Go.
 *
 * Handicap stones are placed by Black before the game starts, after which
 * White plays the first move. Placements follow the traditional order
 * documented by the AGA / Japanese rules:
 *
 * 1. Upper-right star point
 * 2. Lower-left star point
 * 3. Lower-right star point
 * 4. Upper-left star point
 * 5. Center (tengen) — only for 5, 7, 9 stones; for 6 and 8 the center
 *    is skipped and side points are used instead
 * 6-9. Side midpoints (left, right, top, bottom) added in pairs
 *
 * Handicap on 9×9 is uncommon and not supported here — an empty array is
 * returned for any requested count on 9×9.
 */

import type { BoardSize, Point } from '../engine/types';

/** Standard 19×19 star-point coordinates (0-based). */
const UR: Point = { x: 15, y: 3 };   // upper-right
const UL: Point = { x: 3, y: 3 };    // upper-left
const LR: Point = { x: 15, y: 15 };  // lower-right
const LL: Point = { x: 3, y: 15 };   // lower-left
const LEFT: Point = { x: 3, y: 9 };  // left side
const RIGHT: Point = { x: 15, y: 9 };// right side
const TOP: Point = { x: 9, y: 3 };   // top side
const BOTTOM: Point = { x: 9, y: 15 };// bottom side
const TENGEN: Point = { x: 9, y: 9 };// center

/**
 * Handicap placements for 19×19, keyed by handicap count (2..9).
 *
 * Order follows AGA rules: corners first in UR/LL/LR/UL sequence, then
 * center (for odd totals 5/7/9), then side midpoints added in pairs for
 * 7 (left+right), 8 (top+bottom), 9 (all four sides plus center).
 */
const HANDICAP_19: Record<number, Point[]> = {
  2: [UR, LL],
  3: [UR, LL, LR],
  4: [UR, LL, LR, UL],
  5: [UR, LL, LR, UL, TENGEN],
  6: [UR, LL, LR, UL, LEFT, RIGHT],
  7: [UR, LL, LR, UL, LEFT, RIGHT, TENGEN],
  8: [UR, LL, LR, UL, LEFT, RIGHT, TOP, BOTTOM],
  9: [UR, LL, LR, UL, LEFT, RIGHT, TOP, BOTTOM, TENGEN],
};

/**
 * Get the handicap stone placements for a given board size and count.
 *
 * @param boardSize - Board dimension (9 or 19).
 * @param count - Number of handicap stones (2..9). 0 or 1 returns `[]`.
 * @returns An array of points (empty if handicap is not supported).
 * @example
 * ```ts
 * getHandicapPositions(19, 4); // → 4 corner star points
 * getHandicapPositions(9, 4);  // → [] (not supported)
 * ```
 */
export function getHandicapPositions(
  boardSize: BoardSize,
  count: number,
): Point[] {
  if (count <= 1) return [];
  if (boardSize !== 19) return [];
  const placements = HANDICAP_19[count];
  return placements ? placements.map((p) => ({ ...p })) : [];
}

/** Minimum supported handicap count (0 and 1 are treated as no handicap). */
export const MIN_HANDICAP = 2;
/** Maximum supported handicap count on 19×19. */
export const MAX_HANDICAP = 9;
