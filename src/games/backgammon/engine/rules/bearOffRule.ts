/**
 * Bear-off rules for Long Backgammon.
 *
 * Bearing off is the final phase: a player moves stones off the board once
 * all 15 of their stones are in their home quadrant or already borne off.
 *
 * Bear-off sub-move validity:
 * 1. If the die exactly matches the distance from `fromPoint` to the exit → legal.
 * 2. If the die is GREATER than the required distance → legal only when `fromPoint`
 *    is the farthest-from-exit own stone in the home quadrant (no own stone
 *    exists at a higher path position / farther from exit).
 * 3. If the die is LESS than the required distance → illegal (normal move).
 */

import type { BackgammonState, StoneColor, PointIndex } from '../types';
import { allStonesInHome, distanceFromHome, pathPosition } from '../pathUtils';
import { BOARD_POINTS } from '../constants';

/**
 * Returns `true` when `color` is eligible to start bearing off.
 *
 * The prerequisite is that every one of `color`'s 15 stones is either
 * already borne off or currently in the home quadrant.
 *
 * @param state - The current game state.
 * @param color - The color to check.
 * @returns `true` if bearing off is currently allowed.
 *
 * @example
 * ```ts
 * // Initial position: all stones on head, not in home → false
 * canBearOff(initialState, 'w'); // → false
 * ```
 */
export function canBearOff(state: BackgammonState, color: StoneColor): boolean {
  return allStonesInHome(state.board, state.bornOff, color);
}

/**
 * Validates a single bear-off sub-move.
 *
 * Assumes `canBearOff(state, color)` has already returned `true`.
 * Checks whether the die value `die` may legally be used to bear off the
 * stone on `fromPoint`.
 *
 * **Exact match:** the die equals the exit distance from `fromPoint` → legal.
 *
 * **Over-distance:** the die is larger than the exit distance → legal ONLY
 * when `fromPoint` is the farthest own stone from the exit in the home
 * quadrant (i.e. there is no own stone at a higher path position
 * / farther from the exit).
 *
 * **Under-distance:** the die is smaller than the exit distance → illegal
 * from this function's perspective (the caller should check if a normal
 * in-board move is possible instead).
 *
 * @param state     - The current game state.
 * @param color     - The color bearing off.
 * @param fromPoint - The board point the stone is on (must be in home).
 * @param die       - The die value to use for this sub-move.
 * @returns `true` if the bear-off move is legal.
 *
 * @example
 * ```ts
 * // White stone on point 2 (distance = 2), die = 2 → exact match → legal
 * validBearOffMove(state, 'w', 2, 2); // → true
 *
 * // White stone on point 3 (distance = 3), die = 5 →
 * // over-distance: legal only if no white stone is farther from exit (points 4 or 5)
 * validBearOffMove(state, 'w', 3, 5); // → depends on board
 * ```
 */
export function validBearOffMove(
  state: BackgammonState,
  color: StoneColor,
  fromPoint: PointIndex,
  die: number,
): boolean {
  const exitDistance = distanceFromHome(color, fromPoint);

  // Under-distance: the die cannot reach the exit → not a bear-off move.
  if (die < exitDistance + 1) {
    return false;
  }

  // Exact match: die == exitDistance + 1 (distance 0 means 1 pip to exit).
  // Because distanceFromHome(color, point) = 23 - pathPosition, a stone on
  // the last home point (distanceFromHome = 0) needs exactly 1 pip to exit.
  // We define "exit pip requirement" as distanceFromHome + 1.
  const pipsRequired = exitDistance + 1;

  if (die === pipsRequired) {
    return true;
  }

  // Over-distance: only legal if no own stone is farther from exit.
  // "Farther from exit" = higher path position index (closer to head).
  // We want to know: is there any own stone with pathPosition < pathPosition(fromPoint)?
  // (Lower path position means farther from exit / closer to head.)
  const fromPathPos = pathPosition(color, fromPoint);

  for (let point = 0; point < BOARD_POINTS; point++) {
    const ps = state.board[point];
    if (ps.color === color && ps.count > 0) {
      const pointPathPos = pathPosition(color, point);
      // If another own stone has a LOWER path position it is farther from exit.
      if (pointPathPos < fromPathPos) {
        return false;
      }
    }
  }

  // `fromPoint` is the farthest (or tied-farthest) stone → over-distance bear-off is legal.
  return true;
}
