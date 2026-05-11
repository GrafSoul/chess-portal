/**
 * A backgammon stone that smoothly lerps from its current world position
 * to a new `targetPosition` via `useFrame`.
 *
 * Uses a parabolic arc on the Y axis for visual polish: the stone rises to
 * `arcHeight` at the midpoint of its journey before descending to the target.
 *
 * When the stone reaches within 0.01 units of `targetPosition`, it snaps
 * exactly and fires `onComplete`.
 *
 * @example
 * ```tsx
 * <AnimatedStone
 *   startPosition={[x1, y1, z1]}
 *   targetPosition={[x2, y2, z2]}
 *   color="w"
 *   onComplete={() => setAnimating(false)}
 * />
 * ```
 */

import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StoneColor } from '../../engine/types';

/** Lerp speed in units/second. */
const LERP_SPEED = 8;

/** Peak arc height above the travel path. */
const ARC_HEIGHT = 1.0;

/** Props for {@link AnimatedStone}. */
interface AnimatedStoneProps {
  /** Starting world position. */
  startPosition: [number, number, number];
  /** Target world position to animate toward. */
  targetPosition: [number, number, number];
  /** Color of the stone. */
  color: StoneColor;
  /** Called once when the stone arrives at `targetPosition`. */
  onComplete?: () => void;
}

/** Stone material colors matching BackgammonStone. */
const STONE_COLORS: Record<StoneColor, string> = {
  w: '#F0EAD6',
  b: '#2A2A2E',
};

/**
 * Lerp-animated stone with a parabolic Y arc.
 *
 * @param props - See {@link AnimatedStoneProps}.
 * @returns A mesh that moves toward `targetPosition` each frame.
 */
export const AnimatedStone = memo(function AnimatedStone({
  startPosition,
  targetPosition,
  color,
  onComplete,
}: AnimatedStoneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Track lerp progress [0..1]
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  const start = useRef(new THREE.Vector3(...startPosition));
  const target = useRef(new THREE.Vector3(...targetPosition));

  useFrame((_state, delta) => {
    if (!meshRef.current || completedRef.current) return;

    progressRef.current = Math.min(progressRef.current + delta * LERP_SPEED / start.current.distanceTo(target.current), 1);
    const t = progressRef.current;

    // Lerp X and Z linearly
    const x = start.current.x + (target.current.x - start.current.x) * t;
    const z = start.current.z + (target.current.z - start.current.z) * t;

    // Parabolic arc on Y
    const baseY = start.current.y + (target.current.y - start.current.y) * t;
    const arcY = Math.sin(t * Math.PI) * ARC_HEIGHT;
    const y = baseY + arcY;

    meshRef.current.position.set(x, y, z);

    if (t >= 1 && !completedRef.current) {
      completedRef.current = true;
      meshRef.current.position.copy(target.current);
      onComplete?.();
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={startPosition}
      castShadow
    >
      <cylinderGeometry args={[0.45, 0.45, 0.18, 24]} />
      <meshStandardMaterial
        color={STONE_COLORS[color]}
        roughness={0.4}
        metalness={0.05}
      />
    </mesh>
  );
});
