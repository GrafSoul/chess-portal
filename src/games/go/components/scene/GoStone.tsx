import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Stone } from '../../engine/types';
import { CELL_SIZE } from './boardLayout';

/**
 * Props for {@link GoStone}.
 *
 * World coordinates (`x`, `z`) must be obtained from `pointToWorld`; do not
 * pass raw grid indices. `isDead` is only meaningful during the scoring phase —
 * passing `true` at any other time renders a ghost stone, which is not intended.
 */
interface GoStoneProps {
  /** Stone color. */
  color: Stone;
  /** World X coordinate (from `pointToWorld`). */
  x: number;
  /** World Z coordinate (from `pointToWorld`). */
  z: number;
  /**
   * Whether this stone has been marked dead during the scoring phase.
   * When `true` the stone renders at 35% opacity and shows a red × marker.
   * Defaults to `false`.
   */
  isDead?: boolean;
}

const WHITE_MAT = { color: '#f5f5f5', roughness: 0.22, metalness: 0.05 };
const BLACK_MAT = { color: '#141414', roughness: 0.28, metalness: 0.1 };

/** Target radius for a stone — a hair smaller than a grid cell. */
const STONE_RADIUS = CELL_SIZE * 0.46;
/** Flattened height of the stone (biconvex). */
const STONE_HEIGHT = CELL_SIZE * 0.32;

/** Drop-in animation duration. */
const DROP_DURATION = 0.22;

/**
 * A single biconvex Go stone rendered in 3D.
 *
 * Rendered as a vertically-squashed sphere to approximate the profile of a
 * traditional Yunzi stone. On mount it plays a short eased drop animation
 * (`DROP_DURATION` seconds) to provide tactile feedback for placement.
 *
 * When `isDead` is `true` (scoring phase):
 * - The stone mesh becomes 35% opaque and stops casting shadows.
 * - A red × overlay (two crossed `BoxGeometry` bars) is rendered on top.
 * - The × uses `depthTest={false}` so it is always visible even when the stone
 *   overlaps with another mesh.
 *
 * @param props - Component props.
 * @param props.color - `'b'` for black, `'w'` for white.
 * @param props.x - World X position (from `pointToWorld`).
 * @param props.z - World Z position (from `pointToWorld`).
 * @param props.isDead - When `true`, renders dead-stone appearance. Default `false`.
 *
 * @example
 * ```tsx
 * const [wx, wz] = pointToWorld({ x: 3, y: 3 }, 19);
 * <GoStone color="b" x={wx} z={wz} isDead={false} />
 *
 * // During scoring — mark stone as dead
 * <GoStone color="w" x={wx} z={wz} isDead={true} />
 * ```
 */
export function GoStone({ color, x, z, isDead = false }: GoStoneProps) {
  const groupRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const mat = color === 'b' ? BLACK_MAT : WHITE_MAT;

  useEffect(() => {
    progressRef.current = 0;
    const g = groupRef.current;
    if (g) {
      g.position.set(x, STONE_HEIGHT * 0.5 + 0.25, z);
    }
    // Only run on mount (per-stone).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (progressRef.current >= 1) {
      g.position.set(x, STONE_HEIGHT * 0.5, z);
      return;
    }
    progressRef.current = Math.min(1, progressRef.current + delta / DROP_DURATION);
    const t = progressRef.current;
    const ease = 1 - Math.pow(1 - t, 3);
    const startY = STONE_HEIGHT * 0.5 + 0.25;
    const endY = STONE_HEIGHT * 0.5;
    g.position.set(x, startY + (endY - startY) * ease, z);
  });

  // Dead-stone marker dimensions: two thin crossed boxes that form an ×.
  const markerSize = STONE_RADIUS * 1.2;
  const markerThick = 0.02;
  // The marker color contrasts with the stone: red on both for visibility.
  const markerColor = '#ef4444';

  return (
    <group ref={groupRef} scale={[1, STONE_HEIGHT / (STONE_RADIUS * 2), 1]}>
      <mesh castShadow={!isDead} receiveShadow>
        <sphereGeometry args={[STONE_RADIUS, 24, 16]} />
        <meshStandardMaterial
          {...mat}
          transparent={isDead}
          opacity={isDead ? 0.35 : 1}
        />
      </mesh>

      {/* × marker drawn on top of the stone when marked dead */}
      {isDead && (
        <group
          position={[0, STONE_RADIUS * 0.55, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {/* First bar: top-left → bottom-right */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[markerSize, markerThick, markerThick]} />
            <meshBasicMaterial color={markerColor} depthTest={false} />
          </mesh>
          {/* Second bar: top-right → bottom-left */}
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[markerSize, markerThick, markerThick]} />
            <meshBasicMaterial color={markerColor} depthTest={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}
