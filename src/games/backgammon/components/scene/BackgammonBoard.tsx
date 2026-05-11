/**
 * Static 3D board for Long Backgammon — realistic folding wooden design.
 *
 * Faithfully modeled after a real folding backgammon board:
 * - Green felt table surface underneath.
 * - Wooden base slab.
 * - Inner playing field (lighter golden wood).
 * - WIDE side borders (left/right) — same width as center fold strip.
 * - THIN long rails (front/back) with semicircular scallop cutouts.
 * - Low center divider strip (fold/hinge line).
 * - 24 inlaid triangular points extending from rails toward center.
 * - Two bear-off tray slots on the right side.
 *
 * @example
 * ```tsx
 * <BackgammonBoard />
 * ```
 */

import { memo, useMemo } from 'react';
import * as THREE from 'three';
import {
  BOARD_WIDTH,
  BOARD_DEPTH,
  BOARD_HEIGHT,
  BOARD_SURFACE_Y,
  BOTTOM_ROW_POINTS,
  TOP_ROW_POINTS,
  POINT_LAYOUTS,
  BEAR_OFF_X,
  BEAR_OFF_WHITE_Z,
  BEAR_OFF_BLACK_Z,
} from './boardLayout';
import { BackgammonPoint } from './BackgammonPoint';

// ---------------------------------------------------------------------------
// Color palette — warm natural wood
// ---------------------------------------------------------------------------

/** Outer frame / border color (walnut). */
const FRAME_COLOR = '#7A5A30';

/** Playing field surface (warm golden wood, lighter than frame). */
const FIELD_COLOR = '#B89860';

/** Center fold-line divider (same wood as frame). */
const DIVIDER_COLOR = '#6B4C28';

/** Table felt (classic green). */
const TABLE_COLOR = '#2D5A27';


// ---------------------------------------------------------------------------
// Board structure dimensions
// ---------------------------------------------------------------------------

/**
 * WIDE side border width (left/right rails).
 * On a real board these equal the center fold strip — all three are the same thick wood.
 * The fold IS the long side of the closed board.
 */
const SIDE_BORDER_WIDTH = 1.2;

/**
 * Long rail depth (front/back rails where scallops are).
 * Must be thicker than SCALLOP_RADIUS to leave material around the notches.
 */
const LONG_RAIL_DEPTH = 0.6;

/** Border frame height above the playing surface. */
const FRAME_RISE = 0.16;

/** Center divider height — LOW, flush with field (fold/hinge line). */
const DIVIDER_RISE = 0.04;

/** Scallop semicircle radius — sized to fit a stone (STONE_RADIUS ≈ 0.45). */
const SCALLOP_RADIUS = 0.42;

/**
 * Visual width of the center divider strip.
 * Wider than the layout gap (CENTER_DIVIDER_WIDTH=0.6) to match
 * the wide side borders as on a real folding board.
 */
const VISUAL_DIVIDER_WIDTH = 1.0;

/** Tray slot dimensions. */
const TRAY_SLOT_WIDTH = 0.6;
const TRAY_SLOT_DEPTH = 3.0;
const TRAY_SLOT_HEIGHT = 0.06;

/** Table surface (larger than board). */
const TABLE_WIDTH = BOARD_WIDTH + 12;
const TABLE_DEPTH = BOARD_DEPTH + 10;

/** Outer board dimensions (playing area + borders). */
const OUTER_W = BOARD_WIDTH + 2 * SIDE_BORDER_WIDTH;
const OUTER_D = BOARD_DEPTH + 2 * LONG_RAIL_DEPTH;

// ---------------------------------------------------------------------------
// Scalloped rail geometry
// ---------------------------------------------------------------------------

/**
 * Creates a long rail with semicircular scallop cutouts on the inner edge.
 *
 * The shape is built in XY plane:
 * - X = rail length direction
 * - Y = rail depth (0 = outer edge, railDepth = inner edge)
 * - Scallops are semicircular indentations on the inner edge
 *
 * Extruded along Z for rail height, then rotated to stand upright.
 *
 * @param railWidth - Total length of the rail (X).
 * @param railDepth - Depth/thickness of the rail (becomes Z in world).
 * @param railHeight - Height of the rail (becomes Y in world).
 * @param scallopXPositions - X positions of each scallop center.
 * @param scallopR - Scallop semicircle radius.
 * @returns ExtrudeGeometry for the scalloped rail.
 */
function createScallopedRailGeometry(
  railWidth: number,
  railDepth: number,
  railHeight: number,
  scallopXPositions: number[],
  scallopR: number,
): THREE.ExtrudeGeometry {
  const halfW = railWidth / 2;
  const shape = new THREE.Shape();

  // Start at outer edge, left corner
  shape.moveTo(-halfW, 0);

  // Up to inner edge, left corner
  shape.lineTo(-halfW, railDepth);

  // Walk along inner edge (left to right) with scallop notches
  const sorted = [...scallopXPositions].sort((a, b) => a - b);

  for (const sx of sorted) {
    // Line to start of this scallop
    shape.lineTo(sx - scallopR, railDepth);

    // Semicircular notch: arc from left to right, dipping toward outer edge
    // Center at (sx, railDepth), radius R
    // From π (left) counterclockwise through 3π/2 (bottom) to 2π (right)
    shape.absarc(sx, railDepth, scallopR, Math.PI, 2 * Math.PI, false);
  }

  // Finish inner edge to right corner
  shape.lineTo(halfW, railDepth);

  // Down to outer edge, right corner
  shape.lineTo(halfW, 0);

  // Close path (outer edge back to start)
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: railHeight,
    bevelEnabled: false,
  });

  // Rotate so extrusion (Z) becomes upward (Y), and depth (Y) becomes Z
  geo.rotateX(-Math.PI / 2);

  return geo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Realistic folding backgammon board.
 *
 * Side borders are wide (matching the center fold strip).
 * Front/back rails are thin with scalloped inner edges.
 * Center divider sits lower than the outer frame.
 *
 * @returns A Three.js group containing all board geometry.
 */
export const BackgammonBoard = memo(function BackgammonBoard() {
  const frameH = BOARD_HEIGHT + FRAME_RISE;
  const dividerH = BOARD_HEIGHT + DIVIDER_RISE;

  // ── Collect scallop X positions from point layouts ────────────────────
  const scallopXPositions = useMemo(() => {
    return BOTTOM_ROW_POINTS.map((pi) => POINT_LAYOUTS[pi].basePosition.x);
  }, []);

  // ── Table surface (green felt) ────────────────────────────────────────
  const tableGeo = useMemo(
    () => new THREE.BoxGeometry(TABLE_WIDTH, 0.08, TABLE_DEPTH), [],
  );
  const tableMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: TABLE_COLOR, roughness: 0.92 }), [],
  );

  // ── Base slab (only covers the playing field, not under side rails) ───
  const slabGeo = useMemo(
    () => new THREE.BoxGeometry(BOARD_WIDTH, BOARD_HEIGHT, OUTER_D), [],
  );
  const slabMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FRAME_COLOR, roughness: 0.6, metalness: 0.05 }), [],
  );

  // ── Playing field (lighter wood) ──────────────────────────────────────
  const fieldGeo = useMemo(
    () => new THREE.BoxGeometry(BOARD_WIDTH, 0.02, BOARD_DEPTH), [],
  );
  const fieldMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FIELD_COLOR, roughness: 0.5, metalness: 0.02 }), [],
  );

  // ── Scalloped front/back rails (THIN, with cutouts) ───────────────────
  const scallopedRailGeo = useMemo(
    () => createScallopedRailGeometry(
      OUTER_W, LONG_RAIL_DEPTH, frameH, scallopXPositions, SCALLOP_RADIUS,
    ), [scallopXPositions],
  );
  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FRAME_COLOR, roughness: 0.55, metalness: 0.05 }), [],
  );

  // ── Wide side rails (left/right) ─────────────────────────────────────
  const sideRailGeo = useMemo(
    () => new THREE.BoxGeometry(SIDE_BORDER_WIDTH, frameH, OUTER_D), [],
  );

  // ── Center divider (fold line — LOW) ──────────────────────────────────
  const dividerGeo = useMemo(
    () => new THREE.BoxGeometry(VISUAL_DIVIDER_WIDTH, dividerH, OUTER_D - LONG_RAIL_DEPTH * 2), [],
  );
  const dividerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: DIVIDER_COLOR, roughness: 0.55, metalness: 0.05 }), [],
  );

  // ── Tray slots ────────────────────────────────────────────────────────
  const trayGeo = useMemo(
    () => new THREE.BoxGeometry(TRAY_SLOT_WIDTH, TRAY_SLOT_HEIGHT, TRAY_SLOT_DEPTH), [],
  );
  const trayMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: DIVIDER_COLOR, roughness: 0.8 }), [],
  );

  // ── Y positions ──────────────────────────────────────────────────────
  const railY = frameH / 2 - BOARD_HEIGHT / 2;
  const dividerY = dividerH / 2 - BOARD_HEIGHT / 2;
  const railBaseY = -BOARD_HEIGHT / 2;

  return (
    <group>
      {/* ── Green felt table ─────────────────────────────────────── */}
      <mesh geometry={tableGeo} material={tableMat}
        position={[0, -BOARD_HEIGHT / 2 - 0.04, 0]} receiveShadow />

      {/* ── Base wooden slab ─────────────────────────────────────── */}
      <mesh geometry={slabGeo} material={slabMat}
        position={[0, 0, 0]} receiveShadow castShadow />

      {/* ── Playing field (lighter wood, raised above slab top to avoid z-fighting) */}
      <mesh geometry={fieldGeo} material={fieldMat}
        position={[0, BOARD_SURFACE_Y + 0.02, 0]} receiveShadow />

      {/* ── Front rail (+Z) — thin, scalloped ────────────────────── */}
      <mesh geometry={scallopedRailGeo} material={frameMat}
        position={[0, railBaseY, OUTER_D / 2]} castShadow />

      {/* ── Back rail (-Z) — thin, scalloped, rotated 180° ───────── */}
      <mesh geometry={scallopedRailGeo} material={frameMat}
        position={[0, railBaseY, -OUTER_D / 2]}
        rotation={[0, Math.PI, 0]} castShadow />

      {/* ── Left side rail (-X) — WIDE ───────────────────────────── */}
      <mesh geometry={sideRailGeo} material={frameMat}
        position={[-OUTER_W / 2 + SIDE_BORDER_WIDTH / 2, railY, 0]} castShadow />

      {/* ── Right side rail (+X) — WIDE ──────────────────────────── */}
      <mesh geometry={sideRailGeo} material={frameMat}
        position={[OUTER_W / 2 - SIDE_BORDER_WIDTH / 2, railY, 0]} castShadow />

      {/* ── Center divider (fold line — LOW) ──────────────────────── */}
      <mesh geometry={dividerGeo} material={dividerMat}
        position={[0, dividerY, 0]} castShadow />

      {/* ── Bear-off tray slots ───────────────────────────────────── */}
      <mesh geometry={trayGeo} material={trayMat}
        position={[BEAR_OFF_X, BOARD_SURFACE_Y + TRAY_SLOT_HEIGHT / 2, BEAR_OFF_WHITE_Z]}
        receiveShadow />
      <mesh geometry={trayGeo} material={trayMat}
        position={[BEAR_OFF_X, BOARD_SURFACE_Y + TRAY_SLOT_HEIGHT / 2, BEAR_OFF_BLACK_Z]}
        receiveShadow />

      {/* ── Triangular inlaid points — bottom row ────────────────── */}
      {BOTTOM_ROW_POINTS.map((pointIndex, colIndex) => {
        const x = POINT_LAYOUTS[pointIndex].basePosition.x;
        return (
          <BackgammonPoint
            key={`point-bottom-${pointIndex}`}
            position={[x, BOARD_SURFACE_Y, BOARD_DEPTH / 2]}
            isBottomRow={true}
            shade={colIndex % 2 === 0 ? 'light' : 'dark'}
            colIndex={colIndex}
          />
        );
      })}

      {/* ── Triangular inlaid points — top row ───────────────────── */}
      {TOP_ROW_POINTS.map((pointIndex, colIndex) => {
        const x = POINT_LAYOUTS[pointIndex].basePosition.x;
        return (
          <BackgammonPoint
            key={`point-top-${pointIndex}`}
            position={[x, BOARD_SURFACE_Y, -BOARD_DEPTH / 2]}
            isBottomRow={false}
            shade={colIndex % 2 === 0 ? 'light' : 'dark'}
            colIndex={colIndex}
          />
        );
      })}
    </group>
  );
});
