/**
 * Central Zustand store for the Go game.
 *
 * Wraps a single `GoEngine` instance and re-exposes the parts of its state
 * the UI cares about, together with action creators that translate user
 * intent (click an intersection, pass, resign, reset) into engine calls
 * and observable state transitions.
 *
 * Mirrors the shape of `useCheckersStore` for API parity; dedicated Go
 * features (ko point, prisoners, passes) are added on top.
 */

import { create } from 'zustand';
import { GoEngine } from '../engine/GoEngine';
import { useGoSettingsStore } from './useGoSettingsStore';
import type {
  Board,
  BoardSize,
  CaptureCounts,
  GameStatus,
  Move,
  MoveRejectionReason,
  Point,
  ScoreBreakdown,
  Stone,
} from '../engine/types';
import type { ScoringRules } from '../config/scoringRules';
import { findTerritories } from '../engine/scoring';
import { getGroup, pointKey } from '../utils/groupUtils';

/** Game mode — vs AI or local 2-player. Mirrors checkers. */
export type GoGameMode = 'ai' | 'local';

/** How long a captured-stone ghost lingers before being unmounted (ms). */
const CAPTURE_FADE_MS = 700;

/** Monotonic counter for unique fading-stone ids. */
let fadingIdCounter = 0;

/**
 * A stone that has been removed from the board but is still being rendered
 * visually while its fade-out animation plays. Not part of the engine board.
 */
export interface FadingGoStone {
  /** Unique id for React keying. */
  id: string;
  /** Grid point the captured stone used to occupy. */
  point: Point;
  /** Color of the captured stone. */
  color: Stone;
}

/** Shape of the observable Go game state. */
interface GoState {
  /** Current board matrix (row-major). */
  board: Board;
  /** Side to move. */
  turn: Stone;
  /** Full list of moves played so far (play / pass / resign). */
  moveHistory: Move[];
  /** Captured-stone counters per color. */
  captured: CaptureCounts;
  /** Simple ko point, or `null` when no ko is active. */
  koPoint: Point | null;
  /** Consecutive pass counter (resets on any play). */
  passCount: number;
  /** Lifecycle status. */
  gameStatus: GameStatus;
  /** Winner color or `'draw'` once the game ends. */
  winner: Stone | 'draw' | null;
  /** Last *play* point, for board highlighting. */
  lastPoint: Point | null;
  /** Board size chosen for the current session. */
  boardSize: BoardSize;
  /** Scoring ruleset selected for the current session. */
  scoringRules: ScoringRules;
  /** Komi compensation used for the current session. */
  komi: number;
  /** Whether the AI is currently computing a move. */
  isAIThinking: boolean;
  /** Current game mode. */
  gameMode: GoGameMode;
  /** Most recent rejection reason (for transient UI feedback); cleared on next success. */
  lastRejection: MoveRejectionReason | null;
  /** Stones that were just captured and are currently fading out visually. */
  fadingStones: FadingGoStone[];
  /** Move count at the moment the last move was played (ticked on each success). */
  lastSuccessTick: number;
  /** Tick that increments each time a capture happens (for sound / FX). */
  lastCaptureTick: number;
  /** Tick that increments each time a placement fails (for sound / FX). */
  lastRejectTick: number;
  /** Tick that increments each time a pass is accepted (for sound). */
  lastPassTick: number;

  /**
   * Points marked as dead during the scoring phase.
   * Clicking a stone during scoring toggles its entire group in/out of this list.
   */
  deadStones: Point[];

  /**
   * Live territory map computed from the current board and dead-stone selection.
   * Keyed by `"x,y"` → owning color or `'neutral'`. Recomputed each time
   * `deadStones` changes during the scoring phase.
   */
  territoryMap: Map<string, Stone | 'neutral'> | null;

  /**
   * Live score breakdown computed from the current dead-stone selection.
   * Recomputed each time `deadStones` changes during the scoring phase.
   */
  scoringBreakdown: ScoreBreakdown | null;
}

/** Actions available on the Go store. */
interface GoActions {
  /** Place a stone at `point` for the side to move. */
  playAt: (point: Point) => boolean;
  /** Pass the current turn. */
  pass: () => void;
  /** Resign the current game (defaults to side-to-move). */
  resign: (color?: Stone) => void;
  /** Undo the most recent action. In AI mode undoes both the human and AI moves. */
  undoMove: () => void;
  /**
   * Undo exactly one move (no AI double-undo).
   * Used when resuming from the scoring phase — we only want to retract
   * the second pass, not the AI's preceding pass.
   */
  undoSingle: () => void;
  /**
   * Tear down the current engine and start a fresh game.
   *
   * Reads the **current** values from {@link useGoSettingsStore} at call time,
   * so any board-size or scoring-rule change made in the settings panel takes
   * effect immediately on the next game without requiring a page reload.
   * All tick counters and fading-stone ghosts are reset to zero.
   */
  resetGame: () => void;
  /** Set the game mode (ai / local). */
  setGameMode: (mode: GoGameMode) => void;
  /** Flip the "AI thinking" flag. */
  setAIThinking: (thinking: boolean) => void;
  /** Finalize scoring using the current dead-stone selection. */
  finalizeScore: () => void;
  /**
   * Toggle a stone (and its entire connected group) as dead/alive during
   * the scoring phase. Recomputes territory map and score breakdown.
   */
  toggleDeadStone: (point: Point) => void;
  /** Remove a set of fading-stone ghosts by id. */
  removeFadingStones: (ids: string[]) => void;
  /** Get the underlying engine (used by AI / SGF export). */
  getEngine: () => GoEngine;
}

/** Initial session defaults. Later overridden by a settings store. */
const INITIAL_BOARD_SIZE: BoardSize = 19;
const INITIAL_RULES: ScoringRules = 'chinese';

/**
 * Build a fresh engine for the current session config.
 *
 * @param boardSize - Board dimension.
 * @param scoringRules - Scoring ruleset.
 * @returns A newly-constructed `GoEngine`.
 */
function makeEngine(boardSize: BoardSize, scoringRules: ScoringRules): GoEngine {
  return new GoEngine({ boardSize, scoringRules });
}

let engine = makeEngine(INITIAL_BOARD_SIZE, INITIAL_RULES);

/** Fields derived directly from the engine — recomputed on every action. */
type EngineDerived = Pick<
  GoState,
  | 'board'
  | 'turn'
  | 'moveHistory'
  | 'captured'
  | 'koPoint'
  | 'passCount'
  | 'gameStatus'
  | 'winner'
  | 'lastPoint'
>;

/** Snapshot reactive state from the engine. */
function snapshot(): EngineDerived {
  const lastPlay = [...engine.moveHistory]
    .reverse()
    .find((m): m is Extract<Move, { kind: 'play' }> => m.kind === 'play');
  return {
    board: engine.board.map((row) => [...row]),
    turn: engine.turn,
    moveHistory: [...engine.moveHistory],
    captured: { ...engine.captured },
    koPoint: engine.koPoint ? { ...engine.koPoint } : null,
    passCount: engine.passCount,
    gameStatus: engine.status,
    winner: engine.winner,
    lastPoint: lastPlay ? { ...lastPlay.point } : null,
  };
}

/**
 * Central Go game store.
 *
 * Subscribe with selectors to limit re-renders. Combining multiple selectors
 * with `shallow` prevents spurious renders when the selected slice is
 * reference-stable between updates.
 *
 * @returns Combined `GoState & GoActions` store instance.
 *
 * @example
 * ```ts
 * // Single-value selector (most common)
 * const board = useGoStore((s) => s.board);
 *
 * // Action selector (stable reference — safe to omit from dependency arrays)
 * const playAt = useGoStore((s) => s.playAt);
 *
 * // Scoring phase — toggle a stone group dead
 * const toggleDeadStone = useGoStore((s) => s.toggleDeadStone);
 * toggleDeadStone({ x: 3, y: 4 });
 * ```
 */
export const useGoStore = create<GoState & GoActions>((set, get) => ({
  ...snapshot(),
  boardSize: INITIAL_BOARD_SIZE,
  scoringRules: INITIAL_RULES,
  komi: engine.komi,
  isAIThinking: false,
  gameMode: 'ai',
  lastRejection: null,
  fadingStones: [],
  lastSuccessTick: 0,
  lastCaptureTick: 0,
  lastRejectTick: 0,
  lastPassTick: 0,
  deadStones: [],
  territoryMap: null,
  scoringBreakdown: null,

  playAt(point: Point) {
    const state = get();
    if (state.isAIThinking) return false;
    if (state.gameStatus === 'ended' || state.gameStatus === 'scoring') return false;
    const result = engine.playMove(point);
    if (!result.success) {
      set({
        lastRejection: result.reason ?? null,
        lastRejectTick: state.lastRejectTick + 1,
      });
      return false;
    }

    // Build fading-ghost entries for any captured stones. After a successful
    // play, engine.turn now points to the color whose stones were removed.
    const capturedColor: Stone = engine.turn;
    const newFading: FadingGoStone[] = result.captured.map((p) => ({
      id: `go-fade-${++fadingIdCounter}`,
      point: { ...p },
      color: capturedColor,
    }));

    set({
      ...snapshot(),
      lastRejection: null,
      lastSuccessTick: state.lastSuccessTick + 1,
      lastCaptureTick:
        result.captured.length > 0
          ? state.lastCaptureTick + 1
          : state.lastCaptureTick,
      fadingStones:
        newFading.length > 0
          ? [...state.fadingStones, ...newFading]
          : state.fadingStones,
    });

    if (newFading.length > 0) {
      const ids = newFading.map((f) => f.id);
      setTimeout(() => {
        get().removeFadingStones(ids);
      }, CAPTURE_FADE_MS);
    }

    return true;
  },

  pass() {
    const state = get();
    if (state.isAIThinking) return;
    const result = engine.pass();
    if (!result.success) {
      set({
        lastRejection: result.reason ?? null,
        lastRejectTick: state.lastRejectTick + 1,
      });
      return;
    }
    const snap = snapshot();

    // When the game enters scoring, compute initial territory + breakdown
    // with an empty dead-stone list so the overlay shows a starting estimate.
    if (snap.gameStatus === 'scoring') {
      const emptyDead: Point[] = [];
      const territories = findTerritories(engine.board, emptyDead);
      const breakdown = engine.previewScore(emptyDead);
      set({
        ...snap,
        lastRejection: null,
        lastPassTick: state.lastPassTick + 1,
        deadStones: emptyDead,
        territoryMap: territories,
        scoringBreakdown: breakdown,
      });
    } else {
      set({
        ...snap,
        lastRejection: null,
        lastPassTick: state.lastPassTick + 1,
      });
    }
  },

  resign(color) {
    engine.resign(color);
    set({ ...snapshot() });
  },

  finalizeScore() {
    if (engine.status !== 'scoring') return;
    const { deadStones } = get();
    engine.finalizeScore(deadStones);
    set({ ...snapshot(), deadStones: [], territoryMap: null, scoringBreakdown: null });
  },

  toggleDeadStone(point: Point) {
    if (engine.status !== 'scoring') return;

    // The clicked cell must hold a stone.
    const cell = engine.board[point.y]?.[point.x];
    if (cell !== 'b' && cell !== 'w') return;

    // Expand the click to the full connected group so entire groups are
    // toggled dead/alive at once — standard Go scoring UX.
    const group = getGroup(engine.board, point);
    const groupKeys = new Set(group.map(pointKey));

    const { deadStones } = get();
    const deadSet = new Set(deadStones.map(pointKey));

    // If ANY stone of the group is already dead, mark the whole group alive;
    // otherwise mark the whole group dead.
    const alreadyDead = group.some((p) => deadSet.has(pointKey(p)));

    let nextDead: Point[];
    if (alreadyDead) {
      // Remove all group points from dead list
      nextDead = deadStones.filter((p) => !groupKeys.has(pointKey(p)));
    } else {
      // Add all group points to dead list
      nextDead = [...deadStones, ...group];
    }

    // Recompute territory + breakdown with updated dead stones.
    const territories = findTerritories(engine.board, nextDead);
    const breakdown = engine.previewScore(nextDead);
    set({ deadStones: nextDead, territoryMap: territories, scoringBreakdown: breakdown });
  },

  removeFadingStones(ids: string[]) {
    const idSet = new Set(ids);
    set((s) => ({ fadingStones: s.fadingStones.filter((f) => !idSet.has(f.id)) }));
  },

  undoMove() {
    if (engine.moveHistory.length === 0) return;
    engine.undoMove();
    // In AI mode, also undo the AI's prior move so control returns to the human.
    if (get().gameMode === 'ai' && engine.moveHistory.length > 0) {
      engine.undoMove();
    }
    set({ ...snapshot(), lastRejection: null, fadingStones: [] });
  },

  undoSingle() {
    if (engine.moveHistory.length === 0) return;
    engine.undoMove();
    set({
      ...snapshot(),
      lastRejection: null,
      fadingStones: [],
      deadStones: [],
      territoryMap: null,
      scoringBreakdown: null,
    });
  },

  resetGame() {
    // Read current settings from the persistent settings store so that
    // board-size and scoring-rule changes made in the settings panel take
    // effect on the next game.
    const settings = useGoSettingsStore.getState();
    const newSize = settings.boardSize;
    const newRules = settings.scoringRules;

    engine = makeEngine(newSize, newRules);
    set({
      ...snapshot(),
      boardSize: newSize,
      scoringRules: newRules,
      komi: engine.komi,
      isAIThinking: false,
      lastRejection: null,
      fadingStones: [],
      deadStones: [],
      territoryMap: null,
      scoringBreakdown: null,
      lastSuccessTick: 0,
      lastCaptureTick: 0,
      lastRejectTick: 0,
      lastPassTick: 0,
    });
  },

  setGameMode(mode) {
    set({ gameMode: mode });
  },

  setAIThinking(thinking) {
    set({ isAIThinking: thinking });
  },

  getEngine() {
    return engine;
  },
}));
