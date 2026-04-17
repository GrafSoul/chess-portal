import { ClockManager } from '../../engine/ClockManager';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { CapturedPiece, PieceColor, PieceType } from '../../engine/types';

interface PlayerCardProps {
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
  captured: CapturedPiece[];
}

/** Unicode glyphs for chess pieces (filled silhouettes) */
const PIECE_GLYPHS: Record<PieceType, string> = {
  k: '\u265A',
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
  p: '\u265F',
};

/** Material value of a captured piece (used for ordering and material balance) */
const PIECE_VALUES: Record<PieceType, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
  k: 0,
};

/**
 * Threshold below which the clock displays in red (time pressure).
 * Set to 30 seconds — typical bullet/blitz panic threshold.
 */
const LOW_TIME_THRESHOLD_MS = 30_000;

/**
 * Player information card displayed in the chess game side panel.
 *
 * Shows the player's name, a large clock with time-pressure styling,
 * a row of captured opponent pieces sorted by value, and a glow indicator
 * when the player is to move.
 *
 * @example
 * <PlayerCard name="You" color="w" timeMs={300000} isActive={true} captured={[]} />
 */
export function PlayerCard({
  name,
  color,
  timeMs,
  isActive,
  isThinking = false,
  captured,
}: PlayerCardProps) {
  const { t } = useTranslation();
  const isLowTime = timeMs < LOW_TIME_THRESHOLD_MS && isFinite(timeMs);

  // Sort captured pieces by value descending so big pieces appear first
  const sortedCaptured = [...captured].sort(
    (a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type],
  );

  // Material advantage of this player over opponent
  const materialValue = captured.reduce((sum, p) => sum + PIECE_VALUES[p.type], 0);

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
            className={`w-3 h-3 rounded-sm border ${
              color === 'w'
                ? 'bg-white-piece border-white/20'
                : 'bg-black-piece border-white/10'
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

      {/* Captured pieces row + material balance */}
      <div className="mt-3 min-h-[24px] flex items-center gap-2">
        {sortedCaptured.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-0.5 text-[18px] leading-none">
              {sortedCaptured.map((p, i) => (
                <span
                  key={i}
                  className={
                    p.color === 'w' ? 'text-white-piece/90' : 'text-black-piece-fg'
                  }
                  style={{
                    color: p.color === 'w' ? '#e8e0d4' : '#3d2f24',
                    textShadow: p.color === 'b' ? '0 0 1px rgba(255,255,255,0.3)' : 'none',
                  }}
                >
                  {PIECE_GLYPHS[p.type]}
                </span>
              ))}
            </div>
            {materialValue > 0 && (
              <span className="text-[10px] text-text-muted font-mono">
                +{materialValue}
              </span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-text-muted italic">{t('chess.noCaptures')}</span>
        )}
      </div>
    </div>
  );
}
