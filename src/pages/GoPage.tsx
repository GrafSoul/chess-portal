/**
 * Go game page — 3D scene with full UI overlay.
 *
 * Layout mirrors `CheckersPage` for cross-game consistency:
 * - Top bar: status indicator + action buttons (undo, pass, resign, new, settings)
 * - Left column: opponent player card (top) + human player card (bottom)
 * - Right column: move history sidebar
 * - Center: scoring overlay (after two passes) + end-of-game modal
 * - Right slide-in: settings panel
 *
 * Sprint 8 refactor: extracted {@link GoTopBar}, {@link GoMoveHistory},
 * {@link GoScoringPanel}, {@link GoEndGameDialog} into dedicated files.
 * `GoPage` is now a thin orchestrator that derives display data and wires
 * the subcomponents together.
 */

import { useMemo, useState } from 'react';
import { SceneCanvas } from '../core/components/canvas/SceneCanvas';
import { GoScene } from '../games/go/components/scene/GoScene';
import { GoCameraRig } from '../games/go/components/scene/GoCameraRig';
import { GoPlayerCard } from '../games/go/components/ui/GoPlayerCard';
import { GoSettingsPanel } from '../games/go/components/ui/GoSettingsPanel';
import { GoRulesPanel } from '../games/go/components/ui/GoRulesPanel';
import { GoTopBar } from '../games/go/components/ui/GoTopBar';
import { GoMoveHistory } from '../games/go/components/ui/GoMoveHistory';
import { GoScoringPanel } from '../games/go/components/ui/GoScoringPanel';
import { GoEndGameDialog } from '../games/go/components/ui/GoEndGameDialog';
import { useGoGame } from '../games/go/hooks/useGoGame';
import { useGoSettingsStore } from '../games/go/stores/useGoSettingsStore';
import { useTranslation } from '../core/i18n/useTranslation';

/**
 * Go game page with a 3D board scene and a full UI overlay.
 *
 * Orchestrates the entire Go game view: renders the 3D board via
 * {@link GoScene} + {@link GoCameraRig}, overlays player cards, action
 * buttons, move history, and a slide-in settings panel.
 *
 * Key UI states handled here:
 * - **Playing** — top-bar action buttons (undo, pass, resign, new game).
 * - **Scoring** — score breakdown panel after two consecutive passes;
 *   player can resume (undo the second pass) or confirm the result.
 * - **Ended** — end-of-game modal (victory/defeat/draw) with play-again
 *   and review-board options.
 *
 * `resetGame()` is the single entry point for starting a new session; it
 * reads fresh settings from {@link useGoSettingsStore} so board-size and
 * rule changes made in the settings panel take effect immediately.
 *
 * @returns The rendered Go game page element.
 *
 * @example
 * ```tsx
 * // Registered in the router as the /go route
 * <Route path="/go" element={<GoPage />} />
 * ```
 */
export function GoPage() {
  const {
    boardSize,
    turn,
    moveHistory,
    captured,
    passCount,
    koPoint,
    gameStatus,
    winner,
    isAIThinking,
    gameMode,
    lastRejection,
    scoringBreakdown,
    clockState,
    pass,
    resign,
    undoMove,
    undoSingle,
    resetGame,
    finalizeScore,
  } = useGoGame();

  const playerColor = useGoSettingsStore((s) => s.playerColor);
  const { t } = useTranslation();

  // Whether the end-of-game modal has been explicitly closed by the player
  // so they can review the final board position.
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Derive opponent color from the human player's chosen color.
  const opponentColor = playerColor === 'b' ? 'w' : 'b';

  // In AI mode use generic "You" / "AI" labels; in local mode use stone colors
  // so both sides are clearly identified regardless of who is sitting where.
  const youName =
    gameMode === 'ai'
      ? t('go.you')
      : playerColor === 'b'
        ? t('go.black')
        : t('go.white');
  const opponentName =
    gameMode === 'ai'
      ? t('go.ai')
      : opponentColor === 'b'
        ? t('go.black')
        : t('go.white');

  // Map capture counters to the correct side based on the human player's color.
  const youCaptured =
    playerColor === 'b' ? captured.black : captured.white;
  const opponentCaptured =
    playerColor === 'b' ? captured.white : captured.black;

  const isFinished = gameStatus === 'ended';
  const isPlaying = gameStatus === 'idle' || gameStatus === 'playing';
  const isScoring = gameStatus === 'scoring';

  // Single derived string shown in the top-bar status chip.
  // Priority: finished > scoring > AI thinking > normal turn indicator.
  const statusText = useMemo(() => {
    if (isFinished) {
      if (winner === 'draw') return t('go.draw');
      if (winner === 'b') return t('go.blackWins');
      if (winner === 'w') return t('go.whiteWins');
      return t('go.ended');
    }
    if (isScoring) return t('go.scoring');
    if (isAIThinking) return t('go.thinking');
    return turn === 'b' ? t('go.blackToMove') : t('go.whiteToMove');
  }, [isFinished, isScoring, winner, isAIThinking, turn, t]);

  /** Resets the game and re-shows the end-of-game modal for the next session. */
  const handleNewGame = () => {
    setGameOverDismissed(false);
    resetGame();
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <SceneCanvas>
        <GoCameraRig />
        <GoScene />
      </SceneCanvas>

      {/* Top bar */}
      <GoTopBar
        boardSize={boardSize}
        turn={turn}
        statusText={statusText}
        koPoint={koPoint}
        moveCount={moveHistory.length}
        passCount={passCount}
        gameStatus={gameStatus}
        isAIThinking={isAIThinking}
        lastRejection={lastRejection}
        onUndo={undoMove}
        onPass={pass}
        onResign={() => resign()}
        onNewGame={handleNewGame}
        onOpenRules={() => setRulesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Player card — opponent (top-left on desktop, below top bar on mobile) */}
      <div className="absolute top-14 left-2 md:top-20 md:left-4 pointer-events-none">
        <GoPlayerCard
          name={opponentName}
          color={opponentColor}
          capturedCount={opponentCaptured}
          isActive={turn === opponentColor && isPlaying}
          isThinking={isAIThinking && gameMode === 'ai'}
          clock={clockState ? clockState[opponentColor === 'b' ? 'black' : 'white'] : null}
        />
      </div>

      {/* Player card — you (bottom-left) */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 pointer-events-none">
        <GoPlayerCard
          name={youName}
          color={playerColor}
          capturedCount={youCaptured}
          isActive={turn === playerColor && isPlaying}
          clock={clockState ? clockState[playerColor === 'b' ? 'black' : 'white'] : null}
        />
      </div>

      {/* Move history sidebar */}
      {moveHistory.length > 0 && (
        <GoMoveHistory moves={moveHistory} boardSize={boardSize} />
      )}

      {/* Settings panel */}
      <GoSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetRequired={handleNewGame}
      />

      {/* Rules / tutorial panel */}
      <GoRulesPanel isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Scoring panel (after two passes, before finalisation) */}
      {isScoring && scoringBreakdown && (
        <GoScoringPanel
          breakdown={scoringBreakdown}
          onFinalize={finalizeScore}
          onResume={undoSingle}
        />
      )}

      {/* End-of-game modal */}
      {isFinished && !gameOverDismissed && (
        <GoEndGameDialog
          winner={winner}
          gameMode={gameMode}
          playerColor={playerColor}
          moveCount={moveHistory.length}
          onPlayAgain={handleNewGame}
          onReview={() => setGameOverDismissed(true)}
        />
      )}
    </div>
  );
}
