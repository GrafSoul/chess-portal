import { useState } from 'react';
import { CheckersScene } from '../games/checkers/components/scene/CheckersScene';
import { SceneCanvas } from '../core/components/canvas/SceneCanvas';
import { CheckersCameraRig } from '../games/checkers/components/scene/CheckersCameraRig';
import { CheckersSettingsPanel } from '../games/checkers/components/ui/CheckersSettingsPanel';
import { CheckersRulesPanel } from '../games/checkers/components/ui/CheckersRulesPanel';
import { CheckersPlayerCard } from '../games/checkers/components/ui/CheckersPlayerCard';
import { useCheckersGame } from '../games/checkers/hooks/useCheckersGame';
import { useCheckersSettingsStore } from '../games/checkers/stores/useCheckersSettingsStore';
import { useTranslation } from '../core/i18n/useTranslation';
import type { PieceColor } from '../games/checkers/engine/types';

/** Checkers game page — 3D scene with game UI overlay */
export function CheckersPage() {
  const {
    turn,
    gameStatus,
    moveHistory,
    capturedPieces,
    winner,
    isAIThinking,
    gameMode,
    whiteTimeMs,
    blackTimeMs,
    isChainActive,
    undoMove,
    resetGame,
  } = useCheckersGame();

  const playerColor = useCheckersSettingsStore((s) => s.playerColor);
  const clockPreset = useCheckersSettingsStore((s) => s.clockPreset);
  const { t } = useTranslation();

  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const handleNewGame = () => {
    setGameOverDismissed(false);
    resetGame();
  };

  const isFinished = gameStatus === 'won' || gameStatus === 'draw';
  const isPlaying = gameStatus === 'playing' || gameStatus === 'idle';
  const showClock = clockPreset !== 'unlimited';

  const statusText = getCheckersStatusText(gameStatus, winner, turn, isAIThinking, isChainActive, gameMode, t);

  const opponentColor: PieceColor = playerColor === 'w' ? 'b' : 'w';

  const youName = gameMode === 'ai'
    ? t('chess.you')
    : playerColor === 'w' ? t('chess.white') : t('chess.black');
  const opponentName = gameMode === 'ai'
    ? t('chess.ai')
    : opponentColor === 'w' ? t('chess.white') : t('chess.black');

  const youTimeMs = playerColor === 'w' ? whiteTimeMs : blackTimeMs;
  const opponentTimeMs = playerColor === 'w' ? blackTimeMs : whiteTimeMs;

  const whiteCaptured = capturedPieces.filter((c) => c.color === 'b');
  const blackCaptured = capturedPieces.filter((c) => c.color === 'w');
  const youCaptured = playerColor === 'w' ? whiteCaptured : blackCaptured;
  const opponentCaptured = playerColor === 'w' ? blackCaptured : whiteCaptured;

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <SceneCanvas>
        <CheckersCameraRig />
        <CheckersScene />
      </SceneCanvas>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex items-center justify-between gap-3">
          {/* Game status */}
          <div className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-4 py-2.5 pointer-events-auto shadow-md">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-success' : 'bg-text-muted'
              }`} />
              <span className="text-[13px] font-medium text-text-primary">{statusText}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={undoMove}
              disabled={moveHistory.length === 0 || !isPlaying || isAIThinking || isChainActive}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('btn.undo')}
            </button>
            <button
              onClick={handleNewGame}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors"
            >
              {t('btn.newGame')}
            </button>
            <button
              onClick={() => setRulesOpen(true)}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover/70 transition-colors"
              aria-label={t('checkersRules.open')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2.5C2 2.22 2.22 2 2.5 2H5.5C6.88 2 8 3.12 8 4.5V14C8 12.9 7.1 12 6 12H2.5C2.22 12 2 11.78 2 11.5V2.5Z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
                />
                <path
                  d="M14 2.5C14 2.22 13.78 2 13.5 2H10.5C9.12 2 8 3.12 8 4.5V14C8 12.9 8.9 12 10 12H13.5C13.78 12 14 11.78 14 11.5V2.5Z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover/70 transition-colors"
              aria-label={t('settings.openSettings')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M13.3 9.3l1.2.9-1.5 2.6-1.4-.5a5.5 5.5 0 01-1.3.7L10 14.5h-3l-.3-1.5a5.5 5.5 0 01-1.3-.7l-1.4.5-1.5-2.6 1.2-.9a5.5 5.5 0 010-1.6l-1.2-.9 1.5-2.6 1.4.5a5.5 5.5 0 011.3-.7L7 1.5h3l.3 1.5c.5.2.9.4 1.3.7l1.4-.5 1.5 2.6-1.2.9a5.5 5.5 0 010 1.6z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Player card — opponent (top-left) */}
      <div className="absolute top-20 left-4 pointer-events-none">
        <CheckersPlayerCard
          name={opponentName}
          color={opponentColor}
          timeMs={opponentTimeMs}
          isActive={turn === opponentColor && isPlaying}
          isThinking={isAIThinking && gameMode === 'ai'}
          captured={opponentCaptured}
          showClock={showClock}
        />
      </div>

      {/* Player card — you (bottom-left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <CheckersPlayerCard
          name={youName}
          color={playerColor}
          timeMs={youTimeMs}
          isActive={turn === playerColor && isPlaying}
          captured={youCaptured}
          showClock={showClock}
        />
      </div>

      {/* Move history sidebar */}
      {moveHistory.length > 0 && (
        <div className="absolute top-16 right-4 pointer-events-auto">
          <div className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-3 py-2.5 shadow-md max-h-60 overflow-y-auto w-36">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
              {t('chess.moves')}
            </div>
            <div className="flex flex-wrap gap-x-1 gap-y-0.5">
              {moveHistory.map((m, i) => (
                <span key={i} className={`text-[11px] font-mono ${
                  i % 2 === 0 ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{m.from}-{m.to}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rules/tutorial panel */}
      <CheckersRulesPanel
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />

      {/* Settings panel */}
      <CheckersSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetRequired={handleNewGame}
      />

      {/* End-of-game overlay */}
      {isFinished && !gameOverDismissed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="bg-bg-card border border-border-primary rounded-xl p-6 shadow-lg text-center max-w-xs">
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {gameStatus === 'draw'
                ? t('checkers.drawTitle')
                : winner === playerColor
                  ? t('checkers.victory')
                  : t('checkers.defeat')}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {gameStatus === 'draw'
                ? t('checkers.drawDesc')
                : winner === 'w'
                  ? t('checkers.whiteWins')
                  : t('checkers.blackWins')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleNewGame}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium
                  hover:bg-accent/90 transition-colors"
              >
                {t('chess.playAgain')}
              </button>
              <button
                onClick={() => setGameOverDismissed(true)}
                className="px-4 py-2 bg-bg-hover border border-border-primary rounded-lg text-sm
                  text-text-secondary hover:text-text-primary transition-colors"
              >
                {t('btn.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCheckersStatusText(
  status: string,
  winner: PieceColor | null,
  turn: PieceColor,
  isAIThinking: boolean,
  isChainActive: boolean,
  gameMode: string,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'won':
      return winner === 'w' ? t('checkers.whiteWins') : t('checkers.blackWins');
    case 'draw':
      return t('checkers.draw');
    case 'playing':
      if (isAIThinking && gameMode === 'ai') return t('chess.aiThinking');
      if (isChainActive) return t('checkers.chainActive');
      return turn === 'w' ? t('chess.whiteToMove') : t('chess.blackToMove');
    default:
      return t('checkers.readyToPlay');
  }
}
