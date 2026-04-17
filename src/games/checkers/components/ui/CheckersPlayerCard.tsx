import { ClockManager } from '../../engine/ClockManager';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { PieceColor } from '../../engine/types';
import type { CapturedCheckerPiece } from '../../stores/useCheckersStore';

interface CheckersPlayerCardProps {
  /** Player display name (e.g. "You", "AI", "White") */
  name: string;
  /** Player color */
  color: PieceColor;
  /** Remaining time in milliseconds */
  timeMs: number;
  /** Whether this player is currently to move */
  isActive: boolean;
  /** Whether the player is "thinking" (AI) */
  isThinking?: boolean;
  /** Pieces this player has captured (opponent pieces) */
  captured: CapturedCheckerPiece[];
  /** Whether to show the clock */
  showClock?: boolean;
}

/**
 * Threshold below which the clock displays in red (time pressure).
 * Set to 30 seconds — typical panic threshold.
 */
const LOW_TIME_THRESHOLD_MS = 30_000;

/**
 * Player information card displayed in the checkers game overlay.
 *
 * Shows the player's name, a large clock with time-pressure styling,
 * a row of captured opponent pieces, and a glow indicator when the
 * player is to move. Identical layout to the chess PlayerCard.
 *
 * @param props Player card properties
 */
export function CheckersPlayerCard({
  name,
  color,
  timeMs,
  isActive,
  isThinking = false,
  captured,
  showClock = true,
}: CheckersPlayerCardProps) {
  const { t } = useTranslation();
  const isLowTime = timeMs < LOW_TIME_THRESHOLD_MS && isFinite(timeMs);

  return (
    <div
      className={`bg-bg-primary/75 backdrop-blur-lg border rounded-xl p-4 shadow-lg
        transition-all duration-200 pointer-events-auto w-56
        ${isActive ? 'border-accent shadow-accent/20' : 'border-border-subtle'}`}
    >
      {/* Header: name + color indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full border ${
              color === 'w'
                ? 'bg-[#f5e6d0] border-[#c8b898]'
                : 'bg-[#2a1a0e] border-[#5a4a3e]'
            }`}
          />
          <span className="text-[13px] font-medium text-text-primary">{name}</span>
        </div>
        {isThinking && (
          <span className="text-[10px] text-accent uppercase tracking-wider animate-pulse">
            {t('chess.thinking')}
          </span>
        )}
      </div>

      {/* Clock — big and prominent */}
      {showClock && (
        <div
          className={`font-mono text-3xl font-bold tabular-nums tracking-tight transition-colors
            ${
              isLowTime
                ? 'text-red-400'
                : isActive
                  ? 'text-text-primary'
                  : 'text-text-secondary'
            }`}
        >
          {ClockManager.formatTime(timeMs)}
        </div>
      )}

      {/* Captured pieces row */}
      <div className={`${showClock ? 'mt-3' : 'mt-1'} min-h-[24px] flex items-center gap-2`}>
        {captured.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {captured.map((p, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border ${
                  p.color === 'w'
                    ? 'bg-[#f5e6d0] border-[#c8b898]'
                    : 'bg-[#2a1a0e] border-[#5a4a3e]'
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-text-muted italic">{t('chess.noCaptures')}</span>
        )}
      </div>
    </div>
  );
}
