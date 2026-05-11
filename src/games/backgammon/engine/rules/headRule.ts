/**
 * Head rule for Long Backgammon.
 *
 * In Long Backgammon, a player normally may move at most ONE stone off their
 * head (starting point) per turn. An exception exists in classic and some
 * regional presets: on the very first turn, if the player rolls 6-6, 4-4, or
 * 3-3, they are permitted to move TWO stones off the head.
 *
 * This module exposes the single public function `canLeaveHead` that the move
 * generator calls before adding any sub-move from a head point.
 */

import type { BackgammonState, StoneColor } from '../types';
import { WHITE_HEAD, BLACK_HEAD } from '../constants';

/** Die values that trigger the first-turn head exception (classic rule). */
const HEAD_EXCEPTION_DOUBLES: ReadonlySet<number> = new Set([3, 4, 6]);

/**
 * Returns `true` when the moving player is allowed to lift one more stone
 * off their head in the current turn.
 *
 * The check is purely about the HEAD rule; it does not verify that the source
 * point actually has stones (the caller checks that separately).
 *
 * **Normal rule:** at most 1 stone may leave the head per turn.
 * **Exception:** on `isFirstTurn === true` and `rules.headExceptionOnFirstDoubles === true`,
 * rolling 6-6, 4-4, or 3-3 allows up to 2 stones to leave the head.
 *
 * @param state - The current game state, including `isFirstTurn`, `headTakenThisTurn`, and `rules`.
 * @param color - The color trying to move.
 * @returns `true` if moving a stone off the head is permitted.
 *
 * @example
 * ```ts
 * // First turn, rolled 6-6, head exception enabled → 2 stones allowed
 * canLeaveHead({ ...state, isFirstTurn: true, headTakenThisTurn: 1, dice: { values: [6,6], remaining: [6,6,6] }, rules: { headExceptionOnFirstDoubles: true, ... } }, 'w');
 * // → true (can take a second stone off)
 * ```
 */
export function canLeaveHead(
  state: BackgammonState,
  color: StoneColor,
): boolean {
  const headPoint = color === 'w' ? WHITE_HEAD : BLACK_HEAD;
  const boardPoint = state.board[headPoint];

  // No stones on head → irrelevant (caller should check, but guard here too).
  if (boardPoint.color !== color || boardPoint.count === 0) {
    return false;
  }

  const { headTakenThisTurn, isFirstTurn, rules, dice } = state;

  // Under the exception: first turn + qualifying doubles + rule enabled → allow 2.
  if (
    isFirstTurn &&
    rules.headExceptionOnFirstDoubles &&
    dice !== null &&
    dice.values[0] === dice.values[1] &&
    HEAD_EXCEPTION_DOUBLES.has(dice.values[0])
  ) {
    return headTakenThisTurn < 2;
  }

  // Normal rule: only 1 stone per turn.
  return headTakenThisTurn < 1;
}

/**
 * Returns `true` when `point` is the head for `color`.
 *
 * Convenience helper used by the move generator to detect whether a sub-move
 * originates from the head before calling `canLeaveHead`.
 *
 * @param color - The stone color.
 * @param point - The board point index.
 * @returns `true` if `point` is the head for `color`.
 *
 * @example
 * ```ts
 * isHeadPoint('w', 23); // → true
 * isHeadPoint('b', 11); // → true
 * isHeadPoint('w', 11); // → false
 * ```
 */
export function isHeadPoint(color: StoneColor, point: number): boolean {
  return color === 'w' ? point === WHITE_HEAD : point === BLACK_HEAD;
}
