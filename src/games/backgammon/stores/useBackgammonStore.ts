/**
 * Central Zustand store for the Long Backgammon (Длинные нарды) game.
 *
 * Holds the full `BackgammonState` (board, turn, dice, history, born-off
 * counts, selection) and exposes actions that mutate it. Sprint 2 implements
 * only the actions needed for the 3D MVP (reset + selection). Sprint 3 actions
 * are stubbed with `TODO` markers so TypeScript compiles without gaps.
 *
 * Pattern mirrors `useGoStore` — ephemeral (no localStorage persistence for
 * game state), selector-friendly, no React state inside.
 *
 * @example
 * ```ts
 * const board = useBackgammonStore((s) => s.board);
 * const selectFrom = useBackgammonStore((s) => s.selectFrom);
 * selectFrom(23); // selects white head
 * ```
 */

import { create } from 'zustand';
import {
  createInitialState,
  applySubMove,
  undoSubMove,
  commitTurn,
  isTerminal,
  computeWinType,
  validateSubMove,
} from '../engine/BackgammonEngine';
import { generateLegalSequences } from '../engine/moveGenerator';
import { RULE_PRESETS } from '../config/variants';
import type {
  BackgammonState,
  StoneColor,
  PointIndex,
  SubMove,
  WinType,
} from '../engine/types';
import type { BackgammonRules } from '../config/variants';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

/** Game mode — vs AI or local 2-player. */
export type BackgammonGameMode = 'ai' | 'local';

/**
 * Observable state + actions for the Backgammon game.
 *
 * State fields come directly from `BackgammonState`; additional UI state
 * (gameMode, isAIThinking) lives alongside them.
 */
interface BackgammonStore extends BackgammonState {
  /** Current game mode. */
  gameMode: BackgammonGameMode;

  /**
   * `true` while the AI worker is computing its move sequence.
   * Used by the UI to dim/disable interactive controls during AI think time.
   */
  isAIThinking: boolean;

  // -------------------------------------------------------------------------
  // Sprint 2 actions (fully implemented)
  // -------------------------------------------------------------------------

  /**
   * Create a fresh game with the given rule set.
   * Reads rules from the argument; if omitted falls back to the classic preset.
   *
   * @param rules - Optional rule configuration; defaults to `RULE_PRESETS.classic`.
   */
  resetGame: (rules?: BackgammonRules) => void;

  /**
   * Select or deselect a source point.
   *
   * Selecting is only allowed when:
   * - `gameStatus` is `'choosing'`.
   * - The clicked point has stones of the current turn's color.
   * - Clicking the already-selected point deselects it.
   *
   * No move validation happens here — that is Sprint 3 territory.
   *
   * @param point - The point to select, or `null` to clear selection.
   */
  selectFrom: (point: PointIndex | null) => void;

  /**
   * Change the game mode between AI and local two-player.
   *
   * @param mode - New game mode.
   */
  setGameMode: (mode: BackgammonGameMode) => void;

  // -------------------------------------------------------------------------
  // Sprint 3 stubs — NOT implemented yet
  // -------------------------------------------------------------------------

  /**
   * Trigger a dice roll.
   * TODO (Sprint 3): set `gameStatus` to `'rolling'`; notify Dice3D to animate.
   */
  rollDice: () => void;

  /**
   * Called when the 3D dice settle and face values are known.
   * TODO (Sprint 3): store dice values, transition status to `'choosing'`.
   *
   * @param values - The settled die values `[d1, d2]`.
   */
  onDiceSettled: (values: [number, number]) => void;

  /**
   * Execute one sub-move: move the stone from `selectedFrom` to `to`.
   * TODO (Sprint 3): validate, apply `applySubMove`, consume die, handle auto-commit.
   *
   * @param to  - Destination point index or `'off'` for bear-off.
   * @param die - Die value consumed by this sub-move.
   */
  executeSubMove: (to: PointIndex | 'off', die: number) => void;

  /**
   * Undo the last sub-move in the current pending sequence.
   * TODO (Sprint 3): restore board state, restore die to `remaining`.
   */
  undoLastSubMove: () => void;

  /**
   * Commit the current pending sequence, switch the turn, and record history.
   * TODO (Sprint 3): call `commitTurn` on the engine, switch player.
   */
  confirmTurn: () => void;

  /**
   * Resign the game for the given color (defaults to side-to-move).
   * TODO (Sprint 3/4): mark `gameStatus === 'ended'`, set winner.
   *
   * @param color - The color resigning; omit to resign the active side.
   */
  resign: (color?: StoneColor) => void;

  /**
   * Set or clear the AI-thinking flag.
   *
   * Called by `useBackgammonAI` before and after calling `findBestSequence`
   * on the `BackgammonAIService`. The UI reads this to dim controls.
   *
   * @param thinking - `true` when the AI worker is active, `false` otherwise.
   */
  setAIThinking: (thinking: boolean) => void;
}

// ---------------------------------------------------------------------------
// Initial state helper
// ---------------------------------------------------------------------------

/** Snapshot of the engine initial state merged with UI defaults. */
function makeInitialStoreState(): Omit<
  BackgammonStore,
  | 'resetGame'
  | 'selectFrom'
  | 'setGameMode'
  | 'rollDice'
  | 'onDiceSettled'
  | 'executeSubMove'
  | 'undoLastSubMove'
  | 'confirmTurn'
  | 'resign'
  | 'setAIThinking'
> {
  const engineState = createInitialState(RULE_PRESETS.classic, 'w');
  return {
    ...engineState,
    gameMode: 'ai',
    isAIThinking: false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Central Backgammon game store.
 *
 * Subscribe with selectors to limit re-renders.
 *
 * @returns Combined state + actions store instance.
 *
 * @example
 * ```ts
 * const board = useBackgammonStore((s) => s.board);
 * const reset = useBackgammonStore((s) => s.resetGame);
 * reset(RULE_PRESETS.classic);
 * ```
 */
export const useBackgammonStore = create<BackgammonStore>((set, get) => ({
  ...makeInitialStoreState(),

  // -------------------------------------------------------------------------
  // Sprint 2: reset
  // -------------------------------------------------------------------------

  resetGame(rules) {
    const activeRules = rules ?? RULE_PRESETS.classic;
    const freshState = createInitialState(activeRules, 'w');
    set({ ...freshState, gameMode: get().gameMode });
  },

  // -------------------------------------------------------------------------
  // Sprint 2: selection
  // -------------------------------------------------------------------------

  selectFrom(point) {
    const { board, turn, selectedFrom, gameStatus } = get();

    // Allow deselection at any time.
    if (point === null) {
      set({ selectedFrom: null });
      return;
    }

    // Toggle off if re-clicking the same point.
    if (point === selectedFrom) {
      set({ selectedFrom: null });
      return;
    }

    // Only allow selection when dice are showing (or in idle for Sprint 2 preview).
    // In Sprint 2 the game starts in 'idle'; we allow clicking to preview selection.
    if (gameStatus === 'ended' || gameStatus === 'ai_thinking') return;

    // Only select points that have stones of the current player's color.
    const pointState = board[point];
    if (!pointState || pointState.color !== turn || pointState.count === 0) return;

    set({ selectedFrom: point });
  },

  // -------------------------------------------------------------------------
  // Sprint 2: game mode
  // -------------------------------------------------------------------------

  setGameMode(mode) {
    set({ gameMode: mode });
  },

  // -------------------------------------------------------------------------
  // Sprint 3: dice + turn flow
  // -------------------------------------------------------------------------

  rollDice() {
    const { gameStatus } = get();
    if (gameStatus !== 'idle' && gameStatus !== 'rolling') return;
    set({ gameStatus: 'rolling', selectedFrom: null });
  },

  onDiceSettled(values) {
    const { gameStatus } = get();
    if (gameStatus !== 'rolling') return;

    const remaining =
      values[0] === values[1]
        ? [values[0], values[0], values[0], values[0]]
        : [values[0], values[1]];

    const dice = { values, remaining };
    set({ dice, gameStatus: 'choosing' });

    // Auto-skip if no legal moves exist for this roll
    const state = get() as BackgammonState;
    const seqs = generateLegalSequences(state, values);
    if (seqs.length === 0 || (seqs.length === 1 && seqs[0].length === 0)) {
      get().confirmTurn();
    }
  },

  executeSubMove(to, die) {
    const { selectedFrom, gameStatus, dice } = get();
    if (gameStatus !== 'choosing' || selectedFrom === null || !dice) return;
    if (!dice.remaining.includes(die)) return;

    const state = get() as BackgammonState;
    const move: SubMove = {
      color: state.turn,
      from: selectedFrom,
      to,
      pips: die,
    };

    const validation = validateSubMove(state, move);
    if (!validation.ok) return;

    const next = applySubMove(state, move);
    set({ ...next, selectedFrom: null });

    // Auto-commit if no dice remain
    if (next.dice && next.dice.remaining.length === 0) {
      get().confirmTurn();
      return;
    }

    // Auto-skip remaining dice if no more legal moves
    if (next.dice) {
      const seqs = generateLegalSequences(next, next.dice.values);
      if (seqs.length === 0 || (seqs.length === 1 && seqs[0].length === 0)) {
        get().confirmTurn();
      }
    }
  },

  undoLastSubMove() {
    const state = get() as BackgammonState;
    if (
      state.gameStatus !== 'choosing' ||
      state.pendingSequence.length === 0
    ) {
      return;
    }
    const next = undoSubMove(state);
    set({ ...next });
  },

  confirmTurn() {
    const state = get() as BackgammonState;
    if (state.gameStatus !== 'choosing') return;

    const next = commitTurn(state);

    if (isTerminal(next)) {
      const winType: WinType = computeWinType(next) ?? 'normal';
      const winner = state.turn; // the player who just moved
      set({ ...next, gameStatus: 'ended', winner, winType });
      return;
    }

    set({ ...next, gameStatus: 'idle' });
  },

  resign(color) {
    const { turn, bornOff } = get();
    const loser = color ?? turn;
    const winner: StoneColor = loser === 'w' ? 'b' : 'w';
    const loserBornOff = loser === 'w' ? bornOff.w : bornOff.b;
    const winType: WinType = loserBornOff === 0 ? 'mars' : 'normal';
    set({ gameStatus: 'ended', winner, winType });
  },

  setAIThinking(thinking) {
    set({ isAIThinking: thinking });
  },
}));
