import { useEffect, useRef, useCallback } from 'react';
import { useChessStore } from '../stores/useChessStore';
import { useChessSettingsStore } from '../stores/useChessSettingsStore';
import { ClockManager } from '../engine/ClockManager';
import { CLOCK_PRESETS } from '../config/clockPresets';
import { useStockfishAI } from './useStockfishAI';
import { useSoundEffects } from './useSoundEffects';
import type { PieceColor } from '../engine/types';

/**
 * Main hook that wires together chess store, engine, and clock.
 * Should be used once at the top level of the chess game.
 */
export function useChessGame() {
  const clockRef = useRef<ClockManager | null>(null);

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

  /** Reset game with fresh clock */
  const resetGame = useCallback(() => {
    const preset = CLOCK_PRESETS[clockPreset] ?? CLOCK_PRESETS.rapid;
    clockRef.current?.reset(preset.timeMs, preset.incrementMs);
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
