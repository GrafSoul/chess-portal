/**
 * Board constants for Long Backgammon (Длинные нарды).
 *
 * Both colors travel counter-clockwise around the same 24-point ring.
 * Points are indexed 0..23 in absolute board coordinates.
 *
 * Board layout (viewed from above, conventional orientation):
 * ```
 *   12  11  10   9   8   7        6   5   4   3   2   1
 * +--------------------+        +--------------------+
 * | BLACK head (11)    |        |  WHITE home 0..5   |
 * |                    |        |                    |
 * +--------------------+        +--------------------+
 *   13  14  15  16  17  18       19  20  21  22  23   0
 *                                             WHITE head (23)
 * ```
 *
 * White path  : 23 → 22 → 21 → … → 1 → 0 → 'off'
 *   - Head    : point 23
 *   - Home    : points 0..5 (WHITE_HOME_END..WHITE_HOME_START)
 *
 * Black path  : 11 → 10 → … → 1 → 0 → 23 → … → 13 → 12 → 'off'
 *   - Head    : point 11
 *   - Home    : points 12..17 (BLACK_HOME_START..BLACK_HOME_END)
 */

/** Total number of points on the board ring. */
export const BOARD_POINTS = 24;

/** Number of stones each side starts with. */
export const STONES_PER_SIDE = 15;

/**
 * White's starting point (голова белых).
 * All 15 white stones begin here; white moves toward lower indices and wraps
 * off at point 0.
 */
export const WHITE_HEAD = 23;

/**
 * Black's starting point (голова чёрных).
 * All 15 black stones begin here; black moves toward lower indices, wraps
 * around 0 → 23, and bears off at point 12.
 */
export const BLACK_HEAD = 11;

/**
 * The lowest-indexed (first) point of White's home quadrant.
 * White's home spans points `WHITE_HOME_END` (0) to `WHITE_HOME_START` (5).
 *
 * A stone is in White's home when `point >= WHITE_HOME_END && point <= WHITE_HOME_START`.
 */
export const WHITE_HOME_END = 0;

/**
 * The highest-indexed (last, farthest from exit) point of White's home quadrant.
 * In White's path direction, point 5 is the farthest point from the exit
 * and point 0 is the closest.
 */
export const WHITE_HOME_START = 5;

/**
 * The lowest-indexed (closest to exit) point of Black's home quadrant.
 * Black bears off starting from point 12.
 */
export const BLACK_HOME_START = 12;

/**
 * The highest-indexed (farthest from exit) point of Black's home quadrant.
 * Black's home spans `BLACK_HOME_START` (12) to `BLACK_HOME_END` (17).
 */
export const BLACK_HOME_END = 17;

/**
 * The 24-point path White travels, from head (index 0 in path) to the last
 * home point (index 23 in path).
 *
 * `WHITE_PATH[pathPosition]` gives the board point index.
 * `pathPosition = 0`  → point 23 (head)
 * `pathPosition = 23` → point 0  (closest to exit)
 * Moving `pips` steps forward from `pathPosition p` lands on `p + pips`;
 * if `p + pips >= 24` the stone is borne off.
 */
export const WHITE_PATH: readonly number[] = [
  23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12,
  11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1,  0,
] as const;

/**
 * The 24-point path Black travels, from head (index 0 in path) to the last
 * home point (index 23 in path).
 *
 * `BLACK_PATH[pathPosition]` gives the board point index.
 * `pathPosition = 0`  → point 11 (head)
 * `pathPosition = 23` → point 12 (closest to exit)
 * Moving `pips` steps forward from `pathPosition p` lands on `p + pips`;
 * if `p + pips >= 24` the stone is borne off.
 */
export const BLACK_PATH: readonly number[] = [
  11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1,  0,
  23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12,
] as const;

/**
 * Inverse lookup: given a board point index, returns White's path position (0..23).
 * Computed once from `WHITE_PATH` for O(1) access.
 */
export const WHITE_PATH_POSITION: readonly number[] = (() => {
  const arr = new Array<number>(BOARD_POINTS);
  WHITE_PATH.forEach((boardPoint, pathPos) => {
    arr[boardPoint] = pathPos;
  });
  return arr;
})();

/**
 * Inverse lookup: given a board point index, returns Black's path position (0..23).
 * Computed once from `BLACK_PATH` for O(1) access.
 */
export const BLACK_PATH_POSITION: readonly number[] = (() => {
  const arr = new Array<number>(BOARD_POINTS);
  BLACK_PATH.forEach((boardPoint, pathPos) => {
    arr[boardPoint] = pathPos;
  });
  return arr;
})();
