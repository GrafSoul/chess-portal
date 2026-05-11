/**
 * Path and position utilities for Long Backgammon.
 *
 * Both colors travel counter-clockwise around the same 24-point ring but
 * start at different points and have different home quadrants. This module
 * provides a unified API based on each color's ordered "path" array so that
 * callers never need to reason about modular arithmetic directly.
 *
 * Key model:
 * - Every color's journey is represented as a 24-element path array where
 *   path[0] is the head and path[23] is the last home point.
 * - Advancing `pips` steps from a board point means finding its path
 *   position, adding `pips`, and looking up the new board point.
 * - If the new path position is ≥ 24 the stone is borne off ('off').
 */

import type { StoneColor, PointIndex, PointState } from './types';
import {
  BOARD_POINTS,
  STONES_PER_SIDE,
  WHITE_PATH,
  BLACK_PATH,
  WHITE_PATH_POSITION,
  BLACK_PATH_POSITION,
  WHITE_HOME_START,
  WHITE_HOME_END,
  BLACK_HOME_START,
  BLACK_HOME_END,
} from './constants';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the ordered path array for `color`.
 *
 * @param color - The stone color.
 * @returns The 24-element path array (path[0] = head, path[23] = last home point).
 */
function pathFor(color: StoneColor): readonly number[] {
  return color === 'w' ? WHITE_PATH : BLACK_PATH;
}

/**
 * Returns the inverse path-position lookup array for `color`.
 *
 * @param color - The stone color.
 * @returns A 24-element array where entry `[boardPoint]` is the path position.
 */
function pathPositionArrayFor(color: StoneColor): readonly number[] {
  return color === 'w' ? WHITE_PATH_POSITION : BLACK_PATH_POSITION;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes the destination board point when a stone of `color` moves `pips`
 * steps forward from `from` along its color-specific path.
 *
 * Returns `'off'` when the stone would move beyond the final home point
 * (path position ≥ 24), i.e. it is borne off the board.
 *
 * **Note:** This function does NOT check whether bearing off is currently
 * legal (all stones in home). That check lives in `bearOffRule.ts`.
 * The function purely computes the geometric destination.
 *
 * @param color - The moving stone's color.
 * @param from  - The source board point index (0..23).
 * @param pips  - The die value (1..6).
 * @returns The destination point index or `'off'`.
 *
 * @example
 * ```ts
 * nextPoint('w', 23, 3); // → 20  (White head, move 3)
 * nextPoint('w',  2, 3); // → 'off' (past White home exit)
 * nextPoint('b', 11, 4); // → 7   (Black head, move 4)
 * nextPoint('b',  0, 1); // → 23  (Black path wraps 0 → 23)
 * ```
 */
export function nextPoint(
  color: StoneColor,
  from: PointIndex,
  pips: number,
): PointIndex | 'off' {
  const pathPositions = pathPositionArrayFor(color);
  const path = pathFor(color);

  const currentPos = pathPositions[from];
  const newPos = currentPos + pips;

  if (newPos >= BOARD_POINTS) {
    return 'off';
  }

  return path[newPos] as PointIndex;
}

/**
 * Returns where on the color-specific path a given board point sits.
 *
 * `0` = head (starting point), `23` = last home point (closest to exit).
 *
 * @param color - The stone color.
 * @param point - The board point index (0..23).
 * @returns Path position in `[0, 23]`.
 *
 * @example
 * ```ts
 * pathPosition('w', 23); // → 0  (White head is path position 0)
 * pathPosition('w',  0); // → 23 (White's last home point)
 * pathPosition('b', 11); // → 0  (Black head)
 * pathPosition('b', 12); // → 23 (Black's last home point)
 * ```
 */
export function pathPosition(color: StoneColor, point: PointIndex): number {
  return pathPositionArrayFor(color)[point];
}

/**
 * Returns how many pips remain between a stone on `point` and the board exit.
 *
 * A value of `0` means the stone is on the point immediately before the exit
 * (1 pip away), while `23` means it is still on the head.
 *
 * Formally: `distanceFromHome(color, point) = 23 - pathPosition(color, point)`.
 *
 * @param color - The stone color.
 * @param point - The board point index (0..23).
 * @returns Distance from the exit: `23` (head) … `0` (last home point).
 *
 * @example
 * ```ts
 * distanceFromHome('w', 23); // → 23 (White head: farthest from exit)
 * distanceFromHome('w',  0); // →  0 (White last home point: adjacent to exit)
 * distanceFromHome('b', 11); // → 23
 * distanceFromHome('b', 12); // →  0
 * ```
 */
export function distanceFromHome(color: StoneColor, point: PointIndex): number {
  return (BOARD_POINTS - 1) - pathPosition(color, point);
}

/**
 * Computes the pip count for `color`: the sum over all on-board stones of
 * `(distanceFromHome + 1)`, i.e. the number of pips required to bear off
 * all remaining stones.
 *
 * A lower pip count means the color is winning the race.
 *
 * @param board    - The current 24-point board state.
 * @param bornOff  - Count of stones already borne off for each color.
 * @param color    - The color to evaluate.
 * @returns Total pip count for `color`. Starts at 360 (15 × 24) from the
 *          initial position and decreases toward 0 as stones near the exit.
 *
 * @example
 * ```ts
 * // Initial position: all 15 on the head (path position 0, distance 23).
 * // Each stone contributes (23 + 1) = 24 pips → total = 15 × 24 = 360.
 * pipCount(initialBoard, { w: 0, b: 0 }, 'w'); // → 360
 * ```
 */
export function pipCount(
  board: readonly PointState[],
  bornOff: { w: number; b: number },
  color: StoneColor,
): number {
  let total = 0;

  // On-board stones: each contributes (distanceFromHome + 1) pips.
  for (let point = 0; point < BOARD_POINTS; point++) {
    const ps = board[point];
    if (ps.color === color && ps.count > 0) {
      const dist = distanceFromHome(color, point);
      total += (dist + 1) * ps.count;
    }
  }

  // Borne-off stones contribute 0 pips (they are off the board).
  // Stones not yet accounted for are verified by STONES_PER_SIDE sanity.
  void bornOff; // Explicitly consumed for future callers that pass it in.

  return total;
}

/**
 * Returns `true` when `point` is in `color`'s home quadrant (last 6 points
 * of the path, immediately before the exit).
 *
 * White home: points 0..5 (`WHITE_HOME_END` to `WHITE_HOME_START`).
 * Black home: points 12..17 (`BLACK_HOME_START` to `BLACK_HOME_END`).
 *
 * @param color - The stone color.
 * @param point - The board point index (0..23).
 * @returns `true` if the point is inside `color`'s home quadrant.
 *
 * @example
 * ```ts
 * isInHome('w', 3);  // → true  (White home range 0..5)
 * isInHome('w', 6);  // → false (just outside home)
 * isInHome('b', 15); // → true  (Black home range 12..17)
 * isInHome('b', 11); // → false (Black head, not home)
 * ```
 */
export function isInHome(color: StoneColor, point: PointIndex): boolean {
  if (color === 'w') {
    return point >= WHITE_HOME_END && point <= WHITE_HOME_START;
  }
  return point >= BLACK_HOME_START && point <= BLACK_HOME_END;
}

/**
 * Returns `true` when all of `color`'s stones are either in the home
 * quadrant or already borne off — which is the prerequisite for bearing off.
 *
 * @param board   - The current 24-point board state.
 * @param bornOff - Count of stones already borne off for each color.
 * @param color   - The color to check.
 * @returns `true` if bearing off is geometrically possible (all stones home).
 *
 * @example
 * ```ts
 * allStonesInHome(board, { w: 0, b: 0 }, 'w');
 * // → false at the start (15 stones on point 23, not in home 0..5)
 * ```
 */
export function allStonesInHome(
  board: readonly PointState[],
  bornOff: { w: number; b: number },
  color: StoneColor,
): boolean {
  const alreadyOff = bornOff[color];
  if (alreadyOff === STONES_PER_SIDE) return true; // All borne off.

  for (let point = 0; point < BOARD_POINTS; point++) {
    const ps = board[point];
    if (ps.color === color && ps.count > 0 && !isInHome(color, point)) {
      return false;
    }
  }

  return true;
}
