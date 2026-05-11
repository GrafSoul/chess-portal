/**
 * Shared 3D layout constants and geometry helpers for the Backgammon scene.
 *
 * All world positions use Three.js convention: X = right, Y = up, Z = toward camera.
 * The board lies on the XZ plane centered at the origin.
 *
 * ## Coordinate system
 *
 * The 24 points are indexed 0-23 following the engine's coordinate system:
 *
 * ```
 * Visual layout (top row):      12 11 10  9  8  7  |  6  5  4  3  2  1
 * Visual layout (bottom row):   13 14 15 16 17 18  | 19 20 21 22 23  0
 * ```
 *
 * - Points 0-11 are on the **right half** of the board.
 * - Points 12-23 are on the **left half**.
 * - Top row (12-1): triangles point **downward** (tips toward center).
 * - Bottom row (13-0): triangles point **upward** (tips toward center).
 *
 * ## Stone stacking
 *
 * Stones are laid flat along each triangle (Z axis), from the rail toward
 * the center — like on a real backgammon board.
 *
 * - Bottom row: first stone near +Z rail, subsequent stones at decreasing Z.
 * - Top row: first stone near -Z rail, subsequent stones at increasing Z.
 */

import { Vector3 } from 'three';
import type { PointIndex } from '../../engine/types';

// ---------------------------------------------------------------------------
// Board geometry
// ---------------------------------------------------------------------------

/** Total world width of the board (X axis). */
export const BOARD_WIDTH = 14;

/** Total world depth of the board (Z axis). Fold is the long side. */
export const BOARD_DEPTH = 14;

/** Height of the wooden board slab. */
export const BOARD_HEIGHT = 0.15;

/** Width of each triangular point column. */
export const POINT_WIDTH = 1.1;

/** Length of each triangular point (from base to tip). Fills most of the half-depth. */
export const POINT_HEIGHT = 5.5;

/** Width of the center divider strip. */
export const CENTER_DIVIDER_WIDTH = 0.6;

/** Number of points per side of the board (6 points per quadrant × 2 quadrants). */
const POINTS_PER_ROW = 12;

/** Half-spacing to shift columns so they're centered within the field. */
const FIELD_HALF_STEP = POINT_WIDTH / 2;

/** Width of each half of the playing field (between side border and center divider). */
const HALF_FIELD_WIDTH = (BOARD_WIDTH - CENTER_DIVIDER_WIDTH) / 2;

/** Margin on each side of a 6-column group to center it within its half. */
const GROUP_MARGIN = (HALF_FIELD_WIDTH - 6 * POINT_WIDTH) / 2;

/** Y level of the board surface (top face of the slab). */
export const BOARD_SURFACE_Y = BOARD_HEIGHT / 2;

/** Y position of the base of each triangle geometry (sits on board surface). */
export const POINT_BASE_Y = BOARD_SURFACE_Y;

// ---------------------------------------------------------------------------
// Stone geometry
// ---------------------------------------------------------------------------

/** Radius of each stone cylinder in world units. */
export const STONE_RADIUS = 0.45;

/** Height (thickness) of each stone cylinder. */
export const STONE_HEIGHT = 0.25;

/**
 * Maximum stones to render individually before showing a count label.
 * When `count > POINT_MAX_VISIBLE`, render `POINT_MAX_VISIBLE - 1` stones
 * plus an HTML overlay showing the total.
 */
export const POINT_MAX_VISIBLE = 15;

// ---------------------------------------------------------------------------
// Bear-off tray geometry
// ---------------------------------------------------------------------------

/** World X position of the bear-off tray (right side of the board). */
export const BEAR_OFF_X = BOARD_WIDTH / 2 + 0.9;

/** Z offset for white vs black tray (white near, black far). */
export const BEAR_OFF_WHITE_Z = BOARD_DEPTH / 4;

/** Z offset for the black bear-off tray. */
export const BEAR_OFF_BLACK_Z = -BOARD_DEPTH / 4;

/** Radius of borne-off "puck" cylinders (flat stones in tray). */
export const BEAR_OFF_STONE_RADIUS = 0.3;

/** Height of borne-off puck cylinders. */
export const BEAR_OFF_STONE_HEIGHT = 0.08;

// ---------------------------------------------------------------------------
// Point position map
// ---------------------------------------------------------------------------

/**
 * Describes the 3D anchor point and stone stacking direction for one board point.
 *
 * `basePosition` is the world position where the **first** stone sits — near the
 * triangle base (by the rail). Subsequent stones spread along Z toward the center.
 */
export interface PointLayout {
  /** World position of the first stone in the stack (near the rail). */
  basePosition: Vector3;
  /**
   * Z-axis direction in which subsequent stones in the stack are offset.
   * Bottom row: -1 (stones spread from +Z rail toward center).
   * Top row: +1 (stones spread from -Z rail toward center).
   */
  stackDirection: 1 | -1;
  /**
   * Whether the triangle tip points toward +Z (bottom row = true)
   * or -Z (top row = false). Used by `BackgammonPoint` to set rotation.
   */
  isBottomRow: boolean;
}

/**
 * Compute the world X position for a point column.
 *
 * Points are laid out left-to-right in each quadrant (6 per quadrant, 2 quadrants
 * per row). The center divider separates the two quadrants.
 *
 * @param colIndex - Column index within the row (0 = leftmost, 11 = rightmost).
 * @returns World X coordinate for that column's center.
 */
function columnX(colIndex: number): number {
  // Each row has 12 points split into 2 groups of 6.
  // Left group: cols 0-5; right group: cols 6-11.
  // Each group is centered within its half of the playing field.
  const group = colIndex < 6 ? 0 : 1;
  const localIndex = colIndex % 6;

  const groupStartX = group === 0
    ? -(BOARD_WIDTH / 2) + GROUP_MARGIN
    : CENTER_DIVIDER_WIDTH / 2 + GROUP_MARGIN;

  return groupStartX + localIndex * POINT_WIDTH + FIELD_HALF_STEP;
}

/**
 * Pre-computed layout map for all 24 board points.
 *
 * Indexed by `PointIndex` (0..23). Each entry gives the world base position
 * (where the first stone sits, near the rail) and the Z stacking direction.
 *
 * Point-to-column mapping follows the visual board layout:
 * - Bottom row, left to right: points 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0
 *   → column indices                    0   1   2   3   4   5   6   7   8   9  10  11
 * - Top row, left to right:   points 12, 11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1
 *   → column indices                    0   1   2   3   4   5   6   7   8   9  10  11
 *
 * @type {Record<PointIndex, PointLayout>}
 */
export const POINT_LAYOUTS: Record<PointIndex, PointLayout> = (() => {
  const layouts: Record<PointIndex, PointLayout> = {};

  /**
   * Stone base Y — sits on top of the raised playing field.
   * Field top = BOARD_SURFACE_Y + 0.02 (field offset) + 0.01 (half field height) = 0.105.
   * Stone center Y = field_top + STONE_HEIGHT / 2.
   */
  const stoneBaseY = BOARD_SURFACE_Y + 0.02 + 0.01 + STONE_HEIGHT / 2;

  // Bottom row: indices [13..23, 0] mapped to column indices [0..11]
  // First stone sits near the +Z rail (triangle base), inset by STONE_RADIUS.
  const bottomPoints: PointIndex[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
  const bottomBaseZ = BOARD_DEPTH / 2 - STONE_RADIUS; // near +Z rail

  bottomPoints.forEach((pointIndex, colIndex) => {
    layouts[pointIndex] = {
      basePosition: new Vector3(columnX(colIndex), stoneBaseY, bottomBaseZ),
      stackDirection: -1, // spread toward center (-Z)
      isBottomRow: true,
    };
  });

  // Top row: indices [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] mapped to columns [0..11]
  // First stone sits near the -Z rail (triangle base), inset by STONE_RADIUS.
  const topPoints: PointIndex[] = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const topBaseZ = -BOARD_DEPTH / 2 + STONE_RADIUS; // near -Z rail

  topPoints.forEach((pointIndex, colIndex) => {
    layouts[pointIndex] = {
      basePosition: new Vector3(columnX(colIndex), stoneBaseY, topBaseZ),
      stackDirection: 1, // spread toward center (+Z)
      isBottomRow: false,
    };
  });

  return layouts;
})();

/**
 * Default spacing between stone centers along Z.
 * Equal to stone diameter so stones touch but don't overlap.
 */
export const STONE_SPACING = STONE_RADIUS * 2;

/**
 * Compute the Z spacing for stones on a given point.
 *
 * Stones spread from the rail toward the center. When many stones are present
 * they may cross the center divider onto the opposite half — this is normal
 * on a real backgammon board. The full board depth is available for spreading.
 *
 * @param visibleCount - Number of stones that will be rendered.
 * @returns Z spacing between stone centers.
 */
export function stoneSpacing(visibleCount: number): number {
  if (visibleCount <= 1) return STONE_SPACING;
  // Allow stones to spread across the full board depth (rail to opposite rail).
  const maxSpread = BOARD_DEPTH - STONE_RADIUS * 2;
  const idealSpacing = STONE_SPACING;
  const needed = (visibleCount - 1) * idealSpacing;
  return needed <= maxSpread ? idealSpacing : maxSpread / (visibleCount - 1);
}

/**
 * Get the world position for stone `i` in a stack on a given point.
 *
 * Stones are laid flat along the triangle (Z axis), from the rail toward
 * the center — matching real backgammon stone placement.
 *
 * @param pointIndex   - The board point index (0..23).
 * @param stackIndex   - 0-based index within the stack (0 = nearest to rail).
 * @param totalVisible - Total number of visible stones (for adaptive spacing).
 * @returns A new `Vector3` for the stone's center position.
 *
 * @example
 * ```ts
 * const pos = stonePosition(23, 0, 6); // first white stone on white head
 * ```
 */
export function stonePosition(
  pointIndex: PointIndex,
  stackIndex: number,
  totalVisible: number = 1,
): Vector3 {
  const layout = POINT_LAYOUTS[pointIndex];
  if (!layout) {
    return new Vector3(0, BOARD_SURFACE_Y + STONE_HEIGHT / 2, 0);
  }
  const spacing = stoneSpacing(totalVisible);
  return new Vector3(
    layout.basePosition.x,
    layout.basePosition.y,
    layout.basePosition.z + layout.stackDirection * stackIndex * spacing,
  );
}

/**
 * Returns the world X position for a column within a 12-point row.
 * Exported for use by `BackgammonPoint` when placing triangle geometries.
 *
 * @param colIndex - 0-based column index (0..11).
 * @returns World X coordinate.
 */
export function pointColumnX(colIndex: number): number {
  return columnX(colIndex);
}

/**
 * The column index (0..11) of each bottom-row point index in the same order
 * as `POINT_LAYOUTS` bottom row. Used by `BackgammonBoard` to render points.
 *
 * Bottom row visual order left→right: 13 14 15 16 17 18 | 19 20 21 22 23 0
 */
export const BOTTOM_ROW_POINTS: PointIndex[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];

/**
 * The column index (0..11) of each top-row point index.
 * Top row visual order left→right: 12 11 10 9 8 7 | 6 5 4 3 2 1
 */
export const TOP_ROW_POINTS: PointIndex[] = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

/** All 24 point indices in order (convenience for rendering all StoneStacks). */
export const ALL_POINTS: PointIndex[] = Array.from({ length: 24 }, (_, i) => i);

/** Number of bottom-row points that visually map to each column (6 per group). */
export const POINTS_PER_GROUP = 6;

/** World Z position of the bottom row's triangle base edge (at the +Z rail). */
export const BOTTOM_ROW_Z = BOARD_DEPTH / 2;

/** World Z position of the top row's triangle base edge (at the -Z rail). */
export const TOP_ROW_Z = -BOARD_DEPTH / 2;

/** Total points count in one row. */
export const TOTAL_ROW_POINTS = POINTS_PER_ROW;
