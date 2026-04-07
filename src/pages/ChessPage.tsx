import { useState } from 'react';
import { useChessGame } from '../games/chess/hooks/useChessGame';
import { ChessScene } from '../games/chess/components/scene/ChessScene';
import { SceneCanvas } from '../core/components/canvas/SceneCanvas';
import { CameraRig } from '../core/components/canvas/CameraRig';
import { PlayerCard } from '../games/chess/components/ui/PlayerCard';
import { SettingsPanel } from '../games/chess/components/ui/SettingsPanel';
import { useChessSettingsStore } from '../games/chess/stores/useChessSettingsStore';
import { useTranslation } from '../core/i18n/useTranslation';
import type { GameMode, PieceColor } from '../games/chess/engine/types';

/** Chess game page — 3D scene with game UI overlay */
export function ChessPage() {
  const {
    turn,
    gameStatus,
    moveHistory,
    isCheck,
    winner,
    whiteTimeMs,
    blackTimeMs,
    capturedPieces,
    pendingPromotion,
    isAIThinking,
    gameMode,
    completePromotion,
    cancelPromotion,
    undoMove,
    resetGame,
  } = useChessGame();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const playerColor = useChessSettingsStore((s) => s.playerColor);
  const { t } = useTranslation();

  const statusText = getStatusText(gameStatus, winner, isCheck, turn, isAIThinking, gameMode, t);
  const isPlaying = gameStatus === 'playing' || gameStatus === 'idle';

  // Captures: each side displays the pieces it has taken
  const whiteCaptured = capturedPieces.filter((c) => c.color === 'b');
  const blackCaptured = capturedPieces.filter((c) => c.color === 'w');

  // The opponent is whichever color the human is NOT playing
  const opponentColor: PieceColor = playerColor === 'w' ? 'b' : 'w';

  const youName = gameMode === 'ai'
    ? t('chess.you')
    : playerColor === 'w' ? t('chess.white') : t('chess.black');
  const opponentName = gameMode === 'ai'
    ? t('chess.ai')
    : opponentColor === 'w' ? t('chess.white') : t('chess.black');

  const youTimeMs = playerColor === 'w' ? whiteTimeMs : blackTimeMs;
  const opponentTimeMs = playerColor === 'w' ? blackTimeMs : whiteTimeMs;
  const youCaptured = playerColor === 'w' ? whiteCaptured : blackCaptured;
  const opponentCaptured = playerColor === 'w' ? blackCaptured : whiteCaptured;

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <SceneCanvas>
        <CameraRig />
        <ChessScene />
      </SceneCanvas>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex items-center justify-between gap-3">
          {/* Game status */}
          <div className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-4 py-2.5 pointer-events-auto shadow-md">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                gameStatus === 'playing' ? 'bg-success' : 'bg-text-muted'
              }`} />
              <span className="text-[13px] font-medium text-text-primary">{statusText}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={undoMove}
              disabled={moveHistory.length === 0 || gameStatus !== 'playing' || isAIThinking}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('btn.undo')}
            </button>
            <button
              onClick={resetGame}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors"
            >
              {t('btn.newGame')}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover/70 transition-colors"
              aria-label={t('settings.openSettings')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 10a2 2 0 100-4 2 2 0 000 4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M13.3 9.3l1.2.9-1.5 2.6-1.4-.5a5.5 5.5 0 01-1.3.7L10 14.5h-3l-.3-1.5a5.5 5.5 0 01-1.3-.7l-1.4.5-1.5-2.6 1.2-.9a5.5 5.5 0 010-1.6l-1.2-.9 1.5-2.6 1.4.5a5.5 5.5 0 011.3-.7L7 1.5h3l.3 1.5c.5.2.9.4 1.3.7l1.4-.5 1.5 2.6-1.2.9a5.5 5.5 0 010 1.6z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Player card — opponent (top-left) */}
      <div className="absolute top-20 left-4 pointer-events-none">
        <PlayerCard
          name={opponentName}
          color={opponentColor}
          timeMs={opponentTimeMs}
          isActive={turn === opponentColor && isPlaying}
          isThinking={isAIThinking && gameMode === 'ai'}
          captured={opponentCaptured}
        />
      </div>

      {/* Player card — you (bottom-left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <PlayerCard
          name={youName}
          color={playerColor}
          timeMs={youTimeMs}
          isActive={turn === playerColor && isPlaying}
          captured={youCaptured}
        />
      </div>

      {/* Move history sidebar */}
      {moveHistory.length > 0 && (
        <div className="absolute top-16 right-4 pointer-events-auto">
          <div className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-3 py-2.5 shadow-md max-h-60 overflow-y-auto w-36">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('chess.moves')}</div>
            <div className="flex flex-wrap gap-x-1 gap-y-0.5">
              {moveHistory.map((m, i) => (
                <span key={i} className={`text-[11px] font-mono ${
                  i % 2 === 0 ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{m.san}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetRequired={resetGame}
      />

      {/* Promotion dialog */}
      {pendingPromotion && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="bg-bg-card border border-border-primary rounded-xl p-5 shadow-lg">
            <p className="text-sm text-text-primary mb-3 text-center">{t('chess.choosePromotion')}</p>
            <div className="flex gap-3">
              {(['q', 'r', 'b', 'n'] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => completePromotion(piece)}
                  className="w-12 h-12 bg-bg-hover border border-border-primary rounded-lg
                    text-xl text-text-primary hover:bg-accent/20 hover:border-accent
                    transition-colors flex items-center justify-center"
                >
                  {PIECE_SYMBOLS[piece]}
                </button>
              ))}
            </div>
            <button
              onClick={cancelPromotion}
              className="mt-3 w-full text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {t('btn.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const PIECE_SYMBOLS: Record<string, string> = {
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
};

function getStatusText(
  status: string,
  winner: 'w' | 'b' | null,
  isCheck: boolean,
  turn: 'w' | 'b',
  isAIThinking: boolean,
  gameMode: GameMode,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'checkmate':
      return winner === 'w' ? t('chess.checkmateWhite') : t('chess.checkmateBlack');
    case 'stalemate':
      return t('chess.stalemate');
    case 'draw':
      return t('chess.draw');
    case 'resigned':
      return winner === 'w' ? t('chess.resignedWhite') : t('chess.resignedBlack');
    case 'timeout':
      return winner === 'w' ? t('chess.timeoutWhite') : t('chess.timeoutBlack');
    case 'playing':
      if (isAIThinking && gameMode === 'ai') return t('chess.aiThinking');
      if (isCheck) return turn === 'w' ? t('chess.whiteInCheck') : t('chess.blackInCheck');
      return turn === 'w' ? t('chess.whiteToMove') : t('chess.blackToMove');
    default:
      return t('chess.readyToPlay');
  }
}
