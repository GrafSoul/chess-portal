import { useEffect, useRef, useCallback } from 'react';
import { useCheckersStore } from '../stores/useCheckersStore';
import { useCheckersSettingsStore } from '../stores/useCheckersSettingsStore';
import {
  useCheckersStatsStore,
  isTerminalStatus,
  computeOutcome,
  type GameEndReason,
} from '../stores/useCheckersStatsStore';
import { ClockManager } from '../engine/ClockManager';
import { CLOCK_PRESETS } from '../config/clockPresets';
import { useSoundEffects } from './useSoundEffects';
import { useCheckersAI } from './useCheckersAI';
import type { GameStatus, PieceColor } from '../engine/types';

/**
 * Main hook that wires together checkers store, clock, sounds, and stats.
 * Should be used once at the top level of the checkers game page.
 */
export function useCheckersGame() {
  const clockRef = useRef<ClockManager | null>(null);
  const gameStartedAtRef = useRef<number | null>(null);
  const prevStatusRef = useRef<GameStatus>('idle');
  const recordedRef = useRef(false);

  // Mount sound effects and AI
  useSoundEffects();
  useCheckersAI();

  const {
    fen,
    turn,
    gameStatus,
    selectedSquare,
    legalMoves,
    moveHistory,
    capturedPieces,
    winner,
    isAIThinking,
    gameMode,
    lastMove,
    whiteTimeMs,
    blackTimeMs,
    clockRunning,
    isChainActive,
    chainPiece,
    selectSquare,
    makeMove,
    undoMove,
    resetGame: storeReset,
    setGameMode,
    updateClock,
    setClockRunning,
    setGameStatus,
  } = useCheckersStore();

  const clockPreset = useCheckersSettingsStore((s) => s.clockPreset);
  const playerColor = useCheckersSettingsStore((s) => s.playerColor);
  const aiLevel = useCheckersSettingsStore((s) => s.aiLevel);
  const recordGame = useCheckersStatsStore((s) => s.recordGame);

  // Initialize clock
  useEffect(() => {
    const preset = CLOCK_PRESETS[clockPreset] ?? CLOCK_PRESETS.rapid;
    const clock = new ClockManager(preset.timeMs, preset.incrementMs);

    clock.setOnTick((white, black) => {
      updateClock(white, black);
    });

    clock.setOnTimeout((loser: PieceColor) => {
      const w: PieceColor = loser === 'w' ? 'b' : 'w';
      setGameStatus('won', w);
    });

    clockRef.current = clock;

    return () => {
      clock.destroy();
    };
  }, [clockPreset, updateClock, setGameStatus]);

  // Start/stop clock based on game status
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock) return;

    const isActive = gameStatus === 'playing';
    const isFinished = gameStatus === 'won' || gameStatus === 'draw';

    if (isActive && moveHistory.length > 0) {
      clock.start(turn);
      setClockRunning(true);
    } else if (isFinished) {
      clock.stop();
      setClockRunning(false);
    }
  }, [turn, gameStatus, moveHistory.length, setClockRunning]);

  // Switch clock on turn change (only after at least 2 moves)
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock || !clockRunning) return;
    if (moveHistory.length < 2) return;

    clock.switchTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveHistory.length]);

  // Mark game start time
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

  // Record game to stats on terminal state
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;

    if (recordedRef.current) return;
    if (prev === gameStatus) return;
    if (!isTerminalStatus(gameStatus)) return;
    if (moveHistory.length === 0) return;

    const startedAt = gameStartedAtRef.current ?? Date.now();
    const durationMs = Date.now() - startedAt;
    const outcome = computeOutcome(gameStatus, winner, playerColor, gameMode);

    const endReason: GameEndReason =
      gameStatus === 'draw' ? 'draw' : 'no_moves';

    recordGame({
      finishedAt: Date.now(),
      mode: gameMode,
      aiLevel: gameMode === 'ai' ? aiLevel : undefined,
      endReason,
      outcome,
      winner,
      playerColor,
      moveCount: moveHistory.length,
      durationMs,
    });
    recordedRef.current = true;
  }, [gameStatus, winner, playerColor, gameMode, aiLevel, moveHistory.length, recordGame]);

  /** Reset game with fresh clock */
  const resetGame = useCallback(() => {
    const preset = CLOCK_PRESETS[clockPreset] ?? CLOCK_PRESETS.rapid;
    clockRef.current?.reset(preset.timeMs, preset.incrementMs);
    gameStartedAtRef.current = null;
    recordedRef.current = false;
    storeReset();
  }, [clockPreset, storeReset]);

  return {
    // State
    fen,
    turn,
    gameStatus,
    selectedSquare,
    legalMoves,
    moveHistory,
    capturedPieces,
    winner,
    isAIThinking,
    gameMode,
    lastMove,
    whiteTimeMs,
    blackTimeMs,
    clockRunning,
    isChainActive,
    chainPiece,

    // Actions
    selectSquare,
    makeMove,
    undoMove,
    resetGame,
    setGameMode,
  };
}
