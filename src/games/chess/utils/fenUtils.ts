import type { Square } from '../engine/types';

/**
 * Convert an algebraic square (e.g. 'e4') to a [row, col] index pair where
 * row 0 is the top of the board (rank 8) and col 0 is file 'a'.
 */
function squareToRowCol(square: Square): [number, number] {
  const col = square.charCodeAt(0) - 97; // 'a' → 0
  const rank = Number(square[1]);
  const row = 8 - rank; // rank 8 → row 0
  return [row, col];
}

/**
 * Parse the board portion of a FEN string into a 8×8 grid of characters.
 * Empty squares are represented as '.'.
 */
export function parseFenBoard(boardPart: string): string[][] {
  const rows = boardPart.split('/');
  return rows.map((row) => {
    const arr: string[] = [];
    for (const ch of row) {
      if (ch >= '0' && ch <= '9') {
        const n = Number(ch);
        for (let i = 0; i < n; i++) arr.push('.');
      } else {
        arr.push(ch);
      }
    }
    // Pad or truncate to exactly 8 (defensive against malformed input)
    while (arr.length < 8) arr.push('.');
    return arr.slice(0, 8);
  });
}

/**
 * Serialize an 8×8 board grid back into a FEN board portion.
 * Runs of empty squares are compressed into digits.
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
 * Apply a move directly to a FEN string WITHOUT any legality checking.
 *
 * This is a deliberately loose utility used ONLY by the tutorial system to
 * show piece movement on positions that may not even be legal chess (e.g. a
 * lone piece on an empty board). It performs a simple piece swap, clears the
 * origin square, toggles the side-to-move, and leaves other FEN fields intact.
 *
 * If the destination already has a piece, it is captured (overwritten).
 * If the origin square is empty, the original FEN is returned unchanged.
 *
 * NOTE: This does NOT handle special moves (castling, en passant, promotion).
 * Castling must be demonstrated via two explicit moves (king + rook) in the
 * tutorial chapter data.
 *
 * @param fen Source FEN string
 * @param from Origin square (e.g. 'e2')
 * @param to Destination square (e.g. 'e4')
 * @returns New FEN string with the move applied
 */
export function applyMoveToFen(fen: string, from: Square, to: Square): string {
  const parts = fen.split(' ');
  if (parts.length < 2) return fen;
  const board = parseFenBoard(parts[0]);

  const [fr, fc] = squareToRowCol(from);
  const [tr, tc] = squareToRowCol(to);

  const piece = board[fr]?.[fc];
  if (!piece || piece === '.') return fen;

  board[fr][fc] = '.';
  board[tr][tc] = piece;

  const newBoard = serializeFenBoard(board);
  const newTurn = parts[1] === 'w' ? 'b' : 'w';
  // Keep castling/en-passant/halfmove/fullmove fields as-is
  return [newBoard, newTurn, ...parts.slice(2)].join(' ');
}

/**
 * Reset the active color in a FEN to white-to-move (used when restarting a
 * demo loop so pawns move in the expected direction).
 */
export function withWhiteToMove(fen: string): string {
  const parts = fen.split(' ');
  if (parts.length < 2) return fen;
  parts[1] = 'w';
  return parts.join(' ');
}
