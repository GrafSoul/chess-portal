/**
 * A single inlaid triangular point (пункт) on the Backgammon board.
 *
 * Renders a flat, thin, elongated triangle flush with the wooden board
 * surface — like a real carved/inlaid marking. The triangle has a slight
 * narrowing toward the tip, giving it the classic teardrop shape seen on
 * traditional wooden backgammon boards.
 *
 * Both shades use light/cream colors (ivory inlay on walnut wood),
 * matching the reference photo of a real board.
 *
 * Memoized — 24 instances are rendered simultaneously.
 *
 * @example
 * ```tsx
 * <BackgammonPoint
 *   position={[x, 0.08, z]}
 *   isBottomRow={true}
 *   shade="dark"
 *   colIndex={3}
 * />
 * ```
 */

import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { POINT_WIDTH, POINT_HEIGHT, BOARD_SURFACE_Y } from './boardLayout';

/** Props for `BackgammonPoint`. */
interface BackgammonPointProps {
  /** World [x, y, z] position of this point's base center. */
  position: [number, number, number];
  /** `true` for bottom-row points (tip faces toward center); `false` for top-row. */
  isBottomRow: boolean;
  /** Visual shade — alternates per column for contrast. */
  shade: 'dark' | 'light';
  /** Column index 0..11, used purely for keying (no geometry effect). */
  colIndex: number;
}

/**
 * Y lift above the board surface.
 * Must clear the playing field box top face (BOARD_SURFACE_Y + 0.02 + 0.01 = 0.105).
 * BOARD_SURFACE_Y = 0.075, so offset ≥ 0.032 puts triangles above the field.
 */
const SURFACE_OFFSET = 0.035;

/** Y position just above the board surface. */
const TRIANGLE_Y = BOARD_SURFACE_Y + SURFACE_OFFSET;

/** Light inlay color (bright cream/white — clearly stands out on golden wood). */
const LIGHT_COLOR = '#FFF8DC';

/** Darker inlay for alternating contrast (rich brown — high contrast on golden wood). */
const DARK_COLOR = '#5C3A1E';

/** Width of the triangle at its widest (base) — matches the scallop notch. */
const TRI_BASE_HALF_W = POINT_WIDTH * 0.42;

/** Number of curve segments for the rounded base. */
const BASE_CURVE_SEGMENTS = 8;

/**
 * Creates a teardrop-shaped triangle with a rounded base.
 *
 * The shape starts with a semicircular arc at the base (wide end),
 * then tapers to a sharp point — matching the classic inlaid look
 * of real wooden backgammon boards.
 *
 * @returns A flat ShapeGeometry lying on the XZ plane.
 */
function createTeardropGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const hw = TRI_BASE_HALF_W;

  // Start at the left edge of the base
  shape.moveTo(-hw, 0);

  // Rounded base (semicircular arc from left to right)
  const arcCenterY = 0;
  for (let i = 1; i <= BASE_CURVE_SEGMENTS; i++) {
    const t = i / BASE_CURVE_SEGMENTS;
    const angle = Math.PI + t * Math.PI; // π to 2π (bottom semicircle)
    const x = Math.cos(angle) * hw;
    const y = arcCenterY + Math.sin(angle) * (hw * 0.4);
    shape.lineTo(x, y);
  }

  // Taper to the tip
  shape.lineTo(0, POINT_HEIGHT);

  // Back to start
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape);
  // ShapeGeometry is in XY plane — rotate to lie flat on XZ plane
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Inlaid triangular point on the backgammon board.
 *
 * Flat teardrop shape flush with the wooden surface, styled to look
 * like a light-wood or ivory inlay on a darker walnut board.
 *
 * @param props - See {@link BackgammonPointProps}.
 * @returns A Three.js mesh representing one board point.
 */
export const BackgammonPoint = memo(function BackgammonPoint({
  position,
  isBottomRow,
  shade,
}: BackgammonPointProps) {
  const geometry = useMemo(() => createTeardropGeometry(), []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: shade === 'dark' ? DARK_COLOR : LIGHT_COLOR,
      roughness: 0.5,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
  }, [shade]);

  // Bottom row: base at +Z border edge, tip toward center (-Z) → no rotation needed.
  // Top row: base at -Z border edge, tip toward center (+Z) → rotate π around Y.
  const rotationY = isBottomRow ? 0 : Math.PI;

  return (
    <mesh
      position={[position[0], TRIANGLE_Y, position[2]]}
      rotation={[0, rotationY, 0]}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
});
