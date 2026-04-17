import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Material } from 'three';
import type { Stone } from '../../engine/types';
import { CELL_SIZE } from './boardLayout';

interface FadingGoStoneProps {
  /** World X coordinate. */
  x: number;
  /** World Z coordinate. */
  z: number;
  /** Color of the captured stone. */
  color: Stone;
}

const STONE_RADIUS = CELL_SIZE * 0.46;
const STONE_HEIGHT = CELL_SIZE * 0.32;

const WHITE_MAT = { color: '#f5f5f5', roughness: 0.22, metalness: 0.05 };
const BLACK_MAT = { color: '#141414', roughness: 0.28, metalness: 0.1 };

/** Total lifetime of the fade-out ghost (seconds). */
const FADE_DURATION = 0.65;

/**
 * A ghost copy of a just-captured stone that fades out and floats up slightly.
 *
 * Rendered by `GoStoneSet` alongside the live stones. The lingering visual
 * makes captures legible — without it, stones would vanish in a single frame
 * when the engine removes them from the board.
 */
export function FadingGoStone({ x, z, color }: FadingGoStoneProps) {
  const groupRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const mat = color === 'b' ? BLACK_MAT : WHITE_MAT;

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    progressRef.current = Math.min(1, progressRef.current + delta / FADE_DURATION);
    const t = progressRef.current;

    // Ease-out curve for opacity; linear lift for Y.
    const opacity = 1 - t * t;
    const baseY = STONE_HEIGHT * 0.5;
    const liftY = baseY + t * 0.35;

    g.position.set(x, liftY, z);
    g.scale.set(1 + t * 0.15, (STONE_HEIGHT / (STONE_RADIUS * 2)) * (1 + t * 0.15), 1 + t * 0.15);

    g.traverse((child) => {
      const mesh = child as { material?: Material & { opacity?: number; transparent?: boolean } };
      const m = mesh.material;
      if (m && typeof m.opacity === 'number') {
        m.transparent = true;
        m.opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[STONE_RADIUS, 24, 16]} />
        <meshStandardMaterial {...mat} transparent opacity={1} depthWrite={false} />
      </mesh>
    </group>
  );
}
