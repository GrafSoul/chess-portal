import { Chess, type Square as ChessJsSquare } from 'chess.js';
import type {
  Square,
  ChessMove,
  ChessPiece,
  PieceType,
  PromotionPiece,
  GameStatus,
} from './types';

/** Result of attempting a move */
interface MoveResult {
  success: boolean;
  move: ChessMove | null;
  captured: ChessPiece | null;
}

/**
 * Facade over chess.js — all game logic without UI dependencies.
 * Pure TypeScript, no React.
 */
export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    this.game = fen ? new Chess(fen) : new Chess();
  }

  /** Current board position as FEN string */
  get fen(): string {
    return this.game.fen();
  }

  /** Whose turn it is */
  get turn(): 'w' | 'b' {
    return this.game.turn();
  }

  /** Whether the current side is in check */
  get isCheck(): boolean {
    return this.game.isCheck();
  }

  /** Full move history with details */
  get moveHistory(): ChessMove[] {
    return this.game.history({ verbose: true }) as ChessMove[];
  }

  /** Number of half-moves played */
  get moveCount(): number {
    return this.game.history().length;
  }

  /** PGN string of the game */
  get pgn(): string {
    return this.game.pgn();
  }

  /** Get piece at a specific square, or null */
  getPiece(square: Square): ChessPiece | null {
    return this.game.get(square as ChessJsSquare) ?? null;
  }

  /** Get all legal moves for a specific square */
  getLegalMoves(square: Square): Square[] {
    const moves = this.game.moves({ square: square as ChessJsSquare, verbose: true });
    return moves.map((m) => m.to);
  }

  /** Get all legal moves in the current position */
  getAllLegalMoves(): ChessMove[] {
    return this.game.moves({ verbose: true }) as ChessMove[];
  }

  /** Check if a move from->to requires pawn promotion */
  isPromotion(from: Square, to: Square): boolean {
    const piece = this.game.get(from as ChessJsSquare);
    if (!piece || piece.type !== 'p') return false;
    const rank = to[1];
    return (piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1');
  }

  /**
   * Attempt to make a move.
   * Returns success status and move details.
   */
  makeMove(from: Square, to: Square, promotion?: PromotionPiece): MoveResult {
    try {
      const result = this.game.move({ from, to, promotion: promotion ?? 'q' });
      if (!result) {
        return { success: false, move: null, captured: null };
      }

      const move = result as unknown as ChessMove;
      const captured: ChessPiece | null = move.captured
        ? { type: move.captured as PieceType, color: move.color === 'w' ? 'b' : 'w' }
        : null;

      return { success: true, move, captured };
    } catch {
      return { success: false, move: null, captured: null };
    }
  }

  /** Undo the last move. Returns the undone move or null. */
  undoMove(): ChessMove | null {
    const result = this.game.undo();
    return (result as unknown as ChessMove) ?? null;
  }

  /** Determine current game status */
  getStatus(): GameStatus {
    if (this.game.isCheckmate()) return 'checkmate';
    if (this.game.isStalemate()) return 'stalemate';
    if (this.game.isDraw()) return 'draw';
    if (this.game.isGameOver()) return 'draw';
    if (this.moveCount === 0) return 'idle';
    return 'playing';
  }

  /** Get the winner color, or null if no winner */
  getWinner(): 'w' | 'b' | null {
    if (!this.game.isCheckmate()) return null;
    // The side whose turn it is has been checkmated — opponent wins
    return this.turn === 'w' ? 'b' : 'w';
  }

  /** Reset to initial position or a specific FEN */
  reset(fen?: string): void {
    if (fen) {
      this.game.load(fen);
    } else {
      this.game.reset();
    }
  }

  /** Get all pieces currently on the board */
  getBoard(): (ChessPiece | null)[][] {
    return this.game.board();
  }

  /** Validate a FEN string */
  static validateFen(fen: string): boolean {
    try {
      new Chess(fen);
      return true;
    } catch {
      return false;
    }
  }
}
