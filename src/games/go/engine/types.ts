/**
 * Type definitions for the Go (Weiqi / Baduk) game engine.
 *
 * Go rules summary:
 * - Two players (Black and White) alternately place stones on intersections
 *   of a 9×9 or 19×19 grid.
 * - Black moves first (unless handicap is given, in which case Black pre-places
 *   N stones and White moves first).
 * - A stone (or connected group of same-color stones) is captured when it
 *   has zero liberties (no adjacent empty intersections).
 * - Suicide is illegal: you may not play a stone that would leave your own
 *   group with zero liberties UNLESS the move also captures one or more
 *   opponent stones (in which case the captures create liberties first).
 * - Ko rule: you may not immediately recreate the previous board position
 *   (simple ko — this engine tracks the basic ko point; full superko uses
 *   Zobrist hashing in a later sprint).
 * - The game ends when both players pass consecutively, then the board is
 *   scored by territory + stones (Chinese) or territory + prisoners (Japanese).
 */

import type { ScoringRules } from '../config/scoringRules';

/** A stone color: Black or White. */
export type Stone = 'b' | 'w';

/** A single board intersection: either a stone or empty (null). */
export type Intersection = Stone | null;

/**
 * Board matrix indexed as `board[row][col]`.
 * Row 0 is the top of the board, column 0 is the left.
 */
export type Board = Intersection[][];

/**
 * A 0-based point on the board.
 * `x` is the column (0 = leftmost), `y` is the row (0 = topmost).
 */
export interface Point {
  /** Column index (0-based, 0 = leftmost). */
  x: number;
  /** Row index (0-based, 0 = topmost). */
  y: number;
}

/** Supported board dimensions (Go is traditionally played on 9×9 or 19×19). */
export type BoardSize = 9 | 19;

/**
 * A discriminated union describing a single move in the game record.
 * `play` — a stone placement; `pass` — skip turn; `resign` — concede the game.
 */
export type Move =
  | { kind: 'play'; point: Point; color: Stone }
  | { kind: 'pass'; color: Stone }
  | { kind: 'resign'; color: Stone };

/** Lifecycle status of the game. */
export type GameStatus = 'idle' | 'playing' | 'scoring' | 'ended';

/** Reason a move was rejected. */
export type MoveRejectionReason =
  | 'occupied'
  | 'ko'
  | 'suicide'
  | 'outOfBounds'
  | 'gameEnded';

/** Result of attempting to play a move. */
export interface MoveResult {
  /** Whether the move was accepted and applied. */
  success: boolean;
  /** Points of opponent stones captured by the move (empty on failure). */
  captured: Point[];
  /** Reason the move was rejected, if `success` is false. */
  reason?: MoveRejectionReason;
}

/** Per-color score components. */
export interface ColorScore {
  /** Empty intersections surrounded solely by this color. */
  territory: number;
  /** Stones of this color on the board (Chinese scoring). */
  stones: number;
  /** Opponent stones captured by this color (Japanese scoring). */
  prisoners: number;
  /** Total score for this color. */
  total: number;
}

/** White-specific score components — adds komi. */
export interface WhiteScore extends ColorScore {
  /** Komi compensation awarded to white. */
  komi: number;
}

/** Full score breakdown returned at the end of a game. */
export interface ScoreBreakdown {
  /** Black's score components. */
  black: ColorScore;
  /** White's score components, including komi. */
  white: WhiteScore;
  /** Winning color, or `'draw'` if totals are equal. */
  winner: Stone | 'draw';
  /** Absolute margin of victory (0 on draw). */
  margin: number;
}

/** Engine constructor options. */
export interface GoEngineOptions {
  /** Board dimension (9 or 19). */
  boardSize: BoardSize;
  /** Predefined handicap stone placements (Black's starting stones). */
  handicapStones?: Point[];
  /** Komi compensation for White; if omitted, the ruleset default is used. */
  komi?: number;
  /** Scoring ruleset to apply at the end of the game. */
  scoringRules?: ScoringRules;
}

/** Captured-stone counters (stones removed BY each color — i.e. prisoners held). */
export interface CaptureCounts {
  /** Opponent stones captured by Black. */
  black: number;
  /** Opponent stones captured by White. */
  white: number;
}

/** Serialized engine state (see `GoEngine.toJSON`). */
export interface GoEngineJSON {
  boardSize: BoardSize;
  board: Board;
  turn: Stone;
  moveHistory: Move[];
  captured: CaptureCounts;
  koPoint: Point | null;
  passCount: number;
  status: GameStatus;
  winner: Stone | 'draw' | null;
  komi: number;
  scoringRules: ScoringRules;
}
