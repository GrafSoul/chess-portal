/**
 * Facade hook that exposes the live Go game state and high-level actions
 * to page components. Layers subsystems (sound effects, AI) onto the
 * raw store to keep the page component thin.
 *
 * Mirrors `useCheckersGame` for API parity.
 */

import { useGoStore } from '../stores/useGoStore';
import { useGoSoundEffects } from './useGoSoundEffects';
import { useGoAI } from './useGoAI';

/**
 * Facade hook that wires together all Go subsystems (store, sound, AI) and
 * exposes a single typed bundle to the `GoPage` component.
 *
 * On mount this hook:
 * 1. Activates `useGoSoundEffects` — synthesises WebAudio sounds on game events.
 * 2. Activates `useGoAI` — spawns the MCTS worker and drives AI turns.
 *
 * The returned object is stable across renders for fields that have not
 * changed — Zustand's selector equality prevents unnecessary re-renders.
 *
 * @returns An object containing:
 *   - **State** — `board`, `boardSize`, `turn`, `moveHistory`, `captured`,
 *     `koPoint`, `passCount`, `gameStatus`, `winner`, `lastPoint`,
 *     `isAIThinking`, `gameMode`, `lastRejection`,
 *     `deadStones`, `scoringBreakdown`
 *   - **Actions** — `playAt`, `pass`, `resign`, `undoMove`, `undoSingle`,
 *     `resetGame`, `setGameMode`, `finalizeScore`, `toggleDeadStone`
 *
 * @example
 * ```tsx
 * function GoPage() {
 *   const {
 *     board, turn, gameStatus,
 *     deadStones, scoringBreakdown,
 *     playAt, pass, resign,
 *     toggleDeadStone, finalizeScore,
 *   } = useGoGame();
 *
 *   return (
 *     <>
 *       <GoScene />
 *       {gameStatus === 'scoring' && (
 *         <ScoringPanel
 *           breakdown={scoringBreakdown}
 *           deadCount={deadStones.length}
 *           onFinalize={finalizeScore}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useGoGame() {
  // Attach event-driven subsystems.
  useGoSoundEffects();
  useGoAI();

  const board = useGoStore((s) => s.board);
  const boardSize = useGoStore((s) => s.boardSize);
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

  const playAt = useGoStore((s) => s.playAt);
  const pass = useGoStore((s) => s.pass);
  const resign = useGoStore((s) => s.resign);
  const undoMove = useGoStore((s) => s.undoMove);
  const undoSingle = useGoStore((s) => s.undoSingle);
  const resetGame = useGoStore((s) => s.resetGame);
  const setGameMode = useGoStore((s) => s.setGameMode);
  const finalizeScore = useGoStore((s) => s.finalizeScore);
  const toggleDeadStone = useGoStore((s) => s.toggleDeadStone);

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
