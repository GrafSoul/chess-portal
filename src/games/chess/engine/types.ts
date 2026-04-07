/** Chess square identifier (e.g. 'a1', 'e4', 'h8') */
export type Square = string;

/** Piece types in chess.js format */
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/** Piece color */
export type PieceColor = 'w' | 'b';

/** A piece on the board */
export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

/** Promotion piece options (no king or pawn) */
export type PromotionPiece = 'n' | 'b' | 'r' | 'q';

/** A move with full context */
export interface ChessMove {
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PromotionPiece;
  flags: string;
  san: string;
  lan: string;
  before: string;
  after: string;
}

/** A captured piece with ordering info */
export interface CapturedPiece {
  type: PieceType;
  color: PieceColor;
  index: number;
}

/** Game status */
export type GameStatus =
  | 'idle'
  | 'playing'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'timeout';

/** Game mode */
export type GameMode = 'ai' | 'local';

/** AI difficulty levels */
export type AILevel = 'easy' | 'medium' | 'hard' | 'expert';

/** Clock preset configuration */
export interface ClockPreset {
  label: string;
  timeMs: number;
  incrementMs: number;
}

/** AI level configuration */
export interface AILevelConfig {
  label: string;
  depth: number;
  skillLevel: number;
  moveTimeMs: number;
}
