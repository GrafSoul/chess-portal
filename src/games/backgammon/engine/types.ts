/**
 * Core type definitions for the Long Backgammon (Длинные нарды) game engine.
 *
 * Rules summary relevant to these types:
 * - Two players (White = 'w', Black = 'b') move 15 stones each around the
 *   same 24-point ring in the counter-clockwise direction.
 * - White starts with all 15 stones on point 23 (White Head).
 * - Black starts with all 15 stones on point 11 (Black Head).
 * - Only one color may occupy a point at a time; no hitting/blotting.
 * - A turn consists of 2 sub-moves (4 for doubles), consuming one die each.
 * - Players must use both dice if legal; if only one is playable they must
 *   use the larger die value (strictMaxDieRule).
 * - The game ends when one side bears off all 15 stones.
 */

import type { BackgammonRules } from '../config/variants';

/**
 * The two playing colors.
 *
 * - `'w'` — White (голова на пункте 23, дом 0..5)
 * - `'b'` — Black (голова на пункте 11, дом 12..17)
 */
export type StoneColor = 'w' | 'b';

/**
 * A 0-based index into the 24-point board ring.
 * Valid values are integers in the range `[0, 23]`.
 *
 * Point layout (from the plan):
 * ```
 *   12 11 10  9  8  7       6  5  4  3  2  1
 * +-------------------+   +-------------------+
 * |  black home (17)  |   |   white home (0)  |
 * +-------------------+   +-------------------+
 *   13 14 15 16 17 18      19 20 21 22 23  0
 * ```
 * - White path: 23 → 22 → … → 1 → 0 → 'off'
 * - Black path: 11 → 10 → … → 0 → 23 → … → 12 → 'off'
 */
export type PointIndex = number;

/**
 * A single "sub-move": one stone moved by `pips` points along its path.
 *
 * `from` is always a board point index (0..23). The head is just the
 * color's starting point index (23 for White, 11 for Black).
 * `to` is either the destination point index or `'off'` when the stone
 * is borne off the board.
 */
export interface SubMove {
  /** The color of the stone being moved. */
  color: StoneColor;
  /** The source point index (0..23). */
  from: PointIndex;
  /** The destination: a point index or `'off'` for bearing off. */
  to: PointIndex | 'off';
  /** The die value consumed by this sub-move. */
  pips: number;
}

/**
 * A full turn: a sequence of 2 sub-moves for a normal roll, or 4 for doubles.
 * May be shorter when no further legal moves exist after partial play.
 */
export type MoveSequence = SubMove[];

/**
 * The current dice state for a turn.
 *
 * `values` holds the raw two-die roll `[d1, d2]`.
 * `remaining` starts as `[d1, d2]` (or `[d,d,d,d]` for doubles) and
 * shrinks by one entry each time a sub-move is applied.
 */
export interface DiceRoll {
  /** The original dice values as rolled `[1..6, 1..6]`. */
  values: [number, number];
  /**
   * Die values still available to play this turn.
   * Doubles expand to four entries, e.g. `[3,3] → [3,3,3,3]`.
   */
  remaining: number[];
}

/**
 * Occupancy of a single board point.
 *
 * Only one color may stand on a point at a time (no blotting in Long Backgammon).
 * An empty point has `color: null` and `count: 0`.
 */
export interface PointState {
  /** The color occupying this point, or `null` if empty. */
  color: StoneColor | null;
  /** Number of stones of `color` on this point (0..15). */
  count: number;
}

/**
 * Lifecycle status of the backgammon game.
 *
 * - `'idle'`        — Game not yet started; waiting for first dice roll.
 * - `'rolling'`     — Dice animation in progress; input blocked.
 * - `'choosing'`    — Dice settled; current player selects moves.
 * - `'ai_thinking'` — AI is computing its move sequence in the worker.
 * - `'ended'`       — Game over; a winner has been declared.
 */
export type GameStatus = 'idle' | 'rolling' | 'choosing' | 'ai_thinking' | 'ended';

/**
 * Win classification determines the point value of the victory.
 *
 * - `'normal'` — Opponent has ≥1 stone borne off; 1 point.
 * - `'mars'`   — Opponent has 0 stones borne off; 2 points (a "backgammon").
 * - `'kokc'`   — `mars` condition AND opponent has stones outside the
 *                winner's home quadrant; 3 points (enabled by `rules.enableKokc`).
 */
export type WinType = 'normal' | 'mars' | 'kokc';

/**
 * One entry in the move history, representing a completed turn.
 */
export interface HistoryEntry {
  /** The color whose turn this was. */
  color: StoneColor;
  /** The raw dice values rolled at the start of this turn. */
  dice: [number, number];
  /** The sequence of sub-moves executed (may be empty if no moves were possible). */
  sequence: MoveSequence;
  /** 1-based turn number (increments once per player per full turn pair). */
  turnNumber: number;
}

/**
 * Complete, serializable game state for Long Backgammon.
 *
 * All game logic functions in this engine accept and return `BackgammonState`
 * without mutating the input (pure / immutable style).
 */
export interface BackgammonState {
  /**
   * The 24-point board, indexed 0..23.
   * `board[i]` describes how many stones of which color occupy point `i`.
   */
  board: PointState[];

  /** The color whose turn it currently is. */
  turn: StoneColor;

  /**
   * Current dice roll, or `null` when no dice have been thrown yet
   * (status is `'idle'` or `'rolling'`).
   */
  dice: DiceRoll | null;

  /** Chronological list of completed turns. */
  moveHistory: HistoryEntry[];

  /**
   * Counts of stones each color has successfully borne off the board.
   * When either reaches 15 the game is over.
   */
  bornOff: { w: number; b: number };

  /** Lifecycle phase of the game. */
  gameStatus: GameStatus;

  /** Winning color, or `null` while the game is still in progress. */
  winner: StoneColor | null;

  /** Win classification, or `null` while the game is in progress. */
  winType: WinType | null;

  /** Active rule configuration for this game session. */
  rules: BackgammonRules;

  /**
   * `true` until each side has committed their first full turn.
   * Controls the "6-6/4-4/3-3 head exception" and is tracked per color
   * via `firstTurnDone` in the engine helpers.
   *
   * Implementation note: the flag resets to `false` for the current
   * player once `commitTurn` is called for the first time for that color.
   * In practice we track it as a single flag that is `true` on a player's
   * very first turn and `false` on all subsequent turns.
   */
  isFirstTurn: boolean;

  /**
   * How many stones the current player has already moved off their head
   * during this turn. Normally capped at 1; may reach 2 under the
   * first-turn doubles exception.
   */
  headTakenThisTurn: number;

  /**
   * The source point index the player has selected but not yet moved to.
   * `null` when no source is selected.
   */
  selectedFrom: PointIndex | null;

  /**
   * Sub-moves executed this turn that have not yet been committed.
   * The player may undo these until `commitTurn` is called.
   */
  pendingSequence: SubMove[];
}

export type { BackgammonRules };
