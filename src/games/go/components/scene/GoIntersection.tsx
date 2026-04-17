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
}

/**
 * Invisible click-catcher placed at a single board intersection.
 *
 * A small flat plane sized slightly smaller than one grid cell so that
 * adjacent intersections don't overlap. Rendered fully transparent — the
 * visible grid/stones are drawn by sibling components.
 */
export function GoIntersection({
  point,
  x,
  z,
  interactive,
  onClick,
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
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
