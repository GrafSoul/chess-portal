/**
 * Renders the pip dots on one face of a physical die.
 *
 * Classic pip layout for face values 1–6 using flat dark circles
 * flush with the die surface. Each pip is a circleGeometry with
 * radius 0.055 units, positioned relative to the face center.
 *
 * @example
 * ```tsx
 * <DicePip face={6} position={[0, 0.301, 0]} scale={1} />
 * ```
 */

import { memo } from 'react';

/** Standard pip (x, z) offsets within a face, relative to face center. */
const PIP_PATTERNS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [0, -0.18],
    [0, 0.18],
  ],
  3: [
    [0.18, -0.18],
    [0, 0],
    [-0.18, 0.18],
  ],
  4: [
    [0.18, -0.18],
    [-0.18, -0.18],
    [0.18, 0.18],
    [-0.18, 0.18],
  ],
  5: [
    [0.18, -0.18],
    [-0.18, -0.18],
    [0, 0],
    [0.18, 0.18],
    [-0.18, 0.18],
  ],
  6: [
    [0.18, -0.18],
    [-0.18, -0.18],
    [0.18, 0],
    [-0.18, 0],
    [0.18, 0.18],
    [-0.18, 0.18],
  ],
};

/** Props for {@link DicePip}. */
interface DicePipProps {
  /** Face value 1–6 determines the pip arrangement. */
  face: number;
  /** World position of the face center (after face rotation this is local). */
  position: [number, number, number];
  /** Uniform scale multiplier. Defaults to 1. */
  scale?: number;
}

/**
 * Renders pip dots on a single die face using flat dark circles.
 *
 * @param props - See {@link DicePipProps}.
 * @returns A group of circle meshes flush with the die surface, or `null` for unknown face values.
 */
export const DicePip = memo(function DicePip({
  face,
  position,
  scale = 1,
}: DicePipProps) {
  const offsets = PIP_PATTERNS[face];
  if (!offsets) return null;

  return (
    <group position={position} scale={scale}>
      {offsets.map(([ox, oz], i) => (
        <mesh key={i} position={[ox, oz, 0.001]}>
          <circleGeometry args={[0.055, 16]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.6}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
});
