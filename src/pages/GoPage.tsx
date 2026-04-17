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
 * Sprint 5 adds player cards, move history, and settings panel.
 */

import { useMemo, useState } from 'react';
import { SceneCanvas } from '../core/components/canvas/SceneCanvas';
import { GoScene } from '../games/go/components/scene/GoScene';
import { GoCameraRig } from '../games/go/components/scene/GoCameraRig';
import { GoPlayerCard } from '../games/go/components/ui/GoPlayerCard';
import { GoSettingsPanel } from '../games/go/components/ui/GoSettingsPanel';
import { useGoGame } from '../games/go/hooks/useGoGame';
import { useGoSettingsStore } from '../games/go/stores/useGoSettingsStore';
import { useTranslation } from '../core/i18n/useTranslation';
import type { MoveRejectionReason, Move } from '../games/go/engine/types';

/**
 * Map a rejection reason to a human-readable i18n key.
 *
 * @param reason - Engine rejection reason.
 * @returns Translation key for a short hint, or `null`.
 */
function rejectionKey(reason: MoveRejectionReason | null): string | null {
  if (!reason) return null;
  switch (reason) {
    case 'ko':
      return 'go.reject.ko';
    case 'suicide':
      return 'go.reject.suicide';
    case 'occupied':
      return 'go.reject.occupied';
    case 'outOfBounds':
      return 'go.reject.outOfBounds';
    case 'gameEnded':
      return 'go.reject.gameEnded';
    default:
      return null;
  }
}

/**
 * Format a move for the move history sidebar.
 *
 * @param move - The move to format.
 * @param t - Translation function.
 * @returns Short human-readable string.
 */
function formatMove(
  move: Move,
  t: (key: string) => string,
  boardSize: number,
): string {
  if (move.kind === 'pass') return t('go.movePass');
  if (move.kind === 'resign') return t('go.moveResign');
  // FILE_CHARS skips 'I' per Go convention
  const FILE_CHARS = 'ABCDEFGHJKLMNOPQRST';
  // Engine uses y=0 for top row; Go notation counts rows from bottom (1 = bottom).
  const row = boardSize - move.point.y;
  return `${FILE_CHARS[move.point.x]}${row}`;
}

/**
 * Go game page with a 3D board scene and a full UI overlay.
 *
 * Orchestrates the entire Go game view: renders the 3D board via
 * {@link GoScene} + {@link GoCameraRig}, overlays player cards, action
 * buttons, move history, and a slide-in settings panel.
 *
 * Key UI states handled here:
 * - **Playing** — top-bar action buttons (undo, pass, resign, new game).
 * - **Scoring** — full-screen breakdown modal after two consecutive passes;
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

  // Score breakdown is computed reactively in the store whenever dead stones
  // change during the scoring phase. No local useMemo needed.
  const breakdown = scoringBreakdown;

  /** Locks in the current score with the marked dead stones. */
  const handleFinalize = () => {
    finalizeScore();
  };

  /**
   * Undoes the second consecutive pass to let the player mark dead stones
   * or resume play before finalizing the score.
   */
  const handleResumeFromScoring = () => {
    // Use single-undo to retract only the second pass; the regular undoMove
    // would also retract the AI's first pass in AI mode, which is not desired.
    undoSingle();
  };

  const isFinished = gameStatus === 'ended';
  // 'idle' covers the state before the first move; both idle and playing
  // allow undo, pass, and resign.
  const isPlaying = gameStatus === 'idle' || gameStatus === 'playing';

  // Single derived string shown in the top-bar status chip.
  // Priority: finished > scoring > AI thinking > normal turn indicator.
  const statusText = useMemo(() => {
    if (isFinished) {
      if (winner === 'draw') return t('go.draw');
      if (winner === 'b') return t('go.blackWins');
      if (winner === 'w') return t('go.whiteWins');
      return t('go.ended');
    }
    if (gameStatus === 'scoring') return t('go.scoring');
    if (isAIThinking) return t('go.thinking');
    return turn === 'b' ? t('go.blackToMove') : t('go.whiteToMove');
  }, [gameStatus, isFinished, winner, isAIThinking, turn, t]);

  // Resolve last rejection reason to its i18n key for the transient banner.
  const rejectKey = rejectionKey(lastRejection);

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

      {/* Top bar — status + core actions */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex items-center justify-between gap-3">
          {/* Game status */}
          <div
            className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
              px-4 py-2.5 pointer-events-auto shadow-md"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  turn === 'b'
                    ? 'bg-zinc-900 ring-1 ring-white/20'
                    : 'bg-zinc-100'
                }`}
              />
              <span className="text-[13px] font-medium text-text-primary">
                {statusText}
              </span>
              <span className="text-[11px] text-text-muted">
                {boardSize}x{boardSize}
              </span>
              {koPoint && (
                <span
                  className="text-[10px] uppercase tracking-wider text-amber-300"
                  title={t('go.koActive')}
                >
                  ko
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={undoMove}
              disabled={
                moveHistory.length === 0 || !isPlaying || isAIThinking
              }
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('go.undo')}
            </button>
            <button
              onClick={pass}
              disabled={isFinished || gameStatus === 'scoring' || isAIThinking}
              title={
                passCount === 1 ? t('go.passOneLeft') : t('go.pass')
              }
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('go.pass')}
              {passCount === 1 ? ' · 1' : ''}
            </button>
            <button
              onClick={() => resign()}
              disabled={isFinished || isAIThinking || gameStatus === 'scoring'}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('go.resign')}
            </button>
            <button
              onClick={handleNewGame}
              className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
                px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary
                hover:bg-bg-hover/70 transition-colors"
            >
              {t('go.newGame')}
            </button>
            {/* Settings gear icon */}
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

        {/* Rejection banner */}
        {rejectKey && (
          <div className="mt-2 flex justify-center pointer-events-none">
            <span
              className="bg-rose-900/70 border border-rose-700/60 text-rose-100
                text-xs px-3 py-1 rounded-md shadow-md"
            >
              {t(rejectKey)}
            </span>
          </div>
        )}
      </div>

      {/* Player card — opponent (top-left) */}
      <div className="absolute top-20 left-4 pointer-events-none">
        <GoPlayerCard
          name={opponentName}
          color={opponentColor}
          capturedCount={opponentCaptured}
          isActive={turn === opponentColor && isPlaying}
          isThinking={isAIThinking && gameMode === 'ai'}
        />
      </div>

      {/* Player card — you (bottom-left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <GoPlayerCard
          name={youName}
          color={playerColor}
          capturedCount={youCaptured}
          isActive={turn === playerColor && isPlaying}
        />
      </div>

      {/* Move history sidebar */}
      {moveHistory.length > 0 && (
        <div className="absolute top-16 right-4 pointer-events-auto">
          <div
            className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
              px-3 py-2.5 shadow-md max-h-60 overflow-y-auto w-36"
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
              {moveHistory.length} {t('go.moves')}
            </div>
            <div className="flex flex-wrap gap-x-1 gap-y-0.5">
              {moveHistory.map((m, i) => (
                <span
                  key={i}
                  className={`text-[11px] font-mono ${
                    m.kind === 'pass'
                      ? 'text-amber-400'
                      : m.kind === 'resign'
                        ? 'text-rose-400'
                        : i % 2 === 0
                          ? 'text-text-primary'
                          : 'text-text-secondary'
                  }`}
                >
                  {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}
                  {formatMove(m, t, boardSize)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      <GoSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetRequired={handleNewGame}
      />

      {/* Scoring overlay — shown after two passes, before the player confirms */}
      {/* Scoring panel — positioned at bottom-right so the 3D board remains
          clickable for dead-stone marking. The outer wrapper is pointer-events-none;
          only the inner card captures clicks. */}
      {gameStatus === 'scoring' && breakdown && (
        <div
          className="absolute inset-0 flex items-end justify-end
            pointer-events-none z-10 p-4"
        >
          <div
            className="bg-bg-card/95 backdrop-blur-lg border border-border-primary rounded-2xl
              px-6 py-5 shadow-xl text-center max-w-xs pointer-events-auto"
          >
            <h2 className="text-xl font-bold text-text-primary mb-1">
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

            <p className="text-sm text-text-secondary mb-5">
              {breakdown.winner === 'draw'
                ? t('go.draw')
                : breakdown.winner === 'b'
                  ? `${t('go.blackWins')} · +${breakdown.margin}`
                  : `${t('go.whiteWins')} · +${breakdown.margin}`}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleResumeFromScoring}
                className="px-4 py-2 bg-bg-hover border border-border-primary rounded-lg text-sm
                  text-text-secondary hover:text-text-primary transition-colors"
              >
                {t('go.resume')}
              </button>
              <button
                onClick={handleFinalize}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium
                  hover:bg-accent/90 transition-colors"
              >
                {t('go.confirmResult')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End-of-game overlay */}
      {isFinished && !gameOverDismissed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="bg-bg-card border border-border-primary rounded-xl p-6 shadow-lg text-center max-w-xs">
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {winner === 'draw'
                ? t('go.draw')
                : gameMode === 'ai' && winner === playerColor
                  ? t('go.victory')
                  : gameMode === 'ai' && winner !== playerColor
                    ? t('go.defeat')
                    : winner === 'b'
                      ? t('go.blackWins')
                      : t('go.whiteWins')}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {moveHistory.length} {t('go.moves')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleNewGame}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium
                  hover:bg-accent/90 transition-colors"
              >
                {t('go.playAgain')}
              </button>
              <button
                onClick={() => setGameOverDismissed(true)}
                className="px-4 py-2 bg-bg-hover border border-border-primary rounded-lg text-sm
                  text-text-secondary hover:text-text-primary transition-colors"
              >
                {t('go.reviewBoard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
