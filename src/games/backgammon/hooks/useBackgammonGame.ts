/**
 * Facade hook for the Backgammon game page.
 *
 * Aggregates all store state and actions needed by `BackgammonPage` into a
 * single stable return value. Also:
 * - Mounts the `useBackgammonAI` hook so the AI worker lifecycle is tied to
 *   the component tree that renders the game.
 * - Wires up automatic stats recording when the game transitions to `'ended'`,
 *   mirroring the same pattern used by `useGoGame`.
 *
 * @example
 * ```tsx
 * function BackgammonPage() {
 *   const { board, turn, rollDice, isAIThinking } = useBackgammonGame();
 *   // ...
 * }
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import { useBackgammonStore } from '../stores/useBackgammonStore';
import { useBackgammonSettingsStore } from '../stores/useBackgammonSettingsStore';
import { useBackgammonStatsStore } from '../stores/useBackgammonStatsStore';
import { useBackgammonAI } from './useBackgammonAI';
import type {
  PointState,
  StoneColor,
  DiceRoll,
  HistoryEntry,
  PointIndex,
  SubMove,
  WinType,
  GameStatus,
} from '../engine/types';
import type { AILevel } from '../config/aiLevels';
import type { BackgammonGameMode } from '../stores/useBackgammonStore';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/**
 * All state and actions exposed by `useBackgammonGame` for consumption by
 * `BackgammonPage` and its child components.
 */
export interface BackgammonGameBundle {
  // ---- Board state ---------------------------------------------------------
  /** Current 24-point board occupancy. */
  board: PointState[];
  /** The color whose turn it currently is. */
  turn: StoneColor;
  /** Current dice state, or `null` when no dice have been rolled yet. */
  dice: DiceRoll | null;
  /** Lifecycle phase of the game. */
  gameStatus: GameStatus;
  /** Winner color, or `null` while the game is in progress. */
  winner: StoneColor | null;
  /** Win classification (normal / mars / kokc), or `null` while in progress. */
  winType: WinType | null;
  /** Stones borne off per color. */
  bornOff: { w: number; b: number };
  /** Currently selected source point, or `null`. */
  selectedFrom: PointIndex | null;
  /** Sub-moves executed this turn, not yet committed. */
  pendingSequence: SubMove[];
  /** Completed turn history. */
  moveHistory: HistoryEntry[];
  /** `true` while the AI worker is computing its move sequence. */
  isAIThinking: boolean;
  /** Current game mode (`'ai'` or `'local'`). */
  gameMode: BackgammonGameMode;

  // ---- Settings ------------------------------------------------------------
  /** The color controlled by the local human player. */
  playerColor: StoneColor;
  /** Current AI difficulty level. */
  aiLevel: AILevel;

  // ---- Actions -------------------------------------------------------------
  /** Trigger a dice roll (transitions status → `'rolling'`). */
  rollDice: () => void;
  /** Called by Dice3D when dice settle; stores values and transitions → `'choosing'`. */
  onDiceSettled: (values: [number, number]) => void;
  /**
   * Execute one sub-move from the selected source point to `to`.
   *
   * @param to  - Destination point index or `'off'` for bear-off.
   * @param die - Die value consumed by this sub-move.
   */
  executeSubMove: (to: PointIndex | 'off', die: number) => void;
  /** Undo the last pending sub-move. */
  undoLastSubMove: () => void;
  /** Commit the pending sequence and switch the turn. */
  confirmTurn: () => void;
  /** Resign the game for the given color (defaults to active side). */
  resign: (color?: StoneColor) => void;
  /** Reset the game with the current rule settings. */
  resetGame: () => void;
  /**
   * Select or deselect a source point.
   *
   * @param point - The point to select, or `null` to clear.
   */
  selectFrom: (point: PointIndex | null) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Facade hook that mounts the AI subsystem, wires stats recording, and
 * aggregates all Backgammon game state and actions for `BackgammonPage`.
 *
 * **Stats recording** mirrors `useGoGame`:
 * - A `gameStartedAtRef` captures the wall-clock time of the first turn.
 * - When `gameStatus` transitions to `'ended'`, a single record is written to
 *   `useBackgammonStatsStore` via `recordGame`.
 * - A `resignedRef` is set by the wrapped `resign` callback so the
 *   `endReason` can be distinguished from a normal completion.
 *
 * @returns A `BackgammonGameBundle` with all state fields and action callbacks.
 *
 * @example
 * ```tsx
 * export function BackgammonPage() {
 *   const game = useBackgammonGame();
 *   return (
 *     <button disabled={game.isAIThinking} onClick={game.rollDice}>Roll</button>
 *   );
 * }
 * ```
 */
export function useBackgammonGame(): BackgammonGameBundle {
  // Mount AI worker subsystem — tied to the component tree lifetime.
  useBackgammonAI();

  // ---- Board / game state --------------------------------------------------
  const board = useBackgammonStore((s) => s.board);
  const turn = useBackgammonStore((s) => s.turn);
  const dice = useBackgammonStore((s) => s.dice);
  const gameStatus = useBackgammonStore((s) => s.gameStatus);
  const winner = useBackgammonStore((s) => s.winner);
  const winType = useBackgammonStore((s) => s.winType);
  const bornOff = useBackgammonStore((s) => s.bornOff);
  const selectedFrom = useBackgammonStore((s) => s.selectedFrom);
  const pendingSequence = useBackgammonStore((s) => s.pendingSequence);
  const moveHistory = useBackgammonStore((s) => s.moveHistory);
  const isAIThinking = useBackgammonStore((s) => s.isAIThinking);
  const gameMode = useBackgammonStore((s) => s.gameMode);

  // ---- Actions -------------------------------------------------------------
  const rollDice = useBackgammonStore((s) => s.rollDice);
  const onDiceSettled = useBackgammonStore((s) => s.onDiceSettled);
  const executeSubMove = useBackgammonStore((s) => s.executeSubMove);
  const undoLastSubMove = useBackgammonStore((s) => s.undoLastSubMove);
  const confirmTurn = useBackgammonStore((s) => s.confirmTurn);
  const resignRaw = useBackgammonStore((s) => s.resign);
  const resetGameRaw = useBackgammonStore((s) => s.resetGame);
  const selectFrom = useBackgammonStore((s) => s.selectFrom);

  // ---- Settings ------------------------------------------------------------
  const playerColor = useBackgammonSettingsStore((s) => s.playerColor);
  const aiLevel = useBackgammonSettingsStore((s) => s.aiLevel);
  const getActiveRules = useBackgammonSettingsStore((s) => s.getActiveRules);
  const rulesPreset = useBackgammonSettingsStore((s) => s.rulesPreset);

  // ---- Stats recording -----------------------------------------------------
  const recordGame = useBackgammonStatsStore((s) => s.recordGame);

  /**
   * Tracks the wall-clock start time of the current game session.
   * Set to `Date.now()` the first time a turn is completed, cleared on reset.
   */
  const gameStartedAtRef = useRef<number | null>(null);

  /**
   * Tracks the previous `gameStatus` value so the recording effect can detect
   * the `* → 'ended'` transition without recording twice.
   */
  const prevStatusRef = useRef<GameStatus>('idle');

  /**
   * Set to `true` when `resign()` is called so the stats record can
   * distinguish a resign from a normal game completion.
   */
  const resignedRef = useRef(false);

  /** Set to `true` once a game record has been written to prevent duplicates. */
  const recordedRef = useRef(false);

  // Mark game start the first time a turn is committed; reset on new game.
  useEffect(() => {
    if (moveHistory.length === 1 && gameStartedAtRef.current === null) {
      gameStartedAtRef.current = Date.now();
      recordedRef.current = false;
    }
    if (moveHistory.length === 0) {
      gameStartedAtRef.current = null;
      recordedRef.current = false;
      resignedRef.current = false;
    }
  }, [moveHistory.length]);

  // Write a stats record exactly once when the game ends.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;

    // Only fire on the first `* → 'ended'` transition.
    if (recordedRef.current) return;
    if (prev === gameStatus) return;
    if (gameStatus !== 'ended') return;
    // Skip games that ended before any turn was played (e.g., immediate resign).
    if (moveHistory.length === 0 && !resignedRef.current) return;

    const startedAt = gameStartedAtRef.current ?? Date.now();
    const durationMs = Math.max(0, Date.now() - startedAt);

    const endReason = resignedRef.current ? 'resigned' : 'completed';

    // Outcome from the human player's perspective (null in local 2-player mode).
    const outcome =
      gameMode === 'ai' && winner !== null
        ? winner === playerColor
          ? 'win'
          : 'loss'
        : null;

    recordGame({
      finishedAt: Date.now(),
      mode: gameMode,
      aiLevel: gameMode === 'ai' ? aiLevel : undefined,
      endReason,
      outcome,
      winner,
      playerColor,
      winType,
      moveCount: moveHistory.length,
      durationMs,
      rulesPreset,
    });

    recordedRef.current = true;
  }, [
    gameStatus,
    winner,
    winType,
    moveHistory.length,
    playerColor,
    gameMode,
    aiLevel,
    rulesPreset,
    recordGame,
  ]);

  // ---- Wrapped actions -----------------------------------------------------

  /**
   * Reset the game using the currently active rules from the settings store.
   * Wraps `resetGame(rules)` so callers do not need to import the settings store.
   */
  const resetGame = useCallback(() => {
    resetGameRaw(getActiveRules());
  }, [resetGameRaw, getActiveRules]);

  /**
   * Resign the current game. Sets the `resignedRef` flag before calling the
   * store action so the stats recording effect can detect the resign path.
   *
   * @param color - The resigning color; defaults to the currently active side.
   */
  const resign = useCallback(
    (color?: StoneColor) => {
      resignedRef.current = true;
      resignRaw(color);
    },
    [resignRaw],
  );

  return {
    board,
    turn,
    dice,
    gameStatus,
    winner,
    winType,
    bornOff,
    selectedFrom,
    pendingSequence,
    moveHistory,
    isAIThinking,
    gameMode,
    playerColor,
    aiLevel,
    rollDice,
    onDiceSettled,
    executeSubMove,
    undoLastSubMove,
    confirmTurn,
    resign,
    resetGame,
    selectFrom,
  };
}
