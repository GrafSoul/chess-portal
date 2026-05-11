/**
 * A single cylindrical checker stone for the Backgammon board.
 *
 * Renders a `CylinderGeometry` with a flat face on top. Selected stones receive
 * a subtle scale-up and emissive glow so the player can see which point is
 * currently chosen. Supports both white and black colors via `MeshStandardMaterial`.
 *
 * Memoized — up to 30 stones may be visible simultaneously.
 *
 * @example
 * ```tsx
 * <BackgammonStone
 *   position={[x, y, z]}
 *   color="w"
 *   selected={true}
 * />
 * ```
 */

import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Mesh } from 'three';
import { STONE_RADIUS, STONE_HEIGHT } from './boardLayout';
import type { StoneColor } from '../../engine/types';

/** Props for `BackgammonStone`. */
interface BackgammonStoneProps {
  /** World position [x, y, z] for this stone's center. */
  position: [number, number, number];
  /** Stone color: `'w'` (white) or `'b'` (black). */
  color: StoneColor;
  /** Whether this stone belongs to the currently selected point. */
  selected?: boolean;
}

/** Off-white color for white stones. */
const WHITE_STONE_COLOR = '#F0EAD6';

/** Dark grey color for black stones. */
const BLACK_STONE_COLOR = '#2A2A2E';

/** Scale applied to the mesh when `selected === true`. */
const SELECTED_SCALE = 1.08;

/** Normal scale (no selection). */
const NORMAL_SCALE = 1.0;

/** Emissive color used for the selection glow on white stones. */
const WHITE_SELECTED_EMISSIVE = '#FFD580';

/** Emissive color used for the selection glow on black stones. */
const BLACK_SELECTED_EMISSIVE = '#806020';

/** Emissive intensity when selected. */
const SELECTED_EMISSIVE_INTENSITY = 0.5;

/** Radial segments for the cylinder — 24 is smooth but not excessive. */
const CYLINDER_SEGMENTS = 24;

/** Height segments (1 is sufficient for a flat cylinder). */
const CYLINDER_HEIGHT_SEGMENTS = 1;

/** Number of top-ring segments for the decorative inner ring. */
const RING_SEGMENTS = 24;

/** Inner radius of the decorative ring on top of the stone. */
const RING_INNER_RADIUS = STONE_RADIUS * 0.65;

/** Outer radius of the decorative ring on top of the stone. */
const RING_OUTER_RADIUS = STONE_RADIUS * 0.82;

/** Y offset of the ring above the stone top face. */
const RING_Y_OFFSET = STONE_HEIGHT / 2 + 0.002;

/**
 * A single checker stone with optional selection highlight.
 *
 * Uses `useFrame` + a ref for the scale animation to avoid React re-renders
 * during every frame. The scale lerps smoothly between normal and selected.
 *
 * @param props - See {@link BackgammonStoneProps}.
 * @returns A Three.js mesh group representing one stone.
 */
export const BackgammonStone = memo(function BackgammonStone({
  position,
  color,
  selected = false,
}: BackgammonStoneProps) {
  const meshRef = useRef<Mesh>(null);

  // Cylinder geometry — shared per color/size combination via useMemo.
  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        STONE_RADIUS,
        STONE_RADIUS,
        STONE_HEIGHT,
        CYLINDER_SEGMENTS,
        CYLINDER_HEIGHT_SEGMENTS,
      ),
    [],
  );

  // Decorative ring geometry on top of the stone.
  const ringGeometry = useMemo(
    () =>
      new THREE.RingGeometry(RING_INNER_RADIUS, RING_OUTER_RADIUS, RING_SEGMENTS),
    [],
  );

  const material = useMemo(() => {
    const isWhite = color === 'w';
    return new THREE.MeshStandardMaterial({
      color: isWhite ? WHITE_STONE_COLOR : BLACK_STONE_COLOR,
      roughness: isWhite ? 0.4 : 0.5,
      metalness: isWhite ? 0.05 : 0.02,
      emissive: isWhite ? WHITE_SELECTED_EMISSIVE : BLACK_SELECTED_EMISSIVE,
      emissiveIntensity: 0,
    });
  }, [color]);

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color === 'w' ? '#C8B870' : '#6A6A6A',
        roughness: 0.3,
        metalness: 0.2,
        side: THREE.DoubleSide,
      }),
    [color],
  );

  // Animate scale and emissive intensity toward target values every frame.
  // This avoids setState in useFrame — uses refs only.
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const targetScale = selected ? SELECTED_SCALE : NORMAL_SCALE;
    const targetEmissive = selected ? SELECTED_EMISSIVE_INTENSITY : 0;
    const speed = 8 * delta;

    mesh.scale.x += (targetScale - mesh.scale.x) * speed;
    mesh.scale.z += (targetScale - mesh.scale.z) * speed;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * speed;
  });

  return (
    <group position={position}>
      {/* Main stone cylinder */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />
      {/* Decorative ring on top face (horizontal ring geometry rotated flat) */}
      <mesh
        geometry={ringGeometry}
        material={ringMaterial}
        position={[0, RING_Y_OFFSET, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
});
