import { useEffect, useRef, useCallback } from 'react';
import { useChessStore } from '../stores/useChessStore';
import { useChessSettingsStore } from '../stores/useChessSettingsStore';
import {
  useChessStatsStore,
  isTerminalStatus,
  computeOutcome,
  type GameEndReason,
} from '../stores/useChessStatsStore';
import { ClockManager } from '../engine/ClockManager';
import { CLOCK_PRESETS } from '../config/clockPresets';
import { useStockfishAI } from './useStockfishAI';
import { useSoundEffects } from './useSoundEffects';
import type { GameStatus, PieceColor } from '../engine/types';

/**
 * Main hook that wires together chess store, engine, and clock.
 * Should be used once at the top level of the chess game.
 */
export function useChessGame() {
  const clockRef = useRef<ClockManager | null>(null);
  /** When the current game's clock first started (epoch ms). */
  const gameStartedAtRef = useRef<number | null>(null);
  /** GameStatus from the previous render — used to detect terminal transitions. */
  const prevStatusRef = useRef<GameStatus>('idle');
  /** Marks the current game as already recorded so we don't double-count. */
  const recordedRef = useRef(false);

  // Mount Stockfish AI — it self-activates when gameMode === 'ai'
  useStockfishAI();

  // Mount sound effects — listens to game events and plays tones
  useSoundEffects();

  const {
    fen,
    turn,
    gameStatus,
    selectedSquare,
    legalMoves,
    moveHistory,
    capturedPieces,
    isCheck,
    winner,
    isAIThinking,
    gameMode,
    pendingPromotion,
    lastMove,
    whiteTimeMs,
    blackTimeMs,
    clockRunning,
    selectSquare,
    makeMove,
    completePromotion,
    cancelPromotion,
    undoMove,
    resetGame: storeReset,
    setGameMode,
    updateClock,
    setClockRunning,
    setGameStatus,
  } = useChessStore();

  const clockPreset = useChessSettingsStore((s) => s.clockPreset);
  const playerColor = useChessSettingsStore((s) => s.playerColor);
  const aiLevel = useChessSettingsStore((s) => s.aiLevel);
  const recordGame = useChessStatsStore((s) => s.recordGame);

  // Initialize clock
  useEffect(() => {
    const preset = CLOCK_PRESETS[clockPreset] ?? CLOCK_PRESETS.rapid;
    const clock = new ClockManager(preset.timeMs, preset.incrementMs);

    clock.setOnTick((white, black) => {
      updateClock(white, black);
    });

    clock.setOnTimeout((loser: PieceColor) => {
      const winner: PieceColor = loser === 'w' ? 'b' : 'w';
      setGameStatus('timeout', winner);
    });

    clockRef.current = clock;

    return () => {
      clock.destroy();
    };
  }, [clockPreset, updateClock, setGameStatus]);

  // Start/stop clock based on game status and turn
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock) return;

    const isActive = gameStatus === 'playing';
    const isFinished = ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout'].includes(gameStatus);

    if (isActive && moveHistory.length > 0) {
      clock.start(turn);
      setClockRunning(true);
    } else if (isFinished) {
      clock.stop();
      setClockRunning(false);
    }
  }, [turn, gameStatus, moveHistory.length, setClockRunning]);

  // Switch clock on turn change
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock || !clockRunning) return;
    if (moveHistory.length < 2) return;

    clock.switchTurn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveHistory.length]);

  // Mark the game's start time on the very first move
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

  // Record the game into stats history when it transitions to a terminal state
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

    recordGame({
      finishedAt: Date.now(),
      mode: gameMode,
      aiLevel: gameMode === 'ai' ? aiLevel : undefined,
      endReason: gameStatus as GameEndReason,
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
    isCheck,
    winner,
    isAIThinking,
    gameMode,
    pendingPromotion,
    lastMove,
    whiteTimeMs,
    blackTimeMs,
    clockRunning,

    // Actions
    selectSquare,
    makeMove,
    completePromotion,
    cancelPromotion,
    undoMove,
    resetGame,
    setGameMode,
  };
}
