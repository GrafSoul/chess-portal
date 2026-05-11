/**
 * Six-block rule for Long Backgammon.
 *
 * A "prime" of 6 consecutive points occupied by the same color forms a
 * blocking wall. Depending on the rule preset, this may be legal or illegal.
 *
 * Three modes (from `BackgammonRules.sixBlockRule`):
 *
 * - `'always-allowed'`   — A 6-block may always be formed; return `false`.
 * - `'always-forbidden'` — A 6-block may never be formed; detect and return `true`.
 * - `'classical'`        — Forbidden ONLY when no opponent stone has already
 *                          "passed" the blocking prime in the opponent's path
 *                          direction. If at least one opponent stone is at a
 *                          path position strictly greater than the exit point
 *                          of the 6-block (i.e. it is already past the block
 *                          in the opponent's direction of travel), the block
 *                          is legal even if the 6-block condition holds.
 */

import type { PointState, StoneColor } from '../types';
import type { BackgammonRules } from '../../config/variants';
import { BOARD_POINTS, WHITE_HEAD, BLACK_HEAD } from '../constants';
import { pathPosition } from '../pathUtils';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether `board` contains any run of 6 consecutive points all
 * occupied by `color`. Returns the [startIndex, endIndex] of the first such
 * run found, or `null` if none exists.
 *
 * Points wrap around the ring: index 23 is adjacent to index 0 for checking
 * contiguity. To keep this simple we check the flat 0..23 range plus a
 * wrap-around check for runs that span the 23/0 boundary.
 *
 * @param board - The current board state after a tentative sub-move.
 * @param color - The color to check for a 6-block.
 * @returns The [first, last] inclusive board indices of the 6-block, or `null`.
 */
function findSixBlock(
  board: readonly PointState[],
  color: StoneColor,
): [number, number] | null {
  // Build a boolean ring for occupation by `color`.
  const occupied: boolean[] = new Array<boolean>(BOARD_POINTS).fill(false);
  for (let i = 0; i < BOARD_POINTS; i++) {
    occupied[i] = board[i].color === color && board[i].count > 0;
  }

  // Check all 24 possible starting positions (with wrap-around).
  for (let start = 0; start < BOARD_POINTS; start++) {
    let run = 0;
    for (let offset = 0; offset < 6; offset++) {
      if (occupied[(start + offset) % BOARD_POINTS]) {
        run++;
      } else {
        break;
      }
    }
    if (run >= 6) {
      const end = (start + 5) % BOARD_POINTS;
      return [start, end];
    }
  }

  return null;
}

/**
 * Returns `true` when at least one opponent stone has already "passed" the
 * 6-block in the opponent's path direction.
 *
 * "Passed" means the opponent stone is at a path position greater than the
 * path position of the end of the 6-block as seen from the opponent's
 * perspective. In other words: the opponent stone is closer to the exit than
 * the far end of the block.
 *
 * Algorithm:
 * 1. Find the path position of every point in the 6-block from the opponent's
 *    perspective.
 * 2. The "exit end" of the block (the point closest to the opponent's exit)
 *    has the highest path position among the 6 block points.
 * 3. Any opponent stone whose path position > that max is "past" the block.
 *
 * @param board        - The board state.
 * @param blockStart   - First board index of the 6-block (may wrap).
 * @param blockEnd     - Last board index of the 6-block (may wrap).
 * @param blockerColor - The color that formed the block.
 * @returns `true` if at least one opponent stone has passed the block.
 */
function hasOpponentPassedBlock(
  board: readonly PointState[],
  blockStart: number,
  blockEnd: number,
  blockerColor: StoneColor,
): boolean {
  const opponentColor: StoneColor = blockerColor === 'w' ? 'b' : 'w';

  // Collect path positions of all 6 block points from the opponent's perspective.
  const blockPointPathPositions: number[] = [];
  for (let offset = 0; offset < 6; offset++) {
    const boardPoint = (blockStart + offset) % BOARD_POINTS;
    blockPointPathPositions.push(pathPosition(opponentColor, boardPoint));
  }
  void blockEnd; // Included via the loop above; suppress unused-var warning.

  // The "exit" end of the block, from opponent's perspective, has the highest
  // path position (closer to the opponent's home exit).
  const maxPathPosInBlock = Math.max(...blockPointPathPositions);

  // Now check whether any opponent stone sits at a higher path position
  // (i.e. is closer to the exit than the exit end of the block).
  for (let point = 0; point < BOARD_POINTS; point++) {
    const ps = board[point];
    if (ps.color === opponentColor && ps.count > 0) {
      // Exclude the opponent's own head — a stone sitting unmoved on its
      // head has not "passed" anything.
      const opponentHead = opponentColor === 'w' ? WHITE_HEAD : BLACK_HEAD;
      if (point === opponentHead) continue;

      const opponentPathPos = pathPosition(opponentColor, point);
      if (opponentPathPos > maxPathPosInBlock) {
        return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns `true` when applying `boardAfterMove` would create an illegal
 * 6-block according to the active `rules.sixBlockRule` setting.
 *
 * Call this AFTER the tentative board state has been computed (i.e. pass the
 * board resulting from applying a sub-move, not the board before).
 *
 * @param boardAfterMove - The board state after the tentative sub-move.
 * @param color          - The color that just moved (potential blocker).
 * @param rules          - The active rule configuration.
 * @returns `true` if the move is illegal due to the 6-block rule.
 *
 * @example
 * ```ts
 * // always-allowed → always false
 * wouldCreateIllegal6Block(board, 'w', { sixBlockRule: 'always-allowed', ... });
 * // → false
 *
 * // always-forbidden + 6-block present → true
 * wouldCreateIllegal6Block(board, 'w', { sixBlockRule: 'always-forbidden', ... });
 * // → true  (if a 6-block exists for 'w')
 * ```
 */
export function wouldCreateIllegal6Block(
  boardAfterMove: readonly PointState[],
  color: StoneColor,
  rules: BackgammonRules,
): boolean {
  const { sixBlockRule } = rules;

  if (sixBlockRule === 'always-allowed') {
    return false;
  }

  const sixBlock = findSixBlock(boardAfterMove, color);

  if (sixBlock === null) {
    // No 6-block formed — always legal.
    return false;
  }

  if (sixBlockRule === 'always-forbidden') {
    return true;
  }

  // 'classical': illegal only when no opponent stone has passed the block.
  return !hasOpponentPassedBlock(boardAfterMove, sixBlock[0], sixBlock[1], color);
}
