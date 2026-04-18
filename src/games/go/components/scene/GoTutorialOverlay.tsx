/**
 * 3D overlay for Go tutorial highlights and arrows.
 *
 * Renders chapter-specific visual hints on top of the Go board while
 * tutorial mode is active:
 * - **Highlights**: semi-transparent glowing circles on intersections.
 * - **Arrows**: directional indicators between two intersections.
 *
 * All overlays are world-space meshes in the R3F tree with `depthWrite={false}`
 * so they render on top of the board without z-fighting.
 *
 * @module
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGoTutorialStore } from '../../stores/useGoTutorialStore';
import { pointToWorld, BOARD_SURFACE_Y } from './boardLayout';
import type { BoardSize, Point } from '../../engine/types';
import type { GoTutorialArrow } from '../../tutorial/tutorialChapters';

/** Y offset above the board surface for highlights. Keeps circles visible without z-fighting. */
const HIGHLIGHT_Y = BOARD_SURFACE_Y + 0.015;

/** Y offset for arrows — sits above highlight circles to prevent draw-order overlap. */
const ARROW_Y = BOARD_SURFACE_Y + 0.03;

/** Default arrow color (accent violet). Overridable per arrow via {@link GoTutorialArrow.color}. */
const DEFAULT_ARROW_COLOR = '#7c5cff';

/** Highlight circle radius in world units, calibrated against the 9x9 cell size. */
const HIGHLIGHT_RADIUS = 0.16;

/**
 * Tutorial overlay component — renders highlights and arrows on the Go board.
 *
 * Only renders when tutorial mode is active. Reads highlight/arrow data
 * directly from {@link useGoTutorialStore} — no props required. Must be
 * mounted inside a React-Three-Fiber `<Canvas>` context.
 *
 * @returns The overlay `<group>` containing all circles and arrows,
 *   or `null` when tutorial mode is inactive.
 *
 * @example
 * ```tsx
 * // Place inside GoScene, after GoStoneSet
 * <GoStoneSet board={display.board} boardSize={display.boardSize} deadStones={[]} />
 * <GoTutorialOverlay />
 * ```
 */
export function GoTutorialOverlay() {
  const isActive = useGoTutorialStore((s) => s.isActive);
  const highlights = useGoTutorialStore((s) => s.highlights);
  const arrows = useGoTutorialStore((s) => s.arrows);
  const boardSize = useGoTutorialStore((s) => s.boardSize);

  if (!isActive) return null;

  return (
    <group>
      {highlights.map((pt) => (
        <HighlightCircle
          key={`hl-${pt.x}-${pt.y}`}
          point={pt}
          boardSize={boardSize}
        />
      ))}
      {arrows.map((a, i) => (
        <ArrowMesh
          key={`arrow-${i}-${a.from.x}-${a.from.y}-${a.to.x}-${a.to.y}`}
          arrow={a}
          boardSize={boardSize}
        />
      ))}
    </group>
  );
}

/** Props for a single highlight circle. */
interface HighlightCircleProps {
  /** Grid point to highlight. */
  point: Point;
  /** Board dimension (for coordinate transform). */
  boardSize: BoardSize;
}

/**
 * Semi-transparent glowing circle on a board intersection.
 */
function HighlightCircle({ point, boardSize }: HighlightCircleProps) {
  const [wx, wz] = pointToWorld(point, boardSize);
  return (
    <mesh
      position={[wx, HIGHLIGHT_Y, wz]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[HIGHLIGHT_RADIUS, 24]} />
      <meshBasicMaterial
        color="#7c5cff"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Props for a single arrow mesh. */
interface ArrowMeshProps {
  /** Arrow definition. */
  arrow: GoTutorialArrow;
  /** Board dimension. */
  boardSize: BoardSize;
}

/**
 * Directional arrow between two intersections — a flat ribbon with a
 * cone arrowhead at the destination.
 */
function ArrowMesh({ arrow, boardSize }: ArrowMeshProps) {
  const color = arrow.color ?? DEFAULT_ARROW_COLOR;

  const geometry = useMemo(() => {
    const [fx, fz] = pointToWorld(arrow.from, boardSize);
    const [tx, tz] = pointToWorld(arrow.to, boardSize);

    const dx = tx - fx;
    const dz = tz - fz;
    const distance = Math.hypot(dx, dz) || 1;
    const nx = dx / distance;
    const nz = dz / distance;

    const headLength = 0.18;
    const shaftLen = Math.max(0.1, distance - headLength);

    const midX = fx + nx * (shaftLen / 2);
    const midZ = fz + nz * (shaftLen / 2);

    const headX = fx + nx * (distance - headLength / 2);
    const headZ = fz + nz * (distance - headLength / 2);

    const shaftAngle = Math.atan2(nx, nz);

    const headQ = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(nx, 0, nz),
    );

    return {
      shaftPos: new THREE.Vector3(midX, ARROW_Y, midZ),
      shaftLen,
      shaftRot: new THREE.Euler(0, shaftAngle, 0),
      headPos: new THREE.Vector3(headX, ARROW_Y, headZ),
      headQ,
    };
  }, [arrow.from, arrow.to, boardSize]);

  return (
    <group>
      <mesh position={geometry.shaftPos} rotation={geometry.shaftRot}>
        <boxGeometry args={[0.07, 0.015, geometry.shaftLen]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh position={geometry.headPos} quaternion={geometry.headQ}>
        <coneGeometry args={[0.12, 0.18, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}
