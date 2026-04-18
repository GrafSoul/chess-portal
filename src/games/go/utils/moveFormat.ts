/**
 * Helpers for formatting moves and rejection reasons for display.
 *
 * Kept in a dedicated module so `GoPage` and its subcomponents (`GoTopBar`,
 * `GoMoveHistory`) can share the logic without re-defining it. Pure functions
 * — no React, no store access, safe to unit-test.
 */

import type { Move, MoveRejectionReason } from '../engine/types';

/**
 * Column letters used for Go coordinate notation.
 *
 * Follows the traditional Go convention of skipping the letter `I` so that
 * columns `H` and `J` are adjacent — this prevents visual confusion with the
 * digit `1` in game records.
 */
const FILE_CHARS = 'ABCDEFGHJKLMNOPQRST';

/**
 * Map a move-rejection reason from the engine to its i18n key.
 *
 * Returns `null` when there is no rejection (i.e. the last move was accepted
 * or no move has been attempted). Callers can use `null` to hide the banner.
 *
 * @param reason - Rejection reason produced by the engine, or `null`.
 * @returns Translation key, or `null` when no banner should be shown.
 *
 * @example
 * ```ts
 * const key = rejectionKey('ko'); // 'go.reject.ko'
 * const none = rejectionKey(null); // null
 * ```
 */
export function rejectionKey(reason: MoveRejectionReason | null): string | null {
  if (!reason) return null;
  switch (reason) {
    case 'ko':
      return 'go.reject.ko';
    case 'suicide':
      return 'go.reject.suicide';
    case 'occupied':
      return 'go.reject.occupied';
    case 'outOfBounds':
      return 'go.reject.outOfBounds';
    case 'gameEnded':
      return 'go.reject.gameEnded';
    default:
      return null;
  }
}

/**
 * Format a move for the move-history sidebar as a short human-readable string.
 *
 * Play moves are rendered in standard Go notation (`D4`, `Q16`, …). Passes and
 * resignations are rendered via i18n keys so they follow the current language.
 *
 * The engine stores the board top-down (y = 0 is the top row) while Go
 * notation counts rows from the bottom (1 = bottom row), so we invert the
 * y-axis here.
 *
 * @param move - Move to format.
 * @param t - Translation function supplying i18n strings.
 * @param boardSize - Board dimension, used to invert the y-axis for notation.
 * @returns Short human-readable move string.
 *
 * @example
 * ```ts
 * formatMove({ kind: 'play', point: { x: 3, y: 15 }, color: 'b' }, t, 19); // 'D4'
 * formatMove({ kind: 'pass', color: 'w' }, t, 19); // whatever t('go.movePass') returns
 * ```
 */
export function formatMove(
  move: Move,
  t: (key: string) => string,
  boardSize: number,
): string {
  if (move.kind === 'pass') return t('go.movePass');
  if (move.kind === 'resign') return t('go.moveResign');
  const row = boardSize - move.point.y;
  return `${FILE_CHARS[move.point.x] ?? '?'}${row}`;
}
