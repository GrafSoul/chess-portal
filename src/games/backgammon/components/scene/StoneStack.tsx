/**
 * Renders all stones belonging to one board point as a row along the triangle.
 *
 * Handles:
 * - Empty points (renders nothing).
 * - All stacks up to 15 stones: each stone rendered individually in a row.
 *
 * Click interaction follows the same pattern as Chess `Piece` and Checkers
 * `CheckerPiece`: `onClick` on a wrapping `<group>` with `stopPropagation`,
 * plus `onPointerOver` / `onPointerOut` for cursor feedback.
 *
 * Memoized with a custom comparator that only re-renders when `count`, `color`,
 * or the selection state for this point changes.
 *
 * @example
 * ```tsx
 * <StoneStack
 *   pointIndex={23}
 *   state={{ color: 'w', count: 15 }}
 *   selectedFrom={null}
 *   onPointClick={(p) => selectFrom(p)}
 * />
 * ```
 */

import { memo, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { BackgammonStone } from './BackgammonStone';
import {
  POINT_LAYOUTS,
  STONE_HEIGHT,
  STONE_RADIUS,
  POINT_MAX_VISIBLE,
  BOARD_SURFACE_Y,
  stoneSpacing,
} from './boardLayout';
import type { PointState, PointIndex } from '../../engine/types';

/** Props for `StoneStack`. */
interface StoneStackProps {
  /** The board point index this stack occupies (0..23). */
  pointIndex: PointIndex;
  /** Current occupancy of this point. */
  state: PointState;
  /** The currently selected source point, or `null`. */
  selectedFrom: PointIndex | null;
  /** When true this point is a legal move destination — renders a green ring. */
  isLegalDest?: boolean;
  /** Called when the user clicks any stone in this stack. */
  onPointClick: (point: PointIndex) => void;
}

/**
 * A stack of stone cylinders on a single board point.
 *
 * Uses the Chess/Checkers click pattern: onClick on wrapping group,
 * onPointerOver/Out for cursor feedback. No invisible hit area meshes.
 *
 * @param props - See {@link StoneStackProps}.
 * @returns A group of stone meshes, or `null` for empty points.
 */
export const StoneStack = memo(
  function StoneStack({ pointIndex, state, selectedFrom, isLegalDest = false, onPointClick }: StoneStackProps) {
    const { color, count } = state;
    const layout = POINT_LAYOUTS[pointIndex];
    const isSelected = selectedFrom === pointIndex;

    // Number of physical stone meshes to render.
    const visibleCount = count > POINT_MAX_VISIBLE ? POINT_MAX_VISIBLE : count;

    // Hooks MUST run on every render (no early returns above) — fall back to a
    // safe layout when the point is empty or out of range; we bail out with
    // `null` only AFTER all hooks have executed.
    const safeLayout = layout ?? POINT_LAYOUTS[0];

    // Adaptive Z spacing: tightens when many stones would exceed triangle length.
    const spacing = useMemo(() => stoneSpacing(visibleCount), [visibleCount]);

    const stonePositions = useMemo(() => {
      return Array.from({ length: visibleCount }, (_, i) => {
        const z =
          safeLayout.basePosition.z + safeLayout.stackDirection * i * spacing;
        return [safeLayout.basePosition.x, safeLayout.basePosition.y, z] as [
          number,
          number,
          number,
        ];
      });
    }, [safeLayout, visibleCount, spacing]);

    // Label position Z: just beyond the last visible stone along the triangle.
    const nextStoneZ = useMemo(() => {
      const lastIndex = visibleCount;
      return (
        safeLayout.basePosition.z +
        safeLayout.stackDirection * lastIndex * spacing
      );
    }, [safeLayout, visibleCount, spacing]);

    /** Click handler — same pattern as Chess Piece onClick. */
    const handleClick = useCallback(
      (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onPointClick(pointIndex);
      },
      [onPointClick, pointIndex],
    );

    /** Pointer over — show pointer cursor. */
    const handlePointerOver = useCallback(
      (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      },
      [],
    );

    /** Pointer out — reset cursor. */
    const handlePointerOut = useCallback(() => {
      document.body.style.cursor = 'default';
    }, []);

    // Invisible click-catcher plane dimensions — computed before early return
    // so hooks run unconditionally.
    const hitPlaneZ = useMemo(() => {
      if (visibleCount <= 1) return safeLayout.basePosition.z;
      const first = safeLayout.basePosition.z;
      const last = first + safeLayout.stackDirection * (visibleCount - 1) * spacing;
      return (first + last) / 2;
    }, [safeLayout, visibleCount, spacing]);

    const hitPlaneLength = useMemo(() => {
      if (visibleCount <= 1) return STONE_RADIUS * 2;
      return Math.abs(safeLayout.stackDirection * (visibleCount - 1) * spacing) + STONE_RADIUS * 2;
    }, [safeLayout, visibleCount, spacing]);

    // Now that every hook has been called, it's safe to bail out.
    if (color === null || count === 0 || !layout) {
      // Still render legal dest ring for empty points that are valid destinations
      if (isLegalDest && layout) {
        return (
          <group>
            {/* Invisible click plane for empty legal destination */}
            <mesh
              position={[layout.basePosition.x, BOARD_SURFACE_Y + 0.01, layout.basePosition.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <planeGeometry args={[STONE_RADIUS * 2, STONE_RADIUS * 2]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Visible green ring */}
            <mesh
              position={[layout.basePosition.x, BOARD_SURFACE_Y + 0.004, layout.basePosition.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[STONE_RADIUS * 0.55, STONE_RADIUS * 0.9, 32]} />
              <meshBasicMaterial color="#00E676" transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      }
      return null;
    }

    return (
      <group>
        {/* Invisible click-catcher plane — guaranteed raycast hit */}
        <mesh
          position={[safeLayout.basePosition.x, BOARD_SURFACE_Y + STONE_HEIGHT + 0.01, hitPlaneZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[STONE_RADIUS * 2, hitPlaneLength]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Visible stone meshes */}
        {stonePositions.map((pos, i) => (
          <BackgammonStone
            key={i}
            position={pos}
            color={color}
            selected={isSelected}
          />
        ))}

        {/* Gold ring — selected source point (on first stone) */}
        {isSelected && (
          <mesh
            position={[layout.basePosition.x, BOARD_SURFACE_Y + 0.005, layout.basePosition.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[STONE_RADIUS * 1.1, STONE_RADIUS * 1.35, 32]} />
            <meshBasicMaterial color="#FFD700" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Green ring — legal move destination (at next available position) */}
        {isLegalDest && (
          <mesh
            position={[layout.basePosition.x, BOARD_SURFACE_Y + 0.004, nextStoneZ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[STONE_RADIUS * 0.55, STONE_RADIUS * 0.9, 32]} />
            <meshBasicMaterial color="#00E676" transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    );
  },
  // Custom memo comparator — only re-render when relevant props change.
  (prev, next) =>
    prev.pointIndex === next.pointIndex &&
    prev.state.count === next.state.count &&
    prev.state.color === next.state.color &&
    prev.isLegalDest === next.isLegalDest &&
    (prev.selectedFrom === prev.pointIndex) ===
      (next.selectedFrom === next.pointIndex),
);
