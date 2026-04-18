/**
 * Compact board notation for Go tutorial positions.
 *
 * Format: rows separated by `/`, each cell is `.` (empty), `b` (black),
 * or `w` (white). Rows are listed top-to-bottom (y=0 first).
 *
 * A digit N repeats the preceding character N times (run-length encoding):
 * `b3` = `b...` (b followed by 3 empties).
 * A standalone digit means that many empties: `9` = `.........`.
 *
 * @example
 * ```ts
 * // Empty 9x9 board
 * parseGoBoard('9/9/9/9/9/9/9/9/9');
 *
 * // Single black stone at center (e5 on 9x9 = x:4, y:4)
 * parseGoBoard('9/9/9/9/4b4/9/9/9/9');
 * ```
 *
 * @module
 */

import type { Board, Intersection } from '../engine/types';

/**
 * Parse a compact Go board notation string into a 2D Board array.
 *
 * @param notation - Compact notation string (rows separated by `/`).
 * @returns Board matrix (row-major, `board[y][x]`).
 *
 * @example
 * ```ts
 * const board = parseGoBoard('9/9/9/9/4b4/9/9/9/9');
 * // board[4][4] === 'b'
 * ```
 */
export function parseGoBoard(notation: string): Board {
  const rows = notation.split('/');
  const board: Board = [];

  for (const rowStr of rows) {
    const row: Intersection[] = [];
    let i = 0;
    while (i < rowStr.length) {
      const ch = rowStr[i];
      if (ch === 'b' || ch === 'w') {
        // Check if followed by a digit (repeat count for empty after stone)
        row.push(ch);
        i++;
      } else if (ch === '.') {
        row.push(null);
        i++;
      } else if (ch >= '0' && ch <= '9') {
        // Collect full number
        let numStr = '';
        while (i < rowStr.length && rowStr[i] >= '0' && rowStr[i] <= '9') {
          numStr += rowStr[i];
          i++;
        }
        const count = parseInt(numStr, 10);
        for (let j = 0; j < count; j++) {
          row.push(null);
        }
      } else {
        i++;
      }
    }
    board.push(row);
  }

  return board;
}

/**
 * Create an empty Go board of the given size.
 *
 * All intersections are `null` (no stone placed). Used as the initial state
 * for the tutorial store and as the loop reset position.
 *
 * @param size - Board dimension. Typically `9` (tutorial) or `19` (full game).
 * @returns Square board matrix filled with `null`. Dimensions: `size × size`.
 *
 * @example
 * ```ts
 * const board = emptyBoard(9);
 * // board.length === 9, board[0].length === 9
 * // board[4][4] === null
 * ```
 */
export function emptyBoard(size: number): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
}
