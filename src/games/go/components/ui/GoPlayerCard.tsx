/**
 * Player information card for the Go game overlay.
 *
 * Displays the player's name, stone color indicator, captured-stone count,
 * and an optional "thinking" label when the AI is computing. Active-turn
 * state is shown via an accent-colored border glow.
 *
 * Layout mirrors `CheckersPlayerCard` for visual consistency across games.
 */

import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { Stone } from '../../engine/types';

/**
 * Props for the Go player card.
 *
 * @example
 * ```tsx
 * <GoPlayerCard
 *   name="You"
 *   color="b"
 *   capturedCount={3}
 *   isActive={true}
 *   isThinking={false}
 * />
 * ```
 */
interface GoPlayerCardProps {
  /** Player display name (e.g. "You", "AI", "Black"). */
  name: string;
  /** Stone color the player uses. */
  color: Stone;
  /**
   * Number of opponent stones this player has captured.
   * Displayed as up to 10 small circles; excess shown as "+N" label.
   * 0 renders a muted "no captures" placeholder instead.
   */
  capturedCount: number;
  /** Whether this player is currently to move. Drives the accent-border glow. */
  isActive: boolean;
  /**
   * Whether the player is currently computing (AI thinking state).
   * Renders a pulsing "thinking" label next to the name. Defaults to `false`.
   */
  isThinking?: boolean;
}

/**
 * Go player information card with active-turn glow and captured-stone count.
 *
 * Shows the player's stone color dot, display name, and captured stones as
 * small circles (capped at 10 with an overflow label). Active turn is
 * signalled by an accent-colored border glow. AI thinking state adds a
 * pulsing animated label.
 *
 * @param props - Player card properties. See {@link GoPlayerCardProps}.
 * @returns The rendered player card element.
 *
 * @example
 * ```tsx
 * // Human player card at the bottom-left of the board overlay
 * <GoPlayerCard
 *   name={t('go.you')}
 *   color="b"
 *   capturedCount={youCaptured}
 *   isActive={turn === 'b' && isPlaying}
 * />
 *
 * // AI opponent card at the top-left, shows thinking indicator
 * <GoPlayerCard
 *   name={t('go.ai')}
 *   color="w"
 *   capturedCount={opponentCaptured}
 *   isActive={turn === 'w' && isPlaying}
 *   isThinking={isAIThinking}
 * />
 * ```
 */
export function GoPlayerCard({
  name,
  color,
  capturedCount,
  isActive,
  isThinking = false,
}: GoPlayerCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-bg-primary/75 backdrop-blur-lg border rounded-xl p-4 shadow-lg
        transition-all duration-200 pointer-events-auto w-56
        ${isActive ? 'border-accent shadow-accent/20' : 'border-border-subtle'}`}
    >
      {/* Header: name + color indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              color === 'b'
                ? 'bg-zinc-900 ring-1 ring-white/20'
                : 'bg-zinc-100 ring-1 ring-zinc-300'
            }`}
          />
          <span className="text-[13px] font-medium text-text-primary">
            {name}
          </span>
        </div>
        {isThinking && (
          <span className="text-[10px] text-accent uppercase tracking-wider animate-pulse">
            {t('go.thinking')}
          </span>
        )}
      </div>

      {/* Captured stones count */}
      <div className="flex items-center gap-2 mt-1">
        {capturedCount > 0 ? (
          <>
            <div className="flex items-center gap-1">
              {/* Show small circles representing captured opponent stones */}
              {Array.from({ length: Math.min(capturedCount, 10) }).map(
                (_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      color === 'b'
                        ? 'bg-zinc-100 ring-1 ring-zinc-300'
                        : 'bg-zinc-900 ring-1 ring-white/20'
                    }`}
                  />
                ),
              )}
              {capturedCount > 10 && (
                <span className="text-[11px] text-text-muted ml-0.5">
                  +{capturedCount - 10}
                </span>
              )}
            </div>
            <span className="text-[11px] text-text-secondary font-medium">
              {capturedCount} {t('go.captured')}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-text-muted italic">
            {t('go.noCaptures')}
          </span>
        )}
      </div>
    </div>
  );
}
