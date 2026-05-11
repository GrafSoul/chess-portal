/**
 * Backgammon game page — Sprint 5: full UI overlay.
 *
 * Thin orchestrator pattern (mirrors `GoPage`):
 * - Delegates all state + AI lifecycle to `useBackgammonGame`.
 * - Wraps `BackgammonScene` + `BackgammonCameraRig` inside `SceneCanvas`.
 * - Auto-starts a new game on mount when `gameStatus === 'idle'`.
 * - Renders the full Sprint-5 UI overlay:
 *   - `BackgammonTopBar` — status chip + dice badges + action buttons.
 *   - `BackgammonPlayerCard` × 2 — opponent (top-left) + player (bottom-left).
 *   - `BackgammonMoveHistory` — scrollable right-column sidebar.
 *   - `BackgammonSettingsPanel` — animated slide-in drawer.
 *   - `BackgammonEndGameDialog` — victory / defeat modal.
 *
 * Full tutorial / rules panel is deferred to Sprint 7.
 *
 * @example
 * ```tsx
 * // Registered in the router as the /backgammon route
 * <Route path="/backgammon" element={<BackgammonPage />} />
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SceneCanvas } from '../core/components/canvas/SceneCanvas';
import { BackgammonScene } from '../games/backgammon/components/scene/BackgammonScene';
import { BackgammonCameraRig } from '../games/backgammon/components/scene/BackgammonCameraRig';
import { BackgammonTopBar } from '../games/backgammon/components/ui/BackgammonTopBar';
import { BackgammonPlayerCard } from '../games/backgammon/components/ui/BackgammonPlayerCard';
import { BackgammonMoveHistory } from '../games/backgammon/components/ui/BackgammonMoveHistory';
import { BackgammonSettingsPanel } from '../games/backgammon/components/ui/BackgammonSettingsPanel';
import { BackgammonRulesPanel } from '../games/backgammon/components/ui/BackgammonRulesPanel';
import { BackgammonEndGameDialog } from '../games/backgammon/components/ui/BackgammonEndGameDialog';
import { useBackgammonGame } from '../games/backgammon/hooks/useBackgammonGame';
import { useTranslation } from '../core/i18n/useTranslation';

/**
 * Backgammon game page with a 3D board scene and a full UI overlay.
 *
 * Orchestrates the entire Backgammon view: renders the 3D board scene,
 * overlays player cards, a top action bar, move history sidebar, slide-in
 * settings panel, and the end-of-game modal.
 *
 * Game state and the AI worker are managed by `useBackgammonGame()`.
 * Settings persistence is handled by `useBackgammonSettingsStore` inside
 * `BackgammonSettingsPanel` — this page does not import the settings store
 * directly.
 *
 * @returns The rendered Backgammon game page element.
 */
export function BackgammonPage() {
  const {
    turn,
    dice,
    gameStatus,
    winner,
    winType,
    bornOff,
    pendingSequence,
    moveHistory,
    isAIThinking,
    gameMode,
    playerColor,
    rollDice,
    confirmTurn,
    undoLastSubMove,
    resign,
    resetGame,
  } = useBackgammonGame();

  const { t } = useTranslation();

  /** Whether the end-of-game dialog has been explicitly dismissed for board review. */
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Auto-start on first visit — transitions 'idle' → 'rolling'.
  useEffect(() => {
    if (gameStatus === 'idle') {
      resetGame();
    }
    // Intentional mount-only effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived display values ─────────────────────────────────────────────────

  /** Opponent's color is the complement of the human player's color. */
  const opponentColor = playerColor === 'w' ? 'b' : 'w';

  /** `true` when it is the human player's turn to act. */
  const isMyTurn = turn === playerColor;

  /** `true` when the AI opponent is currently thinking or acting. */
  const isAIOpponentTurn = gameMode === 'ai' && !isMyTurn;

  /**
   * Disables player-facing controls when:
   * - It is the AI's turn (board not yet showing the AI's choices), or
   * - The AI worker is actively computing.
   */
  const playerControlsDisabled = isAIOpponentTurn || isAIThinking;

  const isPlaying = gameStatus === 'idle' || gameStatus === 'choosing';
  const isFinished = gameStatus === 'ended';

  // Human-readable status shown in the top-bar chip.
  const statusText = useMemo(() => {
    if (gameStatus === 'rolling') return t('backgammon.rolling');
    if (gameStatus === 'ai_thinking' || isAIThinking) return t('backgammon.aiThinking');
    if (isFinished) {
      return winner === playerColor ? t('backgammon.victory') : t('backgammon.defeat');
    }
    if (gameStatus === 'choosing' && isMyTurn) return t('backgammon.choosePiece');
    return isMyTurn ? t('backgammon.yourTurn') : t('backgammon.opponentTurn');
  }, [gameStatus, isAIThinking, isFinished, winner, playerColor, isMyTurn, t]);

  // Button visibility — derived once per render.
  const showRoll =
    gameStatus === 'idle' && isMyTurn && !playerControlsDisabled;
  const showConfirm =
    gameStatus === 'choosing' &&
    pendingSequence.length > 0 &&
    !playerControlsDisabled;
  const showUndo =
    gameStatus === 'choosing' &&
    pendingSequence.length > 0 &&
    !playerControlsDisabled;

  // Player name labels — "You" / "AI" in AI mode, color names in local mode.
  const youName =
    gameMode === 'ai'
      ? t('backgammon.you')
      : playerColor === 'w'
        ? t('backgammon.white')
        : t('backgammon.black');
  const opponentName =
    gameMode === 'ai'
      ? t('backgammon.ai')
      : opponentColor === 'w'
        ? t('backgammon.white')
        : t('backgammon.black');

  // ── Stable callbacks ───────────────────────────────────────────────────────

  /** Reset the game and allow the end-game dialog to be shown again. */
  const handleNewGame = useCallback(() => {
    setGameOverDismissed(false);
    resetGame();
  }, [resetGame]);

  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleOpenRules = useCallback(() => setRulesOpen(true), []);
  const handleCloseRules = useCallback(() => setRulesOpen(false), []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full">

      {/* 3D scene canvas */}
      <SceneCanvas>
        <BackgammonCameraRig />
        <BackgammonScene />
      </SceneCanvas>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <BackgammonTopBar
        statusText={statusText}
        dice={dice}
        turn={turn}
        gameStatus={gameStatus}
        isAIThinking={isAIThinking}
        showRoll={showRoll}
        showConfirm={showConfirm}
        showUndo={showUndo}
        onRoll={rollDice}
        onConfirm={confirmTurn}
        onUndo={undoLastSubMove}
        onResign={() => resign()}
        onNewGame={handleNewGame}
        onOpenRules={handleOpenRules}
        onOpenSettings={handleOpenSettings}
      />

      {/* ── Player card — opponent (top-left) ───────────────────────────── */}
      <div className="absolute top-14 left-2 md:top-20 md:left-4 pointer-events-none">
        <BackgammonPlayerCard
          name={opponentName}
          color={opponentColor}
          bornOff={bornOff[opponentColor]}
          isActive={turn === opponentColor && isPlaying}
          isThinking={isAIThinking && gameMode === 'ai'}
        />
      </div>

      {/* ── Player card — human (bottom-left) ───────────────────────────── */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 pointer-events-none">
        <BackgammonPlayerCard
          name={youName}
          color={playerColor}
          bornOff={bornOff[playerColor]}
          isActive={turn === playerColor && isPlaying}
        />
      </div>

      {/* ── Move history sidebar — right column ─────────────────────────── */}
      {moveHistory.length > 0 && (
        <BackgammonMoveHistory moves={moveHistory} />
      )}

      {/* ── Settings panel — animated slide-in ──────────────────────────── */}
      <BackgammonSettingsPanel
        isOpen={settingsOpen}
        onClose={handleCloseSettings}
        onResetRequired={handleNewGame}
      />

      {/* ── Rules / tutorial panel — Sprint 7 ───────────────────────────── */}
      <BackgammonRulesPanel isOpen={rulesOpen} onClose={handleCloseRules} />

      {/* ── End-of-game dialog ──────────────────────────────────────────── */}
      {isFinished && !gameOverDismissed && (
        <BackgammonEndGameDialog
          winner={winner}
          winType={winType}
          gameMode={gameMode}
          playerColor={playerColor}
          onPlayAgain={handleNewGame}
          onReview={() => setGameOverDismissed(true)}
        />
      )}
    </div>
  );
}
