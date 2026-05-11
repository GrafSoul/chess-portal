/**
 * Board evaluation heuristics for the Long Backgammon expectimax AI.
 *
 * All functions are pure (no state mutation) and operate on `BackgammonState`.
 * They are grouped here — rather than inside the AI modules — because they
 * depend only on engine types and path utilities, not on AI-specific logic.
 *
 * Heuristic weights (used by `evaluateHeuristic`):
 * | Feature                | Weight | Rationale                                   |
 * |------------------------|--------|---------------------------------------------|
 * | pipDiff                |   10   | Primary race metric                         |
 * | bornOffDiff            |  500   | Strongly rewards having borne off stones     |
 * | stonesInHomeDiff       |   30   | Rewards preparation for bear-off phase      |
 * | blockCountDiff         |   20   | Building points (2+ stones) is strategic     |
 * | primeLength            |   15   | Long primes in home are very strong          |
 * | stonesOnHead (penalty) |  -25   | Penalise stones stuck on the head            |
 */

import type { BackgammonState, StoneColor, PointState } from './types';
import { pipCount as computePipCount, pathPosition, isInHome } from './pathUtils';
import { BOARD_POINTS } from './constants';

// ---------------------------------------------------------------------------
// Individual feature functions
// ---------------------------------------------------------------------------

/**
 * Computes the pip-count difference: own pip count minus opponent pip count.
 *
 * A negative value (own pips < opponent pips) is favorable for `color`.
 * The AI maximizes `forColor`, so the evaluator returns negative values for
 * this term and the weight is applied positively as `-pipDiff * W_PIP`.
 *
 * @param board   - The current 24-point board.
 * @param bornOff - Counts of borne-off stones per color.
 * @param color   - The color to evaluate for.
 * @returns Own pip count minus opponent pip count.
 *
 * @example
 * ```ts
 * // Positive → opponent is winning the race; negative → own color is winning.
 * pipDiff(board, bornOff, 'w');
 * ```
 */
export function pipDiff(
  board: readonly PointState[],
  bornOff: { w: number; b: number },
  color: StoneColor,
): number {
  const opponent: StoneColor = color === 'w' ? 'b' : 'w';
  const ownPips = computePipCount(board, bornOff, color);
  const oppPips = computePipCount(board, bornOff, opponent);
  return ownPips - oppPips;
}

/**
 * Counts the number of points occupied by 2 or more of `color`'s stones
 * (a "block" or "made point"). Blocks prevent the opponent from passing.
 *
 * @param board - The current 24-point board.
 * @param color - The color to evaluate for.
 * @returns Number of points with 2+ own stones.
 *
 * @example
 * ```ts
 * blockCount(board, 'w'); // → 0 at start (15 on one point, counts as 1)
 * ```
 */
export function blockCount(
  board: readonly PointState[],
  color: StoneColor,
): number {
  let count = 0;
  for (let i = 0; i < BOARD_POINTS; i++) {
    if (board[i].color === color && board[i].count >= 2) {
      count++;
    }
  }
  return count;
}

/**
 * Returns the length of the longest prime (consecutive run of blocked points)
 * in `color`'s home quadrant.
 *
 * Only considers home points because a prime there directly blocks the
 * opponent from escaping. Non-home primes are partially captured by
 * `blockCount`.
 *
 * @param board - The current 24-point board.
 * @param color - The color to evaluate for.
 * @returns Length of the longest consecutive home-quadrant prime (0..6).
 *
 * @example
 * ```ts
 * primeLength(board, 'w'); // → 3 if three consecutive home points are blocked
 * ```
 */
export function primeLength(
  board: readonly PointState[],
  color: StoneColor,
): number {
  let maxRun = 0;
  let run = 0;

  // Iterate through all board points; check those in home, in path order.
  // We check all 24 points but only count home points (isInHome).
  for (let i = 0; i < BOARD_POINTS; i++) {
    if (isInHome(color, i) && board[i].color === color && board[i].count >= 2) {
      run++;
      if (run > maxRun) maxRun = run;
    } else if (isInHome(color, i)) {
      run = 0;
    }
  }

  return maxRun;
}

/**
 * Counts how many of `color`'s stones are currently in the home quadrant
 * (but not yet borne off).
 *
 * @param board - The current 24-point board.
 * @param color - The color to evaluate for.
 * @returns Number of own stones in home.
 *
 * @example
 * ```ts
 * stonesInHomeCount(board, 'w'); // → 0 at start
 * ```
 */
export function stonesInHomeCount(
  board: readonly PointState[],
  color: StoneColor,
): number {
  let count = 0;
  for (let i = 0; i < BOARD_POINTS; i++) {
    if (board[i].color === color && isInHome(color, i)) {
      count += board[i].count;
    }
  }
  return count;
}

/**
 * Counts how many of `color`'s stones are still on their head (starting point).
 *
 * A high value is bad: stones stuck on the head cannot contribute to blocking
 * or bear-off. Used as a penalty term.
 *
 * @param board - The current 24-point board.
 * @param color - The color to evaluate for.
 * @returns Number of own stones still on the head.
 *
 * @example
 * ```ts
 * stonesOnHead(board, 'w'); // → 15 at the very start
 * ```
 */
export function stonesOnHead(
  board: readonly PointState[],
  color: StoneColor,
): number {
  // Head is at path position 0; distanceFromHome == 23.
  // Easier: find the point with pathPosition == 0 for color.
  for (let i = 0; i < BOARD_POINTS; i++) {
    if (pathPosition(color, i) === 0) {
      return board[i].color === color ? board[i].count : 0;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Composite heuristic
// ---------------------------------------------------------------------------

/** Heuristic weight constants, documented here for easy tuning. */
const W_PIP = 10;
const W_BORNE = 500;
const W_HOME = 30;
const W_BLOCKS = 20;
const W_PRIME = 15;
const W_HEAD = 25; // Penalty (subtracted)

/**
 * Computes a scalar heuristic evaluation of `state` from the perspective of
 * `forColor`. Higher values indicate a more favorable position for `forColor`.
 *
 * Formula:
 * ```
 * score =
 *   -W_PIP    * pipDiff(color)               // lower own pip count is better
 *   +W_BORNE  * (ownBornOff - oppBornOff)    // borne-off stones are won
 *   +W_HOME   * (ownInHome - oppInHome)      // home stones set up bear-off
 *   +W_BLOCKS * (ownBlocks - oppBlocks)      // blocking points are strategic
 *   +W_PRIME  * (ownPrime  - oppPrime)       // long home primes are very strong
 *   -W_HEAD   * ownOnHead                    // penalty for head stones
 * ```
 *
 * Weights are intentionally asymmetric — the weights were chosen as a
 * reasonable starting point and should be tuned via self-play in Sprint 4.
 *
 * @param state    - The current game state.
 * @param forColor - The color to evaluate for (positive = good for `forColor`).
 * @returns Heuristic score; unbounded, typically in the range [–20000, 20000].
 *
 * @example
 * ```ts
 * evaluateHeuristic(state, 'w'); // → positive if White is ahead
 * ```
 */
export function evaluateHeuristic(
  state: BackgammonState,
  forColor: StoneColor,
): number {
  const { board, bornOff } = state;
  const opponent: StoneColor = forColor === 'w' ? 'b' : 'w';

  const ownPipDiff = pipDiff(board, bornOff, forColor);
  const ownBornOff = bornOff[forColor];
  const oppBornOff = bornOff[opponent];
  const ownInHome = stonesInHomeCount(board, forColor);
  const oppInHome = stonesInHomeCount(board, opponent);
  const ownBlocks = blockCount(board, forColor);
  const oppBlocks = blockCount(board, opponent);
  const ownPrime = primeLength(board, forColor);
  const oppPrime = primeLength(board, opponent);
  const ownHead = stonesOnHead(board, forColor);

  return (
    -W_PIP    * ownPipDiff +
     W_BORNE  * (ownBornOff - oppBornOff) +
     W_HOME   * (ownInHome  - oppInHome) +
     W_BLOCKS * (ownBlocks  - oppBlocks) +
     W_PRIME  * (ownPrime   - oppPrime) -
     W_HEAD   * ownHead
  );
}
