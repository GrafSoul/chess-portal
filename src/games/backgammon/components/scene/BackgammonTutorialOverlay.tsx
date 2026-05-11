/**
 * 3D tutorial overlay rendered inside `BackgammonScene` while tutorial mode
 * is active.
 *
 * Draws two types of visual hints:
 * - **Highlight rings** — semi-transparent glowing rings at the center of
 *   specific board points, laid flat on the board surface.
 * - **Arrows** — flat shaft + arrowhead pointing from one point to another.
 *
 * All geometry uses `meshBasicMaterial` (unlit) so the hints pop out clearly
 * regardless of scene lighting. Both are rendered slightly above the board
 * surface to avoid Z-fighting with the point triangles.
 *
 * The component renders `null` immediately when `isActive === false`, so it is
 * safe to include unconditionally in the scene tree.
 *
 * @module
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useBackgammonTutorialStore } from '../../stores/useBackgammonTutorialStore';
import { POINT_LAYOUTS, BOARD_SURFACE_Y, STONE_RADIUS } from './boardLayout';
import type { TutorialArrow } from '../../stores/useBackgammonTutorialStore';
import type { PointIndex } from '../../engine/types';

/** Y position of the highlight ring — just above the board surface. */
const HIGHLIGHT_Y = BOARD_SURFACE_Y + 0.018;

/** Y position of arrows — slightly higher than highlights. */
const ARROW_Y = BOARD_SURFACE_Y + 0.032;

/** Default arrow color when the chapter doesn't specify one. */
const DEFAULT_ARROW_COLOR = '#7c5cff';

/**
 * Tutorial overlay group — rendered inside the backgammon R3F scene.
 *
 * Reads highlight and arrow data from `useBackgammonTutorialStore` and renders
 * them as 3D meshes. Returns `null` when tutorial mode is inactive.
 *
 * @returns An R3F `<group>` with highlight rings and arrows, or `null`.
 *
 * @example
 * ```tsx
 * // Inside BackgammonScene:
 * <BackgammonTutorialOverlay />
 * ```
 */
export function BackgammonTutorialOverlay() {
  const isActive = useBackgammonTutorialStore((s) => s.isActive);
  const highlights = useBackgammonTutorialStore((s) => s.highlights);
  const arrows = useBackgammonTutorialStore((s) => s.arrows);

  if (!isActive) return null;

  return (
    <group>
      {highlights.map((pt) => (
        <HighlightRing key={`hl-${pt}`} pointIndex={pt} />
      ))}
      {arrows.map((a, i) => (
        <ArrowMesh key={`arr-${i}-${a.from}-${a.to}`} arrow={a} />
      ))}
    </group>
  );
}

// ─── HighlightRing ────────────────────────────────────────────────────────────

/** Props for {@link HighlightRing}. */
interface HighlightRingProps {
  /** Board point index to highlight. */
  pointIndex: PointIndex;
}

/**
 * A semi-transparent glowing ring laid flat on the board surface above a point.
 *
 * @param props - See {@link HighlightRingProps}.
 * @returns A flat ring mesh at the point's XZ position, or `null` for unknown points.
 */
function HighlightRing({ pointIndex }: HighlightRingProps) {
  const layout = POINT_LAYOUTS[pointIndex];
  if (!layout) return null;

  const { x, z } = layout.basePosition;

  return (
    <mesh
      position={[x, HIGHLIGHT_Y, z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[STONE_RADIUS * 1.05, STONE_RADIUS * 1.85, 32]} />
      <meshBasicMaterial
        color="#7c5cff"
        transparent
        opacity={0.55}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── ArrowMesh ────────────────────────────────────────────────────────────────

/** Props for {@link ArrowMesh}. */
interface ArrowMeshProps {
  /** Arrow specification from the tutorial chapter. */
  arrow: TutorialArrow;
}

/**
 * A flat directional arrow drawn on the board from one point to another.
 *
 * Consists of a thin rectangular shaft and a flattened cone arrowhead oriented
 * via quaternion rotation toward the destination point.
 *
 * @param props - See {@link ArrowMeshProps}.
 * @returns A group with a shaft mesh and a cone arrowhead, or `null` for unknown points.
 */
function ArrowMesh({ arrow }: ArrowMeshProps) {
  const color = arrow.color ?? DEFAULT_ARROW_COLOR;

  const computed = useMemo(() => {
    const fromLayout = POINT_LAYOUTS[arrow.from];
    const toLayout = POINT_LAYOUTS[arrow.to];
    if (!fromLayout || !toLayout) return null;

    const fx = fromLayout.basePosition.x;
    const fz = fromLayout.basePosition.z;
    const tx = toLayout.basePosition.x;
    const tz = toLayout.basePosition.z;

    const dx = tx - fx;
    const dz = tz - fz;
    const dist = Math.hypot(dx, dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;

    // Leave room at the destination end for the arrowhead cone
    const headLength = 0.38;
    const shaft = Math.max(0.2, dist - headLength);

    const midX = fx + nx * (shaft / 2);
    const midZ = fz + nz * (shaft / 2);
    const headX = fx + nx * (dist - headLength / 2);
    const headZ = fz + nz * (dist - headLength / 2);

    // Shaft angle: rotate box so its local +Z aligns with (nx, 0, nz)
    const shaftAngle = Math.atan2(nx, nz);

    // Head quaternion: map cone's +Y axis to the horizontal direction vector
    const headQ = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(nx, 0, nz),
    );

    return {
      shaftPos: new THREE.Vector3(midX, ARROW_Y, midZ),
      shaftLen: shaft,
      shaftRot: new THREE.Euler(0, shaftAngle, 0),
      headPos: new THREE.Vector3(headX, ARROW_Y, headZ),
      headQ,
    };
  }, [arrow.from, arrow.to]);

  if (!computed) return null;

  const { shaftPos, shaftLen, shaftRot, headPos, headQ } = computed;

  return (
    <group>
      {/* Shaft — thin flat box oriented along the arrow direction */}
      <mesh position={shaftPos} rotation={shaftRot}>
        <boxGeometry args={[0.13, 0.022, shaftLen]} />
        <meshBasicMaterial color={color} transparent opacity={0.88} />
      </mesh>
      {/* Arrowhead — flattened cone at the destination end */}
      <mesh position={headPos} quaternion={headQ}>
        <coneGeometry args={[0.23, 0.38, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} />
      </mesh>
    </group>
  );
}
