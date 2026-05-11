/**
 * End-of-game modal dialog for Backgammon.
 *
 * Displayed when `gameStatus === 'ended'`. Shows the game outcome and
 * provides two actions:
 * - **Play again** — immediately starts a new game.
 * - **Review board** — dismisses the dialog so the player can inspect the
 *   final board position without resetting.
 *
 * In AI mode:
 * - Shows "Victory!" (accented) when the human player won.
 * - Shows "Defeat" when the AI won.
 *
 * In local two-player mode:
 * - Shows "{White/Black} — Victory!" based on the winner color.
 *
 * An extra badge is shown for special win types:
 * - `mars` → Mars! (winner bore off all pieces, opponent none).
 * - `kokc` → Kokc! (triple win variant, when rules allow).
 *
 * Keyboard: Escape dismisses the dialog (same as Review board).
 *
 * @example
 * ```tsx
 * {isFinished && !gameOverDismissed && (
 *   <BackgammonEndGameDialog
 *     winner={winner}
 *     winType={winType}
 *     gameMode={gameMode}
 *     playerColor={playerColor}
 *     onPlayAgain={handleNewGame}
 *     onReview={() => setGameOverDismissed(true)}
 *   />
 * )}
 * ```
 */

import { useCallback, useEffect } from 'react';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { StoneColor, WinType } from '../../engine/types';
import type { BackgammonGameMode } from '../../stores/useBackgammonStore';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link BackgammonEndGameDialog}. */
interface BackgammonEndGameDialogProps {
  /** The color that won, or `null` (should not occur in backgammon — always has a winner). */
  winner: StoneColor | null;
  /** Win classification: `'normal'`, `'mars'`, or `'kokc'`. */
  winType: WinType | null;
  /** Current game mode — determines how the result is labeled. */
  gameMode: BackgammonGameMode;
  /** The human player's color — used to determine "Victory" vs "Defeat" in AI mode. */
  playerColor: StoneColor;
  /** Called when the player clicks "Play again". Should reset and start a new game. */
  onPlayAgain: () => void;
  /**
   * Called when the player clicks "Review board" or presses Escape.
   * Should close this dialog without resetting the game.
   */
  onReview: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Backgammon end-of-game overlay dialog.
 *
 * Renders a centered card on a semi-transparent backdrop. Focuses
 * accessibility with `role="dialog"` and `aria-modal="true"`.
 *
 * @param props - See {@link BackgammonEndGameDialogProps}.
 * @returns The rendered end-game dialog element.
 */
export function BackgammonEndGameDialog({
  winner,
  winType,
  gameMode,
  playerColor,
  onPlayAgain,
  onReview,
}: BackgammonEndGameDialogProps) {
  const { t } = useTranslation();

  // Escape key dismisses the dialog (same as Review board).
  const handleReview = useCallback(() => onReview(), [onReview]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleReview();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleReview]);

  // Determine the human player's perspective for "Victory" / "Defeat".
  const humanWon = gameMode === 'ai' ? winner === playerColor : null;

  // Build the main heading text based on game mode.
  const headingText =
    gameMode === 'ai'
      ? t(humanWon ? 'backgammon.victory' : 'backgammon.defeat')
      : `${winner === 'w' ? t('backgammon.white') : t('backgammon.black')} — ${t('backgammon.victory')}`;

  // Accent the heading only when the human player won in AI mode.
  const headingClass =
    gameMode === 'ai' && humanWon ? 'text-accent' : 'text-text-primary';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center
        bg-black/50 pointer-events-auto z-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bg-end-dialog-heading"
    >
      <div
        className="bg-bg-card border border-border-subtle rounded-2xl
          p-8 text-center shadow-2xl max-w-xs w-full mx-4"
      >
        {/* Outcome heading */}
        <h2
          id="bg-end-dialog-heading"
          className={`text-2xl font-bold mb-1 ${headingClass}`}
        >
          {headingText}
        </h2>

        {/* Win type badge — mars or kokc */}
        {winType === 'mars' && (
          <p className="text-amber-400 font-semibold text-sm mb-1">
            {t('backgammon.mars')}
          </p>
        )}
        {winType === 'kokc' && (
          <p className="text-amber-400 font-semibold text-sm mb-1">
            {t('backgammon.kokc')}
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="bg-accent text-bg-primary font-semibold rounded-lg px-6 py-2.5
              hover:opacity-90 active:scale-95 transition-all cursor-pointer w-full"
          >
            {t('backgammon.playAgain')}
          </button>
          <button
            type="button"
            onClick={handleReview}
            className="bg-bg-secondary border border-border-subtle text-text-secondary
              font-medium rounded-lg px-6 py-2
              hover:text-text-primary hover:border-accent/40
              transition-all cursor-pointer w-full text-sm"
          >
            {t('backgammon.review')}
          </button>
        </div>
      </div>
    </div>
  );
}
