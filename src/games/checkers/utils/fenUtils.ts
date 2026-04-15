import type { Square } from '../engine/types';

/**
 * Parse a checkers FEN board string into an 8x8 grid.
 * Empty squares are '.'. Row 0 = rank 8 (top of board in FEN).
 *
 * @param boardPart The board portion of the FEN (ranks separated by '/')
 * @returns 8x8 grid of characters
 */
export function parseFenBoard(boardPart: string): string[][] {
  const rows = boardPart.split('/');
  return rows.map((row) => {
    const arr: string[] = [];
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        const n = Number(ch);
        for (let i = 0; i < n; i++) arr.push('.');
      } else {
        arr.push(ch);
      }
    }
    while (arr.length < 8) arr.push('.');
    return arr.slice(0, 8);
  });
}

/**
 * Serialize an 8x8 board grid back into a FEN board portion.
 *
 * @param board 8x8 grid of characters ('.' = empty)
 * @returns FEN board string
 */
function serializeFenBoard(board: string[][]): string {
  return board
    .map((row) => {
      let out = '';
      let empty = 0;
      for (const ch of row) {
        if (ch === '.') {
          empty++;
        } else {
          if (empty > 0) {
            out += String(empty);
            empty = 0;
          }
          out += ch;
        }
      }
      if (empty > 0) out += String(empty);
      return out;
    })
    .join('/');
}

/**
 * Convert an algebraic square to [row, col] where row 0 = rank 8 (top of FEN).
 *
 * @param square Algebraic notation (e.g. 'e4')
 * @returns [row, col] index pair
 */
function squareToRowCol(square: Square): [number, number] {
  const col = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  const row = 8 - rank;
  return [row, col];
}

/**
 * Get the piece info at a given square in a FEN string.
 *
 * @param fen Source FEN string
 * @param square Algebraic square notation
 * @returns Piece info ({ color, type }) or null if the square is empty
 */
export function getPieceAt(
  fen: string,
  square: Square,
): { color: 'w' | 'b'; type: 'man' | 'king' } | null {
  const boardPart = fen.split(' ')[0] ?? '';
  const board = parseFenBoard(boardPart);
  const [r, c] = squareToRowCol(square);
  const ch = board[r]?.[c];
  if (!ch || ch === '.') return null;
  return {
    color: ch === 'w' || ch === 'W' ? 'w' : 'b',
    type: ch === 'W' || ch === 'B' ? 'king' : 'man',
  };
}

/**
 * Options for applying a tutorial move to a checkers FEN.
 */
export interface CheckersMoveOptions {
  /** Squares of captured pieces to remove from the board */
  captures?: Square[];
  /** Whether the arriving piece should be crowned (man -> king) */
  crown?: boolean;
}

/**
 * Remove pieces at given squares from a FEN string.
 * Used to animate captures after the jumping piece has landed.
 *
 * @param fen Source FEN string
 * @param squares Squares whose pieces should be removed
 * @returns Updated FEN string
 */
export function removePiecesFromFen(fen: string, squares: Square[]): string {
  if (squares.length === 0) return fen;
  const parts = fen.split(' ');
  if (parts.length < 2) return fen;
  const board = parseFenBoard(parts[0]);
  for (const sq of squares) {
    const [r, c] = squareToRowCol(sq);
    if (board[r]) board[r][c] = '.';
  }
  return `${serializeFenBoard(board)} ${parts[1]}`;
}

/**
 * Apply a move to a checkers FEN string WITHOUT legality checking.
 *
 * Used only by the tutorial system. Moves the piece from origin to
 * destination, optionally removes captured pieces, optionally crowns
 * the piece, and toggles the side to move.
 *
 * @param fen Source FEN string (boardPart + ' ' + turn)
 * @param from Origin square
 * @param to Destination square
 * @param options Optional captures and crowning
 * @returns New FEN string with the move applied
 */
export function applyCheckersMoveToFen(
  fen: string,
  from: Square,
  to: Square,
  options: CheckersMoveOptions = {},
): string {
  const parts = fen.split(' ');
  if (parts.length < 2) return fen;
  const board = parseFenBoard(parts[0]);

  const [fr, fc] = squareToRowCol(from);
  const [tr, tc] = squareToRowCol(to);

  const piece = board[fr]?.[fc];
  if (!piece || piece === '.') return fen;

  // Move piece
  board[fr][fc] = '.';

  // Crown if requested
  if (options.crown) {
    board[tr][tc] = piece === 'w' ? 'W' : piece === 'b' ? 'B' : piece;
  } else {
    board[tr][tc] = piece;
  }

  // Remove captured pieces
  if (options.captures) {
    for (const sq of options.captures) {
      const [cr, cc] = squareToRowCol(sq);
      if (board[cr]) board[cr][cc] = '.';
    }
  }

  const newBoard = serializeFenBoard(board);
  const newTurn = parts[1] === 'w' ? 'b' : 'w';
  return `${newBoard} ${newTurn}`;
}
