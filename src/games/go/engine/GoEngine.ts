/**
 * Core Go game engine.
 *
 * Responsibilities:
 * - Maintain the board state, turn, move history, and prisoner counts
 * - Validate and apply moves (`play`, `pass`, `resign`)
 * - Detect captures via liberty check after each placement
 * - Enforce simple ko (no immediate recapture of the previous single-stone capture)
 * - Forbid suicide (situational rule — legal if the move captures opponent stones)
 * - End the game after two consecutive passes (transitions to `scoring` phase)
 * - Finalize the score once dead stones are marked
 *
 * The engine is deterministic and synchronous; all UI / AI interaction happens
 * via the surrounding store.
 */

import type {
  Board,
  BoardSize,
  CaptureCounts,
  GameStatus,
  GoEngineJSON,
  GoEngineOptions,
  Intersection,
  Move,
  MoveResult,
  Point,
  ScoreBreakdown,
  Stone,
} from './types';
import {
  cloneBoard,
  getGroup,
  getLiberties,
  getNeighbors,
  pointEquals,
  pointKey,
} from '../utils/groupUtils';
import { SCORING_RULES, type ScoringRules } from '../config/scoringRules';
import { scoreGame } from './scoring';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** Full board snapshot for undo. */
interface Snapshot {
  board: Board;
  turn: Stone;
  koPoint: Point | null;
  passCount: number;
  captured: CaptureCounts;
  status: GameStatus;
  winner: Stone | 'draw' | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an empty square board of the given size.
 *
 * @param size - Edge length.
 * @returns A fresh `size × size` board filled with `null`.
 */
function emptyBoard(size: BoardSize): Board {
  const board: Board = [];
  for (let y = 0; y < size; y++) {
    board.push(new Array<Intersection>(size).fill(null));
  }
  return board;
}

/** Opposite stone color. */
function opposite(color: Stone): Stone {
  return color === 'b' ? 'w' : 'b';
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Go game engine — maintains state, enforces rules, and exposes the public
 * API consumed by the surrounding Zustand store and UI.
 */
export class GoEngine {
  /** Board dimension (9 or 19). */
  public readonly boardSize: BoardSize;

  /** Komi compensation awarded to White at scoring time. */
  public komi: number;

  /** Scoring ruleset selected for this game. */
  public scoringRules: ScoringRules;

  /** Current board state. */
  public board: Board;

  /** Color whose turn it is to play. */
  public turn: Stone;

  /** Complete ordered list of moves played so far. */
  public moveHistory: Move[];

  /** Counts of opponent stones captured BY each color (i.e. prisoners held). */
  public captured: CaptureCounts;

  /** Forbidden point this turn due to simple ko, or `null`. */
  public koPoint: Point | null;

  /** Consecutive pass counter (resets on any `play`). */
  public passCount: number;

  /** Lifecycle status. */
  public status: GameStatus;

  /** Game winner (set on resignation or scoring). */
  public winner: Stone | 'draw' | null;

  /** Initial handicap stones (retained so `reset()` restores them). */
  private readonly handicapStones: Point[];

  /** Stack of snapshots used to implement `undoMove`. */
  private readonly history: Snapshot[];

  /**
   * Create a fresh engine.
   *
   * @param options - Board size, handicap stones, komi, and scoring rules.
   */
  constructor(options: GoEngineOptions) {
    this.boardSize = options.boardSize;
    this.scoringRules = options.scoringRules ?? 'chinese';
    this.komi = options.komi ?? SCORING_RULES[this.scoringRules].defaultKomi;
    this.handicapStones = (options.handicapStones ?? []).map((p) => ({ ...p }));
    this.board = emptyBoard(this.boardSize);
    this.turn = 'b';
    this.moveHistory = [];
    this.captured = { black: 0, white: 0 };
    this.koPoint = null;
    this.passCount = 0;
    this.status = 'idle';
    this.winner = null;
    this.history = [];

    this.applyHandicap();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Attempt to play a stone at `point` for the side to move.
   *
   * Rejected when the point is out of bounds, occupied, the ko point, or a
   * suicide move. On success the board is updated, captures are recorded,
   * the ko point is updated (set only for exact single-stone captures),
   * turn switches, and the move is appended to history.
   *
   * @param point - Target intersection.
   * @returns A `MoveResult` describing success/failure and captured stones.
   */
  public playMove(point: Point): MoveResult {
    if (this.status === 'ended' || this.status === 'scoring') {
      return { success: false, captured: [], reason: 'gameEnded' };
    }
    if (!this.inBounds(point)) {
      return { success: false, captured: [], reason: 'outOfBounds' };
    }
    if (this.board[point.y][point.x] !== null) {
      return { success: false, captured: [], reason: 'occupied' };
    }
    if (this.koPoint && pointEquals(this.koPoint, point)) {
      return { success: false, captured: [], reason: 'ko' };
    }

    // Simulate on a clone so we can reject suicide without side effects.
    const color = this.turn;
    const board = cloneBoard(this.board);
    board[point.y][point.x] = color;

    // Capture any adjacent opponent groups that lose their last liberty.
    const opp = opposite(color);
    const captured: Point[] = [];
    const alreadyChecked = new Set<string>();
    for (const n of getNeighbors(point, this.boardSize)) {
      if (board[n.y][n.x] !== opp) continue;
      const key = pointKey(n);
      if (alreadyChecked.has(key)) continue;
      const group = getGroup(board, n);
      for (const g of group) alreadyChecked.add(pointKey(g));
      if (getLiberties(board, group).length === 0) {
        for (const g of group) {
          board[g.y][g.x] = null;
          captured.push(g);
        }
      }
    }

    // Suicide check — after captures, must have at least one liberty.
    const ownGroup = getGroup(board, point);
    if (getLiberties(board, ownGroup).length === 0) {
      return { success: false, captured: [], reason: 'suicide' };
    }

    // Commit snapshot BEFORE mutation so undo can roll back.
    this.pushSnapshot();

    // Commit the new board and state.
    this.board = board;

    // Ko detection: set koPoint only for a clean single-stone capture
    // where the placing stone is itself a single stone with exactly one liberty
    // (the captured point). Otherwise no ko.
    if (
      captured.length === 1 &&
      ownGroup.length === 1 &&
      getLiberties(board, ownGroup).length === 1
    ) {
      this.koPoint = captured[0];
    } else {
      this.koPoint = null;
    }

    // Update prisoner counts (captures credited to the mover).
    if (color === 'b') this.captured.black += captured.length;
    else this.captured.white += captured.length;

    // History + turn switch + reset pass counter.
    this.moveHistory.push({ kind: 'play', point: { ...point }, color });
    this.turn = opp;
    this.passCount = 0;

    // Transition idle → playing on the first move.
    if (this.status === 'idle') this.status = 'playing';

    return { success: true, captured };
  }

  /**
   * Pass the current turn.
   *
   * Two consecutive passes transition the game into the `scoring` phase;
   * the caller is then responsible for marking dead stones and calling
   * `finalizeScore`.
   *
   * @returns A `MoveResult` — always successful unless the game has ended.
   */
  public pass(): MoveResult {
    if (this.status === 'ended' || this.status === 'scoring') {
      return { success: false, captured: [], reason: 'gameEnded' };
    }
    this.pushSnapshot();
    const color = this.turn;
    this.moveHistory.push({ kind: 'pass', color });
    this.passCount += 1;
    this.turn = opposite(color);
    this.koPoint = null;
    if (this.status === 'idle') this.status = 'playing';
    if (this.passCount >= 2) this.status = 'scoring';
    return { success: true, captured: [] };
  }

  /**
   * Resign the game for the given color (defaults to the side to move).
   *
   * Immediately ends the game and sets the opponent as the winner.
   *
   * @param color - Resigning color; defaults to `this.turn`.
   */
  public resign(color: Stone = this.turn): void {
    if (this.status === 'ended') return;
    this.pushSnapshot();
    this.moveHistory.push({ kind: 'resign', color });
    this.status = 'ended';
    this.winner = opposite(color);
  }

  /**
   * Undo the most recent move, restoring the previous snapshot.
   *
   * Returns `false` if there is nothing to undo.
   *
   * @returns Whether an undo was performed.
   */
  public undoMove(): boolean {
    const snap = this.history.pop();
    if (!snap) return false;
    this.board = snap.board;
    this.turn = snap.turn;
    this.koPoint = snap.koPoint;
    this.passCount = snap.passCount;
    this.captured = { ...snap.captured };
    this.status = snap.status;
    this.winner = snap.winner;
    this.moveHistory.pop();
    return true;
  }

  /**
   * Compute the set of legal `play` moves for the current turn.
   *
   * Excludes the current ko point and any suicide placements. Passing is
   * always legal separately.
   *
   * @returns Points that can be legally played this turn.
   */
  public getLegalMoves(): Point[] {
    if (this.status === 'ended' || this.status === 'scoring') return [];
    const moves: Point[] = [];
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const p = { x, y };
        if (this.isLegal(p)) moves.push(p);
      }
    }
    return moves;
  }

  /**
   * Check whether placing a stone at `point` is legal for the current turn.
   *
   * Implements the same validation as `playMove` without mutating state.
   *
   * @param point - Candidate point.
   * @returns True if the move would succeed.
   */
  public isLegal(point: Point): boolean {
    if (this.status === 'ended' || this.status === 'scoring') return false;
    if (!this.inBounds(point)) return false;
    if (this.board[point.y][point.x] !== null) return false;
    if (this.koPoint && pointEquals(this.koPoint, point)) return false;

    // Simulate placement + captures on a clone.
    const color = this.turn;
    const board = cloneBoard(this.board);
    board[point.y][point.x] = color;

    const opp = opposite(color);
    const alreadyChecked = new Set<string>();
    for (const n of getNeighbors(point, this.boardSize)) {
      if (board[n.y][n.x] !== opp) continue;
      const key = pointKey(n);
      if (alreadyChecked.has(key)) continue;
      const group = getGroup(board, n);
      for (const g of group) alreadyChecked.add(pointKey(g));
      if (getLiberties(board, group).length === 0) {
        for (const g of group) board[g.y][g.x] = null;
      }
    }

    const ownGroup = getGroup(board, point);
    return getLiberties(board, ownGroup).length > 0;
  }

  /**
   * Finalize the score after two passes and transition to `ended`.
   *
   * Must be called from the `scoring` status. Sets `winner` and returns the
   * full breakdown.
   *
   * @param deadStones - Points marked as dead by the players.
   * @returns Full `ScoreBreakdown`.
   */
  public finalizeScore(deadStones: Point[] = []): ScoreBreakdown {
    const breakdown = scoreGame(
      this.board,
      this.scoringRules,
      this.komi,
      deadStones,
      { black: this.captured.black, white: this.captured.white },
    );
    this.status = 'ended';
    this.winner = breakdown.winner;
    return breakdown;
  }

  /**
   * Preview the score without changing status or winner.
   *
   * Useful for a live estimate during play (assistance overlay).
   *
   * @param deadStones - Points treated as dead.
   * @returns Full `ScoreBreakdown`.
   */
  public previewScore(deadStones: Point[] = []): ScoreBreakdown {
    return scoreGame(
      this.board,
      this.scoringRules,
      this.komi,
      deadStones,
      { black: this.captured.black, white: this.captured.white },
    );
  }

  /**
   * Serialize the engine state to a JSON-safe object.
   *
   * @returns A snapshot suitable for `JSON.stringify`.
   */
  public toJSON(): GoEngineJSON {
    return {
      boardSize: this.boardSize,
      board: cloneBoard(this.board),
      turn: this.turn,
      moveHistory: this.moveHistory.map((m) =>
        m.kind === 'play'
          ? { kind: 'play', point: { ...m.point }, color: m.color }
          : { ...m },
      ),
      captured: { ...this.captured },
      koPoint: this.koPoint ? { ...this.koPoint } : null,
      passCount: this.passCount,
      status: this.status,
      winner: this.winner,
      komi: this.komi,
      scoringRules: this.scoringRules,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Place handicap stones (no turn switch — white still moves first). */
  private applyHandicap(): void {
    if (this.handicapStones.length === 0) return;
    for (const p of this.handicapStones) {
      if (this.inBounds(p)) this.board[p.y][p.x] = 'b';
    }
    // In standard handicap rules, White moves first after placement.
    this.turn = 'w';
  }

  /** Capture current state for undo. */
  private pushSnapshot(): void {
    this.history.push({
      board: cloneBoard(this.board),
      turn: this.turn,
      koPoint: this.koPoint ? { ...this.koPoint } : null,
      passCount: this.passCount,
      captured: { ...this.captured },
      status: this.status,
      winner: this.winner,
    });
  }

  /** True if `point` lies on the board. */
  private inBounds(point: Point): boolean {
    return (
      point.x >= 0 &&
      point.x < this.boardSize &&
      point.y >= 0 &&
      point.y < this.boardSize
    );
  }
}
