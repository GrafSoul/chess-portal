/**
 * Group and board utilities for Go.
 *
 * A "group" is a maximal set of same-color stones connected orthogonally
 * (4-directionally). "Liberties" of a group are the empty intersections
 * orthogonally adjacent to any stone in the group.
 */

import type { Board, Intersection, Point } from '../engine/types';

/**
 * Return the 4-directional neighbors of a point that lie within the board.
 *
 * @param point - Point to query.
 * @param size - Board edge length.
 * @returns In-bounds neighbor points (up to 4).
 */
export function getNeighbors(point: Point, size: number): Point[] {
  const { x, y } = point;
  const result: Point[] = [];
  if (x > 0) result.push({ x: x - 1, y });
  if (x < size - 1) result.push({ x: x + 1, y });
  if (y > 0) result.push({ x, y: y - 1 });
  if (y < size - 1) result.push({ x, y: y + 1 });
  return result;
}

/**
 * Flood-fill the connected same-color group containing `point`.
 *
 * Returns an empty array if `point` is empty on the board.
 *
 * @param board - Current board.
 * @param point - Starting point (must be a stone).
 * @returns All points in the group (including the starting point).
 */
export function getGroup(board: Board, point: Point): Point[] {
  const size = board.length;
  const color = board[point.y]?.[point.x];
  if (!color) return [];

  const seen = new Set<string>();
  const group: Point[] = [];
  const stack: Point[] = [point];

  while (stack.length > 0) {
    // Non-null: stack is non-empty in the loop condition.
    const current = stack.pop() as Point;
    const key = pointKey(current);
    if (seen.has(key)) continue;
    seen.add(key);

    if (board[current.y][current.x] !== color) continue;
    group.push(current);

    for (const neighbor of getNeighbors(current, size)) {
      if (!seen.has(pointKey(neighbor))) {
        stack.push(neighbor);
      }
    }
  }

  return group;
}

/**
 * Count the unique empty liberties of a group.
 *
 * @param board - Current board.
 * @param group - Points forming a connected group.
 * @returns Unique empty neighbor points adjacent to any stone in the group.
 */
export function getLiberties(board: Board, group: Point[]): Point[] {
  const size = board.length;
  const libs = new Map<string, Point>();
  for (const stone of group) {
    for (const n of getNeighbors(stone, size)) {
      if (board[n.y][n.x] === null) {
        libs.set(pointKey(n), n);
      }
    }
  }
  return Array.from(libs.values());
}

/**
 * Deep-clone a board.
 *
 * Each row is copied so mutations on the clone do not affect the source.
 *
 * @param board - Source board.
 * @returns An independent copy.
 */
export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice() as Intersection[]);
}

/**
 * Value-equality for points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns True when both coordinates match.
 */
export function pointEquals(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Canonical string key for a point, suitable for Set / Map lookups.
 *
 * @param p - Point to encode.
 * @returns `"x,y"` string.
 */
export function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}
