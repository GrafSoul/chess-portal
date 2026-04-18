/**
 * Facade hook that exposes the live Go game state and high-level actions
 * to page components. Layers subsystems (sound effects, AI, stats) onto the
 * raw store to keep the page component thin.
 *
 * Mirrors `useCheckersGame` for API parity.
 */

import { useEffect, useRef } from 'react';
import { useGoStore } from '../stores/useGoStore';
import { useGoSettingsStore } from '../stores/useGoSettingsStore';
import {
  useGoStatsStore,
  isGoTerminalStatus,
  computeGoOutcome,
  type GoGameEndReason,
} from '../stores/useGoStatsStore';
import { useGoSoundEffects } from './useGoSoundEffects';
import { useGoAI } from './useGoAI';
import { useGoClock } from './useGoClock';
import type { GameStatus, Stone } from '../engine/types';

/**
 * Facade hook that wires together all Go subsystems (store, sound, AI, stats)
 * and exposes a single typed bundle to the `GoPage` component.
 *
 * On mount this hook:
 * 1. Activates `useGoSoundEffects` — synthesises WebAudio sounds on game events.
 * 2. Activates `useGoAI` — spawns the MCTS worker and drives AI turns.
 * 3. Tracks game start/end and records a {@link GoGameRecord} to the persistent
 *    stats store on terminal status (`ended`).
 *
 * The returned object is stable across renders for fields that have not
 * changed — Zustand's selector equality prevents unnecessary re-renders.
 *
 * @returns State slice + action bundle used by `GoPage`.
 */
export function useGoGame() {
  // Attach event-driven subsystems.
  useGoSoundEffects();
  useGoAI();
  useGoClock();

  const board = useGoStore((s) => s.board);
  const boardSize = useGoStore((s) => s.boardSize);
  const scoringRules = useGoStore((s) => s.scoringRules);
  const turn = useGoStore((s) => s.turn);
  const moveHistory = useGoStore((s) => s.moveHistory);
  const captured = useGoStore((s) => s.captured);
  const koPoint = useGoStore((s) => s.koPoint);
  const passCount = useGoStore((s) => s.passCount);
  const gameStatus = useGoStore((s) => s.gameStatus);
  const winner = useGoStore((s) => s.winner);
  const lastPoint = useGoStore((s) => s.lastPoint);
  const isAIThinking = useGoStore((s) => s.isAIThinking);
  const gameMode = useGoStore((s) => s.gameMode);
  const lastRejection = useGoStore((s) => s.lastRejection);

  const deadStones = useGoStore((s) => s.deadStones);
  const scoringBreakdown = useGoStore((s) => s.scoringBreakdown);
  const finalScore = useGoStore((s) => s.finalScore);
  const clockState = useGoStore((s) => s.clockState);

  const playAt = useGoStore((s) => s.playAt);
  const pass = useGoStore((s) => s.pass);
  const resign = useGoStore((s) => s.resign);
  const undoMove = useGoStore((s) => s.undoMove);
  const undoSingle = useGoStore((s) => s.undoSingle);
  const resetGame = useGoStore((s) => s.resetGame);
  const setGameMode = useGoStore((s) => s.setGameMode);
  const finalizeScore = useGoStore((s) => s.finalizeScore);
  const toggleDeadStone = useGoStore((s) => s.toggleDeadStone);

  // Settings needed for stats recording.
  const playerColor = useGoSettingsStore((s) => s.playerColor);
  const aiLevel = useGoSettingsStore((s) => s.aiLevel);
  const recordGame = useGoStatsStore((s) => s.recordGame);

  // Track per-session timing and ensure we only record each game once.
  const gameStartedAtRef = useRef<number | null>(null);
  const prevStatusRef = useRef<GameStatus>('idle');
  const recordedRef = useRef(false);

  // Mark game start the first time a move lands; clear on full reset.
  useEffect(() => {
    if (moveHistory.length === 1 && gameStartedAtRef.current === null) {
      gameStartedAtRef.current = Date.now();
      recordedRef.current = false;
    }
    if (moveHistory.length === 0) {
      gameStartedAtRef.current = null;
      recordedRef.current = false;
    }
  }, [moveHistory.length]);

  // Record the game when it transitions into a terminal status.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;

    if (recordedRef.current) return;
    if (prev === gameStatus) return;
    if (!isGoTerminalStatus(gameStatus)) return;
    if (moveHistory.length === 0) return;

    const startedAt = gameStartedAtRef.current ?? Date.now();
    const durationMs = Date.now() - startedAt;

    // Determine why the game ended by inspecting the last move.
    const lastMove = moveHistory[moveHistory.length - 1];
    let endReason: GoGameEndReason = 'passed';
    if (lastMove?.kind === 'resign') {
      // Distinguish manual resign from clock timeout: if the resigning side
      // has actually run out of time, it was a timeout.
      const side = lastMove.color === 'b' ? clockState?.black : clockState?.white;
      const flagged =
        side !== undefined &&
        ((!side.inByoyomi && side.mainMs <= 0) ||
          (side.inByoyomi && side.periodsLeft <= 0 && side.periodMs <= 0));
      endReason = flagged ? 'timeout' : 'resigned';
    }

    // Scoring games carry a margin from the breakdown; resign/timeout → 0.
    const margin = finalScore?.margin ?? 0;

    // `winner` at this point is `Stone | 'draw' | null`; normalize for storage.
    const normalizedWinner: Stone | null =
      winner === 'b' || winner === 'w' ? winner : null;
    const outcome = computeGoOutcome(winner, playerColor, gameMode);

    recordGame({
      finishedAt: Date.now(),
      mode: gameMode,
      aiLevel: gameMode === 'ai' ? aiLevel : undefined,
      endReason,
      outcome,
      winner: normalizedWinner,
      playerColor,
      boardSize,
      scoringRules,
      margin,
      moveCount: moveHistory.length,
      durationMs,
    });
    recordedRef.current = true;
  }, [
    gameStatus,
    winner,
    moveHistory,
    playerColor,
    gameMode,
    aiLevel,
    boardSize,
    scoringRules,
    finalScore,
    clockState,
    recordGame,
  ]);

  return {
    // State
    board,
    boardSize,
    turn,
    moveHistory,
    captured,
    koPoint,
    passCount,
    gameStatus,
    winner,
    lastPoint,
    isAIThinking,
    gameMode,
    lastRejection,
    deadStones,
    scoringBreakdown,
    finalScore,
    clockState,

    // Actions
    playAt,
    pass,
    resign,
    undoMove,
    undoSingle,
    resetGame,
    setGameMode,
    finalizeScore,
    toggleDeadStone,
  };
}
