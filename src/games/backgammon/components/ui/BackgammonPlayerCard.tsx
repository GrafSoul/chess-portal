/**
 * Player information card for the Backgammon game overlay.
 *
 * Displays:
 * - Stone color indicator dot (white or black disc).
 * - Player name (localised "You" / "AI" in AI mode, or "White" / "Black").
 * - Born-off progress as `N / 15` with a mini progress bar.
 * - Active-turn state via an accent-coloured border glow.
 * - Optional AI "thinking" pulsing label.
 *
 * Layout and visual style mirror `GoPlayerCard` for cross-game consistency.
 *
 * @example
 * ```tsx
 * <BackgammonPlayerCard
 *   name="You"
 *   color="w"
 *   bornOff={3}
 *   isActive={true}
 * />
 *
 * <BackgammonPlayerCard
 *   name="AI"
 *   color="b"
 *   bornOff={0}
 *   isActive={false}
 *   isThinking={true}
 * />
 * ```
 */

import { memo } from 'react';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { StoneColor } from '../../engine/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link BackgammonPlayerCard}. */
interface BackgammonPlayerCardProps {
  /** Player display name — e.g. "You", "AI", "White", "Black". */
  name: string;
  /** Stone color the player controls. */
  color: StoneColor;
  /**
   * Number of stones this player has borne off (0–15).
   * Drives the progress bar and the `N / 15` label.
   */
  bornOff: number;
  /**
   * Whether this player is the one to move right now.
   * Renders an accent-coloured border glow when `true`.
   */
  isActive: boolean;
  /**
   * Whether the AI is currently computing for this side.
   * Shows a pulsing "Thinking…" label next to the name. Defaults to `false`.
   */
  isThinking?: boolean;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Backgammon player card with born-off progress bar and active-turn glow.
 *
 * @param props - See {@link BackgammonPlayerCardProps}.
 * @returns The rendered card element.
 */
function BackgammonPlayerCardImpl({
  name,
  color,
  bornOff,
  isActive,
  isThinking = false,
}: BackgammonPlayerCardProps) {
  const { t } = useTranslation();

  /** Born-off percentage for the progress bar (0–100). */
  const pct = Math.min((bornOff / 15) * 100, 100);

  return (
    <div
      className={`bg-bg-primary/75 backdrop-blur-lg border rounded-xl shadow-lg
        transition-all duration-200 pointer-events-auto
        p-2.5 md:p-4 w-36 md:w-48
        ${isActive ? 'border-accent shadow-accent/20' : 'border-border-subtle'}`}
    >
      {/* Header: color dot + name + optional thinking label */}
      <div className="flex items-center justify-between mb-2 gap-1">
        <div className="flex items-center gap-2 min-w-0">
          {/* Stone color indicator */}
          <span
            className={`flex-shrink-0 w-3 h-3 rounded-full ${
              color === 'b'
                ? 'bg-zinc-900 ring-1 ring-white/20'
                : 'bg-zinc-100 ring-1 ring-zinc-300'
            }`}
          />
          <span className="text-[13px] font-medium text-text-primary truncate">
            {name}
          </span>
        </div>
        {isThinking && (
          <span className="text-[10px] text-accent uppercase tracking-wider animate-pulse flex-shrink-0">
            {t('backgammon.aiThinking')}
          </span>
        )}
      </div>

      {/* Born-off progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-muted">{t('backgammon.bornOff')}</span>
          <span className="text-[11px] font-medium text-text-secondary tabular-nums">
            {bornOff} / 15
          </span>
        </div>
        {/* Track */}
        <div className="h-1.5 bg-bg-tertiary/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              color === 'b' ? 'bg-zinc-400' : 'bg-zinc-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Memoised player card — skips re-renders when none of the relevant props
 * changed (name, color, bornOff, isActive, isThinking).
 */
export const BackgammonPlayerCard = memo(BackgammonPlayerCardImpl);
