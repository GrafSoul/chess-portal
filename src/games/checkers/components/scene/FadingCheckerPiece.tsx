import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { PieceType, PieceColor, Square } from '../../engine/types';

/** Convert checkers square (e.g. 'a1') to 3D position [x, y, z] */
function squareTo3D(square: Square): [number, number, number] {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return [file - 3.5, 0, rank - 3.5];
}

/** White checker material */
const WHITE_MAT = { color: '#f5e6d0', roughness: 0.35, metalness: 0.05 };
/** Black checker material */
const BLACK_MAT = { color: '#2a1a0e', roughness: 0.4, metalness: 0.1 };
/** Gold accent for king crown ring */
const CROWN_MAT = { color: '#d4a017', roughness: 0.3, metalness: 0.6 };

const DISC_RADIUS = 0.38;
const DISC_HEIGHT = 0.1;
const RADIAL_SEGMENTS = 32;

/** Total lifetime of a fading piece — time between capture and removal (ms) */
const FADE_LIFETIME_MS = 1200;
/** Fraction of lifetime spent waiting before fade begins (piece is still visible) */
const FADE_HOLD_FRACTION = 0.75;

interface FadingCheckerPieceProps {
  /** Square where the captured piece sits */
  square: Square;
  /** Color of the captured piece */
  color: PieceColor;
  /** Type of the captured piece */
  type: PieceType;
}

/**
 * A captured checker piece that lingers on the board after being jumped,
 * fading out near the end of the capture animation.
 *
 * Rendered outside of the tracked PieceSet — has its own lifecycle tied
 * purely to mount/unmount, so it doesn't interfere with move-tracking logic.
 */
export function FadingCheckerPiece({ square, color, type }: FadingCheckerPieceProps) {
  const groupRef = useRef<Group>(null);
  const startRef = useRef<number | null>(null);
  const mat = color === 'w' ? WHITE_MAT : BLACK_MAT;
  const [x, , z] = squareTo3D(square);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    if (startRef.current === null) {
      startRef.current = performance.now();
    }
    const elapsed = performance.now() - startRef.current;
    const lifeProgress = Math.min(1, elapsed / FADE_LIFETIME_MS);

    // Hold at full opacity, then fade in the last segment
    let opacity = 1;
    if (lifeProgress > FADE_HOLD_FRACTION) {
      const fadeT = (lifeProgress - FADE_HOLD_FRACTION) / (1 - FADE_HOLD_FRACTION);
      opacity = Math.max(0, 1 - fadeT);
    }

    // Apply opacity to all child mesh materials
    group.traverse((obj) => {
      const mesh = obj as unknown as {
        material?: { opacity?: number; transparent?: boolean };
      };
      if (mesh.material && typeof mesh.material.opacity === 'number') {
        mesh.material.transparent = true;
        mesh.material.opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef} position={[x, 0.01, z]}>
      {type === 'man' ? <ManGeometry mat={mat} /> : <KingGeometry mat={mat} />}
    </group>
  );
}

interface MatProps {
  color: string;
  roughness: number;
  metalness: number;
}

/** Single flat disc with groove ring — matches CheckerPiece.ManGeometry */
function ManGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, DISC_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...mat} transparent />
      </mesh>
      <mesh position={[0, DISC_HEIGHT + 0.001, 0]}>
        <torusGeometry args={[DISC_RADIUS * 0.6, 0.015, 8, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...mat} roughness={mat.roughness + 0.1} transparent />
      </mesh>
    </group>
  );
}

/** Two stacked discs with gold crown — matches CheckerPiece.KingGeometry */
function KingGeometry({ mat }: { mat: MatProps }) {
  const stackGap = 0.02;
  const totalBase = DISC_HEIGHT + stackGap + DISC_HEIGHT;
  return (
    <group>
      <mesh position={[0, DISC_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...mat} transparent />
      </mesh>
      <mesh position={[0, DISC_HEIGHT + stackGap / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[DISC_RADIUS * 0.75, 0.025, 8, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...CROWN_MAT} transparent />
      </mesh>
      <mesh position={[0, DISC_HEIGHT + stackGap + DISC_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[DISC_RADIUS * 0.9, DISC_RADIUS * 0.9, DISC_HEIGHT, RADIAL_SEGMENTS]}
        />
        <meshStandardMaterial {...mat} transparent />
      </mesh>
      <mesh position={[0, totalBase + 0.04, 0]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshStandardMaterial {...CROWN_MAT} transparent />
      </mesh>
    </group>
  );
}
