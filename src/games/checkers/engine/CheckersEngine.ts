import type {
  Cell,
  CheckersMove,
  CheckersPiece,
  GameStatus,
  MoveResult,
  PieceColor,
  Square,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Four diagonal directions as [deltaRow, deltaCol] */
const DIAGONALS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Initial board FEN (rank 8 → rank 1, then active color) */
const INITIAL_FEN =
  'b1b1b1b1/1b1b1b1b/b1b1b1b1/8/8/1w1w1w1w/w1w1w1w1/1w1w1w1w w';

/** Draw after this many consecutive moves without a capture */
const DRAW_MOVE_LIMIT = 80;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** Landing option for a capture move */
interface CaptureOption {
  /** Landing row */
  lr: number;
  /** Landing col */
  lc: number;
  /** Captured piece row */
  cr: number;
  /** Captured piece col */
  cc: number;
}

/** Full board snapshot for undo */
interface Snapshot {
  board: (Cell | null)[][];
  turn: PieceColor;
  movesWithoutCapture: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clone an 8x8 board array (deep copy) */
function cloneBoard(board: (Cell | null)[][]): (Cell | null)[][] {
  return board.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null)),
  );
}

/** Convert algebraic square to [row, col] */
function toRC(sq: Square): [number, number] {
  return [parseInt(sq[1], 10) - 1, sq.charCodeAt(0) - 97];
}

/** Convert [row, col] to algebraic square */
function toSq(r: number, c: number): Square {
  return String.fromCharCode(97 + c) + (r + 1);
}

/** Check if row/col is within 0..7 */
function inBounds(r: number, c: number): boolean {
  return r >= 0 && r <= 7 && c >= 0 && c <= 7;
}

/** Key for a row/col pair (used in Set lookups) */
function rcKey(r: number, c: number): string {
  return `${r},${c}`;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Stateful Russian Draughts engine.
 *
 * Encapsulates all game rules: legal-move generation, forced captures,
 * multi-jump chains, king promotion, undo, and win/draw detection.
 *
 * No React or UI dependencies — pure TypeScript.
 */
export class CheckersEngine {
  /** 8x8 grid, row 0 = rank 1 (white's home side) */
  private board: (Cell | null)[][] = [];

  /** Whose turn it is */
  private _turn: PieceColor = 'w';

  /** Snapshots for undo (one per complete turn, not per chain step) */
  private snapshots: Snapshot[] = [];

  /** Completed move records */
  private _moveHistory: CheckersMove[] = [];

  // -- Chain state (multi-jump) --

  /** Row/col of the piece mid-chain, or null */
  private _chainRC: [number, number] | null = null;

  /** Squares captured during the current chain (removed when chain ends) */
  private _chainCaptured: Set<string> = new Set();

  /** Origin square of the chain (for move history) */
  private _chainOrigin: Square | null = null;

  /** Whether the piece was crowned during this chain */
  private _chainCrowned = false;

  // -- Draw tracking --

  /** Consecutive half-moves without a capture */
  private _movesWithoutCapture = 0;

  // =========================================================================
  // Constructor
  // =========================================================================

  constructor(fen?: string) {
    this.loadFen(fen ?? INITIAL_FEN);
  }

  // =========================================================================
  // Public getters
  // =========================================================================

  /** Current side to move */
  get turn(): PieceColor {
    return this._turn;
  }

  /** Serialised board position */
  get fen(): string {
    return this.toFen();
  }

  /** All pieces currently on the board */
  get pieces(): CheckersPiece[] {
    const result: CheckersPiece[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (cell) {
          result.push({
            color: cell.color,
            type: cell.king ? 'king' : 'man',
            square: toSq(r, c),
          });
        }
      }
    }
    return result;
  }

  /** Whether a multi-jump chain is in progress */
  get isChainActive(): boolean {
    return this._chainRC !== null;
  }

  /** The square of the piece currently mid-chain, or null */
  get chainPiece(): Square | null {
    return this._chainRC ? toSq(this._chainRC[0], this._chainRC[1]) : null;
  }

  /** Move history (one entry per complete turn) */
  get moveHistory(): CheckersMove[] {
    return this._moveHistory;
  }

  /** Game status */
  get status(): GameStatus {
    if (this._movesWithoutCapture >= DRAW_MOVE_LIMIT) return 'draw';
    if (this.isGameOver()) return 'won';
    if (this._moveHistory.length === 0 && !this.isChainActive) return 'idle';
    return 'playing';
  }

  /** Winner color, or null if no winner yet */
  get winner(): PieceColor | null {
    if (this.status !== 'won') return null;
    // The player who can't move loses → winner is the OTHER player
    // When status is 'won', it's the current player's turn and they have no moves
    return this._turn === 'w' ? 'b' : 'w';
  }

  // =========================================================================
  // Public actions
  // =========================================================================

  /** Load position from a FEN string */
  loadFen(fen: string): void {
    const [boardPart, turnPart] = fen.trim().split(/\s+/);
    this._turn = turnPart === 'b' ? 'b' : 'w';
    this.board = this.parseFenBoard(boardPart);
    this.clearChain();
    this.snapshots = [];
    this._moveHistory = [];
    this._movesWithoutCapture = 0;
  }

  /** Reset to the initial starting position */
  reset(): void {
    this.loadFen(INITIAL_FEN);
  }

  /**
   * Get squares of all pieces that have legal moves this turn.
   *
   * Respects forced capture: if any piece can capture, only those pieces
   * are returned. During a chain, only the chain piece is returned.
   */
  getMovablePieces(): Square[] {
    if (this.isChainActive) {
      const [r, c] = this._chainRC!;
      return this.findCaptures(r, c).length > 0 ? [toSq(r, c)] : [];
    }

    const capturePieces: Square[] = [];
    const movePieces: Square[] = [];

    for (const [r, c] of this.piecesOf(this._turn)) {
      if (this.findCaptures(r, c).length > 0) {
        capturePieces.push(toSq(r, c));
      } else if (this.findSimpleMoves(r, c).length > 0) {
        movePieces.push(toSq(r, c));
      }
    }

    // Forced capture: if any captures exist, ONLY capture moves are legal
    return capturePieces.length > 0 ? capturePieces : movePieces;
  }

  /**
   * Get legal destination squares for a specific piece.
   *
   * During a forced-capture turn, only capture destinations are returned.
   * During a chain, only the chain piece's captures are valid.
   */
  getLegalMoves(square: Square): Square[] {
    const [r, c] = toRC(square);
    const cell = this.board[r][c];
    if (!cell || cell.color !== this._turn) return [];

    // During a chain, only the chain piece can move
    if (this.isChainActive) {
      const [cr, cc] = this._chainRC!;
      if (r !== cr || c !== cc) return [];
      return this.findCaptures(r, c).map((o) => toSq(o.lr, o.lc));
    }

    // Check if forced capture applies globally
    const hasAnyCapture = this.hasCaptures(this._turn);

    if (hasAnyCapture) {
      // Only capture moves allowed
      return this.findCaptures(r, c).map((o) => toSq(o.lr, o.lc));
    }

    return this.findSimpleMoves(r, c).map(([mr, mc]) => toSq(mr, mc));
  }

  /**
   * Execute a move from one square to another.
   *
   * Returns a MoveResult indicating success, captures, crowning, and
   * whether the chain continues. If `chainContinues` is true, the same
   * player must call `makeMove` again for the chain piece.
   */
  makeMove(from: Square, to: Square): MoveResult {
    const fail: MoveResult = {
      success: false,
      captured: [],
      crowned: false,
      chainContinues: false,
    };

    const [fr, fc] = toRC(from);
    const [tr, tc] = toRC(to);
    const cell = this.board[fr][fc];
    if (!cell || cell.color !== this._turn) return fail;

    // Validate the move is in the legal set
    const legalDests = this.getLegalMoves(from);
    if (!legalDests.includes(to)) return fail;

    // Determine if this is a capture or a simple move
    const captures = this.findCaptures(fr, fc);
    const captureOption = captures.find((o) => o.lr === tr && o.lc === tc);

    // -----------------------------------------------------------------------
    // Save snapshot at the start of a NEW turn (not mid-chain)
    // -----------------------------------------------------------------------
    if (!this.isChainActive) {
      this.snapshots.push(this.takeSnapshot());
      this._chainOrigin = from;
      this._chainCrowned = false;
    }

    const stepCaptured: Square[] = [];

    if (captureOption) {
      // -- CAPTURE MOVE --
      // Move the piece
      this.board[tr][tc] = cell;
      this.board[fr][fc] = null;

      // Mark the captured piece (don't remove yet — Russian rules)
      const capturedSq = toSq(captureOption.cr, captureOption.cc);
      this._chainCaptured.add(rcKey(captureOption.cr, captureOption.cc));
      stepCaptured.push(capturedSq);

      // Check promotion (man reaches back rank)
      let crowned = false;
      if (!cell.king) {
        const promoRank = cell.color === 'w' ? 7 : 0;
        if (tr === promoRank) {
          cell.king = true;
          crowned = true;
          this._chainCrowned = true;
        }
      }

      // Check if chain continues (more captures from the landing square)
      const nextCaptures = this.findCaptures(tr, tc);
      if (nextCaptures.length > 0) {
        this._chainRC = [tr, tc];
        return {
          success: true,
          captured: stepCaptured,
          crowned,
          chainContinues: true,
        };
      }

      // Chain ended — remove all captured pieces from the board
      this.finishChain();

      return {
        success: true,
        captured: stepCaptured,
        crowned,
        chainContinues: false,
      };
    }

    // -- SIMPLE (NON-CAPTURE) MOVE --
    this.board[tr][tc] = cell;
    this.board[fr][fc] = null;

    // Check promotion
    let crowned = false;
    if (!cell.king) {
      const promoRank = cell.color === 'w' ? 7 : 0;
      if (tr === promoRank) {
        cell.king = true;
        crowned = true;
      }
    }

    // Record history and switch turn
    this._moveHistory.push({
      from,
      to,
      captured: [],
      crowned,
    });
    this._movesWithoutCapture++;
    this._turn = this._turn === 'w' ? 'b' : 'w';

    return {
      success: true,
      captured: [],
      crowned,
      chainContinues: false,
    };
  }

  /**
   * Undo the last complete turn (including all chain jumps).
   * Returns the undone move, or null if there's nothing to undo.
   */
  undoMove(): CheckersMove | null {
    if (this.snapshots.length === 0) return null;
    const snapshot = this.snapshots.pop()!;
    const move = this._moveHistory.pop() ?? null;
    this.board = snapshot.board;
    this._turn = snapshot.turn;
    this._movesWithoutCapture = snapshot.movesWithoutCapture;
    this.clearChain();
    return move;
  }

  // =========================================================================
  // FEN serialization
  // =========================================================================

  /** Serialize the current board to a FEN string */
  private toFen(): string {
    const rows: string[] = [];
    // FEN goes from rank 8 (row 7) down to rank 1 (row 0)
    for (let r = 7; r >= 0; r--) {
      let row = '';
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (!cell) {
          empty++;
        } else {
          if (empty > 0) {
            row += empty;
            empty = 0;
          }
          if (cell.color === 'w') {
            row += cell.king ? 'W' : 'w';
          } else {
            row += cell.king ? 'B' : 'b';
          }
        }
      }
      if (empty > 0) row += empty;
      rows.push(row);
    }
    return rows.join('/') + ' ' + this._turn;
  }

  /** Parse a FEN board string into the 8x8 grid */
  private parseFenBoard(boardStr: string): (Cell | null)[][] {
    const grid: (Cell | null)[][] = Array.from({ length: 8 }, () =>
      Array(8).fill(null) as (Cell | null)[],
    );
    const ranks = boardStr.split('/');
    for (let i = 0; i < ranks.length; i++) {
      const r = 7 - i; // rank index: first rank in FEN is rank 8 (row 7)
      let c = 0;
      for (const ch of ranks[i]) {
        if (ch >= '1' && ch <= '8') {
          c += parseInt(ch, 10);
        } else {
          const color: PieceColor = ch === ch.toLowerCase() ? ch as PieceColor : (ch.toLowerCase() as PieceColor);
          const king = ch === ch.toUpperCase();
          // Validate color character
          if (color === 'w' || color === 'b') {
            grid[r][c] = { color, king };
          }
          c++;
        }
      }
    }
    return grid;
  }

  // =========================================================================
  // Move generation — simple moves (non-capture)
  // =========================================================================

  /**
   * Find simple (non-capture) destinations for a piece at (r, c).
   * Returns [row, col] pairs.
   */
  private findSimpleMoves(r: number, c: number): [number, number][] {
    const cell = this.board[r][c];
    if (!cell) return [];

    const moves: [number, number][] = [];

    if (cell.king) {
      // King slides any distance diagonally
      for (const [dr, dc] of DIAGONALS) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc) && !this.board[nr][nc]) {
          moves.push([nr, nc]);
          nr += dr;
          nc += dc;
        }
      }
    } else {
      // Man moves forward diagonally 1 square
      const forward = cell.color === 'w' ? 1 : -1;
      for (const dc of [-1, 1]) {
        const nr = r + forward;
        const nc = c + dc;
        if (inBounds(nr, nc) && !this.board[nr][nc]) {
          moves.push([nr, nc]);
        }
      }
    }

    return moves;
  }

  // =========================================================================
  // Move generation — captures
  // =========================================================================

  /**
   * Find capture options for a piece at (r, c).
   *
   * Each CaptureOption describes one possible jump: the landing square
   * and the square of the piece being captured.
   *
   * Respects the chain state: pieces already captured in the current chain
   * cannot be jumped again, but they still physically occupy the board
   * (blocking movement).
   */
  private findCaptures(r: number, c: number): CaptureOption[] {
    const cell = this.board[r][c];
    if (!cell) return [];

    const options: CaptureOption[] = [];
    const opponent = cell.color === 'w' ? 'b' : 'w';

    if (cell.king) {
      // King captures at any distance: scan each diagonal for the first
      // opponent piece, then collect all empty landing squares beyond it.
      for (const [dr, dc] of DIAGONALS) {
        let nr = r + dr;
        let nc = c + dc;

        // Scan for the first piece on this diagonal
        while (inBounds(nr, nc)) {
          const target = this.board[nr][nc];
          if (target) {
            // Found a piece — is it an opponent that hasn't been captured yet?
            if (
              target.color === opponent &&
              !this._chainCaptured.has(rcKey(nr, nc))
            ) {
              const cr = nr;
              const cc = nc;
              // Collect all empty squares beyond the captured piece
              let lr = cr + dr;
              let lc = cc + dc;
              while (inBounds(lr, lc)) {
                const landing = this.board[lr][lc];
                if (landing) {
                  // Blocked by another piece (including chain-captured ones)
                  // But allow landing back on the origin square (king can
                  // return through its starting position in a chain)
                  if (lr === r && lc === c) {
                    options.push({ lr, lc, cr, cc });
                  }
                  break;
                }
                options.push({ lr, lc, cr, cc });
                lr += dr;
                lc += dc;
              }
            }
            // Blocked by any piece — stop scanning this diagonal
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    } else {
      // Man captures diagonally (forward AND backward in Russian draughts)
      for (const [dr, dc] of DIAGONALS) {
        const mr = r + dr; // middle (captured piece)
        const mc = c + dc;
        const lr = r + 2 * dr; // landing
        const lc = c + 2 * dc;

        if (!inBounds(lr, lc)) continue;
        const middle = this.board[mr][mc];
        const landing = this.board[lr][lc];

        if (
          middle &&
          middle.color === opponent &&
          !this._chainCaptured.has(rcKey(mr, mc)) &&
          !landing
        ) {
          options.push({ lr, lc, cr: mr, cc: mc });
        }
      }
    }

    return options;
  }

  /**
   * Check if any piece of the given color has at least one capture available.
   */
  private hasCaptures(color: PieceColor): boolean {
    for (const [r, c] of this.piecesOf(color)) {
      if (this.findCaptures(r, c).length > 0) return true;
    }
    return false;
  }

  // =========================================================================
  // Chain management
  // =========================================================================

  /**
   * Finish a multi-jump chain: remove all captured pieces from the board,
   * record the move in history, reset chain state, and switch the turn.
   */
  private finishChain(): void {
    const allCaptured: Square[] = [];

    // Remove captured pieces from the board
    for (const key of this._chainCaptured) {
      const [cr, cc] = key.split(',').map(Number);
      allCaptured.push(toSq(cr, cc));
      this.board[cr][cc] = null;
    }

    // Record the complete move
    const landing = this._chainRC
      ? toSq(this._chainRC[0], this._chainRC[1])
      : this._chainOrigin!;
    this._moveHistory.push({
      from: this._chainOrigin!,
      to: landing,
      captured: allCaptured,
      crowned: this._chainCrowned,
    });

    // Update draw counter
    if (allCaptured.length > 0) {
      this._movesWithoutCapture = 0;
    } else {
      this._movesWithoutCapture++;
    }

    // Switch turn and clear chain
    this._turn = this._turn === 'w' ? 'b' : 'w';
    this.clearChain();
  }

  /** Reset all chain-related state */
  private clearChain(): void {
    this._chainRC = null;
    this._chainCaptured.clear();
    this._chainOrigin = null;
    this._chainCrowned = false;
  }

  // =========================================================================
  // Win / draw detection
  // =========================================================================

  /**
   * Check if the game is over: the current player has no pieces or no
   * legal moves available.
   */
  private isGameOver(): boolean {
    // No chain should be active when checking game-over
    if (this.isChainActive) return false;
    return this.getMovablePieces().length === 0;
  }

  // =========================================================================
  // Utility helpers
  // =========================================================================

  /** Get [row, col] of all pieces of a given color */
  private piecesOf(color: PieceColor): [number, number][] {
    const result: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (cell && cell.color === color) {
          result.push([r, c]);
        }
      }
    }
    return result;
  }

  /** Create a deep snapshot of the current state (for undo) */
  private takeSnapshot(): Snapshot {
    return {
      board: cloneBoard(this.board),
      turn: this._turn,
      movesWithoutCapture: this._movesWithoutCapture,
    };
  }
}
