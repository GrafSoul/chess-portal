import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { GameMode, GameStatus, PieceColor } from '../../engine/types';

interface GameOverDialogProps {
  /** Whether the dialog is currently open. */
  isOpen: boolean;
  /** Terminal game status (`checkmate` / `stalemate` / `draw` / `resigned` / `timeout`). */
  status: GameStatus;
  /** Winning color, or `null` for a draw. */
  winner: PieceColor | null;
  /** Color the human played. */
  playerColor: PieceColor;
  /** Game mode — drives whether outcome is shown from the human's perspective. */
  gameMode: GameMode;
  /** Total half-moves played. */
  moveCount: number;
  /** Game length (ms). */
  durationMs: number;
  /** Start a fresh game. */
  onPlayAgain: () => void;
  /** Dismiss the dialog without resetting. */
  onClose: () => void;
}

/** Format `mm:ss` (or `h:mm:ss`) for the duration stat box. */
function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * End-of-game overlay shown when the chess game reaches a terminal state.
 *
 * Displays the outcome (Victory / Defeat / Draw, from the human's perspective
 * in AI mode, or White/Black wins in local mode), the reason the game ended,
 * a couple of summary stats, and a "Play again" button.
 */
export function GameOverDialog({
  isOpen,
  status,
  winner,
  playerColor,
  gameMode,
  moveCount,
  durationMs,
  onPlayAgain,
  onClose,
}: GameOverDialogProps) {
  const { t } = useTranslation();

  const isDraw = status === 'stalemate' || status === 'draw' || winner === null;

  // Outcome from the human's perspective in AI mode
  let titleKey: string;
  let titleColor: string;
  if (isDraw) {
    titleKey = 'chess.drawTitle';
    titleColor = 'text-warning';
  } else if (gameMode === 'ai') {
    const isHumanWin = winner === playerColor;
    titleKey = isHumanWin ? 'chess.victory' : 'chess.defeat';
    titleColor = isHumanWin ? 'text-success' : 'text-danger';
  } else {
    // Local mode — show which color won
    titleKey = winner === 'w' ? 'chess.checkmateWhite' : 'chess.checkmateBlack';
    titleColor = 'text-text-primary';
  }

  // Reason text
  let reasonKey: string;
  switch (status) {
    case 'checkmate':
      reasonKey = winner === 'w' ? 'chess.checkmateWhite' : 'chess.checkmateBlack';
      break;
    case 'stalemate':
      reasonKey = 'chess.stalemate';
      break;
    case 'resigned':
      reasonKey = winner === 'w' ? 'chess.resignedWhite' : 'chess.resignedBlack';
      break;
    case 'timeout':
      reasonKey = winner === 'w' ? 'chess.timeoutWhite' : 'chess.timeoutBlack';
      break;
    default:
      reasonKey = 'chess.draw';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-30"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div
              className="bg-bg-card border border-border-primary rounded-2xl p-8 shadow-2xl
                max-w-sm w-[min(90vw,360px)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <p className="text-[10px] text-text-muted uppercase tracking-[0.18em] mb-2">
                  {t('chess.gameOver')}
                </p>
                <motion.h2
                  className={`text-4xl font-bold tracking-tight ${titleColor}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                >
                  {t(titleKey)}
                </motion.h2>
                <motion.p
                  className="text-[12px] text-text-secondary mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {t(reasonKey)}
                </motion.p>
              </div>

              {/* Stat boxes */}
              <motion.div
                className="grid grid-cols-2 gap-3 mb-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <StatBox label={t('chess.statBoxMoves')} value={String(moveCount)} />
                <StatBox label={t('chess.statBoxDuration')} value={formatDuration(durationMs)} />
              </motion.div>

              {/* Actions */}
              <motion.button
                onClick={onPlayAgain}
                className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg py-2.5
                  text-[13px] font-semibold transition-colors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {t('chess.playAgain')}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
}

/** Single labelled stat shown inside the dialog. */
function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="bg-bg-hover/40 border border-border-subtle rounded-lg px-3 py-2.5 text-center">
      <div className="text-xl font-bold text-text-primary tabular-nums">{value}</div>
      <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
