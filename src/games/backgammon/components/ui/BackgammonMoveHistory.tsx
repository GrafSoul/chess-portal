/**
 * Scrollable move-history sidebar for the Backgammon game.
 *
 * Renders completed turns in reverse chronological order (most recent at top).
 * Each entry shows:
 * - Turn number and the color stone dot.
 * - Dice values `[d1, d2]`.
 * - Sub-move list in `from → to` notation (1-indexed points, or `→ off`).
 *
 * Point indices are stored as 0-based internally; this component displays them
 * as 1-based to match the classic board labeling shown to the player.
 *
 * If the move history is empty the panel displays a placeholder message.
 *
 * @example
 * ```tsx
 * <BackgammonMoveHistory moves={moveHistory} />
 * ```
 */

import { memo } from 'react';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { HistoryEntry, PointIndex } from '../../engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts an internal 0-based point index (or the string `'off'`) to a
 * human-readable 1-based board label.
 *
 * @param point - A `PointIndex` (0–23) or the literal `'off'`.
 * @returns A string such as `"24"`, `"1"`, or `"off"`.
 */
function formatPoint(point: PointIndex | 'off'): string {
  if (point === 'off') return 'off';
  // Display as 1-based; board points visible to the player are labelled 1–24.
  return String((point as number) + 1);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link BackgammonMoveHistory}. */
interface BackgammonMoveHistoryProps {
  /** Completed turn history from the game store, newest entries last. */
  moves: HistoryEntry[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Backgammon move history sidebar panel.
 *
 * Pinned to the top-right of the overlay. Shows turns in reverse order so the
 * most recent action is always visible without scrolling.
 *
 * @param props - See {@link BackgammonMoveHistoryProps}.
 * @returns The rendered history panel element.
 */
function BackgammonMoveHistoryImpl({ moves }: BackgammonMoveHistoryProps) {
  const { t } = useTranslation();

  return (
    <div
      className="absolute top-14 right-2 md:top-20 md:right-4
        bg-bg-primary/75 backdrop-blur-lg border border-border-subtle
        rounded-xl shadow-lg pointer-events-auto
        w-36 md:w-48 max-h-64 md:max-h-96 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-2.5 md:px-4 py-2 border-b border-border-subtle flex-shrink-0">
        <h2 className="text-[11px] md:text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
          {t('backgammon.moveHistory')}
        </h2>
      </div>

      {/* Scrollable turn list */}
      <div className="overflow-y-auto flex-1 px-2 py-1.5 space-y-2.5">
        {moves.length === 0 ? (
          <p className="text-[10px] text-text-muted italic text-center py-2">
            {t('backgammon.noMoves')}
          </p>
        ) : (
          // Reverse so newest turn appears at the top.
          [...moves].reverse().map((entry, reversedIdx) => {
            const originalIdx = moves.length - 1 - reversedIdx;
            return (
              <div key={originalIdx} className="text-[10px] md:text-[11px]">
                {/* Turn header: number + color dot + dice */}
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-text-muted tabular-nums">
                    {entry.turnNumber}.
                  </span>
                  <span
                    className={`flex-shrink-0 w-2 h-2 rounded-full ${
                      entry.color === 'b'
                        ? 'bg-zinc-800 ring-1 ring-white/20'
                        : 'bg-zinc-100 ring-1 ring-zinc-300'
                    }`}
                  />
                  <span className="text-text-muted font-mono">
                    [{entry.dice[0]},{entry.dice[1]}]
                  </span>
                </div>

                {/* Sub-move list */}
                {entry.sequence.length > 0 ? (
                  <div className="ml-3 text-text-secondary space-y-px leading-relaxed">
                    {entry.sequence.map((sub, si) => (
                      <div key={si} className="font-mono">
                        {formatPoint(sub.from)}→{formatPoint(sub.to)}
                      </div>
                    ))}
                  </div>
                ) : (
                  // No legal moves — turn was skipped.
                  <div className="ml-3 text-text-muted italic">—</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Memoised move history panel.
 *
 * Re-renders only when the `moves` array reference changes — i.e. after each
 * committed turn.
 */
export const BackgammonMoveHistory = memo(BackgammonMoveHistoryImpl);
