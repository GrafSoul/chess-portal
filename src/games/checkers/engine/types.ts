/**
 * Type definitions for the Checkers (Russian Draughts) game engine.
 *
 * Russian draughts rules:
 * - 8x8 board, pieces on dark squares only
 * - Men move forward diagonally 1 square
 * - Men capture forward AND backward
 * - Kings ("damki") move any number of squares diagonally (like a bishop)
 * - Kings capture at any distance, landing any empty square beyond the victim
 * - Captures are mandatory (forced capture rule)
 * - Multi-jump chains must be completed
 * - Captured pieces are removed AFTER the chain completes
 * - A man promoted mid-chain continues capturing as a king
 */

/** Algebraic square notation: 'a1' to 'h8' */
export type Square = string;

/** Piece color — white plays from the bottom (rows 0–2) */
export type PieceColor = 'w' | 'b';

/** Piece type — man or king (crowned) */
export type PieceType = 'man' | 'king';

/** A piece on the board (public representation) */
export interface CheckersPiece {
  color: PieceColor;
  type: PieceType;
  square: Square;
}

/** Result returned by CheckersEngine.makeMove() */
export interface MoveResult {
  /** Whether the move was legal and executed */
  success: boolean;
  /** Squares of pieces captured in this step */
  captured: Square[];
  /** Whether the moving piece was crowned on this step */
  crowned: boolean;
  /** Whether the player must continue capturing (multi-jump chain) */
  chainContinues: boolean;
}

/** Recorded move for history / notation display */
export interface CheckersMove {
  /** Starting square of the move (or chain) */
  from: Square;
  /** Final landing square */
  to: Square;
  /** All captured pieces in this turn */
  captured: Square[];
  /** Whether a piece was crowned */
  crowned: boolean;
}

/** Game lifecycle status */
export type GameStatus = 'idle' | 'playing' | 'won' | 'draw';

/** Game mode — AI opponent or local hot-seat */
export type GameMode = 'ai' | 'local';

/** AI difficulty levels */
export type AILevel = 'easy' | 'medium' | 'hard' | 'expert';

/** Internal cell representation on the board grid */
export interface Cell {
  color: PieceColor;
  king: boolean;
}
