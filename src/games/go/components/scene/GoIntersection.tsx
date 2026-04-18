import { memo } from 'react';
import type { Point } from '../../engine/types';
import { CELL_SIZE } from './boardLayout';

interface GoIntersectionProps {
  /** Grid point this hit target represents. */
  point: Point;
  /** World X coordinate of the intersection. */
  x: number;
  /** World Z coordinate of the intersection. */
  z: number;
  /** Whether clicking should be accepted. */
  interactive: boolean;
  /** Click handler, receives the grid point. */
  onClick: (point: Point) => void;
  /** Optional pointer-enter handler used to drive the hover stone preview. */
  onHoverEnter?: (point: Point) => void;
  /** Optional pointer-leave handler paired with {@link GoIntersectionProps.onHoverEnter}. */
  onHoverLeave?: (point: Point) => void;
}

/**
 * Invisible click-catcher placed at a single board intersection.
 *
 * A small flat plane sized slightly smaller than one grid cell so that
 * adjacent intersections don't overlap. Rendered fully transparent — the
 * visible grid/stones are drawn by sibling components.
 */
function GoIntersectionImpl({
  point,
  x,
  z,
  interactive,
  onClick,
  onHoverEnter,
  onHoverLeave,
}: GoIntersectionProps) {
  const size = CELL_SIZE * 0.95;
  return (
    <mesh
      position={[x, 0.01, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onClick(point);
      }}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHoverEnter?.(point);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        onHoverLeave?.(point);
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/**
 * Memoised intersection hit-target.
 *
 * Each 19×19 board mounts 361 of these, so skipping re-renders when their
 * props are unchanged is a significant win — pointer moves in the scene will
 * otherwise touch every intersection via the React reconciler. The default
 * shallow comparison is sufficient because the parent (`GoBoard`) already
 * passes stable callback identities via {@link React.useCallback}.
 */
export const GoIntersection = memo(GoIntersectionImpl);
