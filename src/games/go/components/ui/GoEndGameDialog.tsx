import { useCallback } from 'react';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import { useEscapeClose } from '../../hooks/useEscapeClose';
import type { Stone } from '../../engine/types';
import type { GoGameMode } from '../../stores/useGoStore';

/**
 * Props for {@link GoEndGameDialog}.
 *
 * The parent is responsible for deciding when the dialog should appear
 * (typically when `gameStatus === 'ended'` AND the player has not yet
 * dismissed it).
 */
export interface GoEndGameDialogProps {
  /** Winner of the game, or `'draw'`. */
  winner: Stone | 'draw' | null;
  /** Game mode — controls "victory/defeat" vs plain colour-based messaging. */
  gameMode: GoGameMode;
  /** Colour controlled by the human player, used to decide victory vs defeat. */
  playerColor: Stone;
  /** Total number of moves played — shown as a small subtitle. */
  moveCount: number;
  /** Starts a new game with the current settings. */
  onPlayAgain: () => void;
  /** Closes the dialog so the player can review the final position. */
  onReview: () => void;
}

/**
 * Full-screen centred modal shown at the end of a game.
 *
 * Message logic:
 * - In `'ai'` mode → **Victory** or **Defeat** depending on whether the
 *   player's colour matches the winner.
 * - In `'local'` mode → shows the winning colour name (Black wins / White wins).
 * - `'draw'` in either mode → shows the draw string.
 *
 * @param props - See {@link GoEndGameDialogProps}.
 *
 * @example
 * ```tsx
 * {gameStatus === 'ended' && !dismissed && (
 *   <GoEndGameDialog
 *     winner={winner}
 *     gameMode={gameMode}
 *     playerColor={playerColor}
 *     moveCount={moveHistory.length}
 *     onPlayAgain={handleNewGame}
 *     onReview={() => setDismissed(true)}
 *   />
 * )}
 * ```
 */
export function GoEndGameDialog({
  winner,
  gameMode,
  playerColor,
  moveCount,
  onPlayAgain,
  onReview,
}: GoEndGameDialogProps) {
  const { t } = useTranslation();

  // Esc dismisses the dialog by triggering the review (non-destructive) action.
  const handleEscape = useCallback(() => onReview(), [onReview]);
  useEscapeClose(true, handleEscape);

  const title =
    winner === 'draw'
      ? t('go.draw')
      : gameMode === 'ai' && winner === playerColor
        ? t('go.victory')
        : gameMode === 'ai' && winner !== playerColor
          ? t('go.defeat')
          : winner === 'b'
            ? t('go.blackWins')
            : t('go.whiteWins');

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="go-endgame-title"
    >
      <div className="bg-bg-card border border-border-primary rounded-xl p-6 shadow-lg text-center max-w-xs">
        <h2 id="go-endgame-title" className="text-xl font-bold text-text-primary mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {moveCount} {t('go.moves')}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium
              hover:bg-accent/90 transition-colors"
          >
            {t('go.playAgain')}
          </button>
          <button
            onClick={onReview}
            className="px-4 py-2 bg-bg-hover border border-border-primary rounded-lg text-sm
              text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('go.reviewBoard')}
          </button>
        </div>
      </div>
    </div>
  );
}
