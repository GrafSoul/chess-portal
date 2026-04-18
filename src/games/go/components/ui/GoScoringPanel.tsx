import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { ScoreBreakdown } from '../../engine/types';

/**
 * Props for {@link GoScoringPanel}.
 *
 * Rendered only during the scoring phase (after two consecutive passes). The
 * parent is responsible for unmounting it once scoring is finalised.
 */
export interface GoScoringPanelProps {
  /** Live score breakdown — recomputed in the store when dead stones toggle. */
  breakdown: ScoreBreakdown;
  /** Confirms the score and ends the game. */
  onFinalize: () => void;
  /** Undoes the second pass so the player can continue playing. */
  onResume: () => void;
}

/**
 * Bottom-right panel shown during the scoring phase.
 *
 * Displays per-player breakdowns (territory / stones / prisoners / komi for
 * white) plus the current winner and margin. Two actions:
 * - **Resume** — undoes the last pass so the player can continue playing.
 * - **Confirm** — locks in the result and moves the game to `ended`.
 *
 * The outer wrapper uses `pointer-events-none` so the 3D board remains
 * clickable for dead-stone marking; only the inner card captures clicks.
 *
 * @param props - See {@link GoScoringPanelProps}.
 *
 * @example
 * ```tsx
 * {gameStatus === 'scoring' && breakdown && (
 *   <GoScoringPanel
 *     breakdown={breakdown}
 *     onFinalize={finalizeScore}
 *     onResume={undoSingle}
 *   />
 * )}
 * ```
 */
export function GoScoringPanel({ breakdown, onFinalize, onResume }: GoScoringPanelProps) {
  const { t } = useTranslation();

  const verdict =
    breakdown.winner === 'draw'
      ? t('go.draw')
      : breakdown.winner === 'b'
        ? `${t('go.blackWins')} · +${breakdown.margin}`
        : `${t('go.whiteWins')} · +${breakdown.margin}`;

  return (
    <div
      className="absolute inset-0 flex items-end justify-end
        pointer-events-none z-10 p-4"
    >
      <div
        className="bg-bg-card/95 backdrop-blur-lg border border-border-primary rounded-2xl
          px-6 py-5 shadow-xl text-center max-w-xs pointer-events-auto"
        role="region"
        aria-labelledby="go-scoring-title"
      >
        <h2 id="go-scoring-title" className="text-xl font-bold text-text-primary mb-1">
          {t('go.scoringTitle')}
        </h2>
        <p className="text-text-secondary text-xs mb-5">
          {t('go.scoringDeadStonesHint')}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-bg-secondary rounded-lg px-4 py-3 border border-border-subtle">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-zinc-900 ring-1 ring-white/20" />
              <span className="font-medium text-text-primary">
                {t('go.black')}
              </span>
            </div>
            <div className="text-text-muted text-xs space-y-0.5">
              <div>
                {t('go.territory')}: {breakdown.black.territory}
              </div>
              <div>
                {t('go.stones')}: {breakdown.black.stones}
              </div>
              <div>
                {t('go.prisoners')}: {breakdown.black.prisoners}
              </div>
            </div>
            <div className="mt-2 text-text-primary font-semibold">
              {t('go.total')}: {breakdown.black.total}
            </div>
          </div>

          <div className="bg-bg-secondary rounded-lg px-4 py-3 border border-border-subtle">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-zinc-100" />
              <span className="font-medium text-text-primary">
                {t('go.white')}
              </span>
            </div>
            <div className="text-text-muted text-xs space-y-0.5">
              <div>
                {t('go.territory')}: {breakdown.white.territory}
              </div>
              <div>
                {t('go.stones')}: {breakdown.white.stones}
              </div>
              <div>
                {t('go.prisoners')}: {breakdown.white.prisoners}
              </div>
              <div>
                {t('go.komi')}: {breakdown.white.komi}
              </div>
            </div>
            <div className="mt-2 text-text-primary font-semibold">
              {t('go.total')}: {breakdown.white.total}
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-5">{verdict}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onResume}
            className="px-4 py-2 bg-bg-hover border border-border-primary rounded-lg text-sm
              text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('go.resume')}
          </button>
          <button
            onClick={onFinalize}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium
              hover:bg-accent/90 transition-colors"
          >
            {t('go.confirmResult')}
          </button>
        </div>
      </div>
    </div>
  );
}
