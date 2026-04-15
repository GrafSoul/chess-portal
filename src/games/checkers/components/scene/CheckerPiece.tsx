import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import type { PieceType, PieceColor, Square } from '../../engine/types';

/** Convert checkers square (e.g. 'a1') to 3D position [x, y, z] */
function squareTo3D(square: Square): [number, number, number] {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return [file - 4 + 0.5, 0, rank - 4 + 0.5];
}

interface CheckerPieceProps {
  /** man or king */
  type: PieceType;
  /** w or b */
  color: PieceColor;
  /** Algebraic square */
  square: Square;
  /** Click handler */
  onClick: (square: Square) => void;
}

/** White checker material */
const WHITE_MAT = { color: '#f5e6d0', roughness: 0.35, metalness: 0.05 };
/** Black checker material */
const BLACK_MAT = { color: '#2a1a0e', roughness: 0.4, metalness: 0.1 };
/** Gold accent for king crown ring */
const CROWN_MAT = { color: '#d4a017', roughness: 0.3, metalness: 0.6 };

/** Checker disc radius */
const DISC_RADIUS = 0.38;
/** Disc height (thickness) */
const DISC_HEIGHT = 0.1;
/** Bevel segments for smoother disc edge */
const RADIAL_SEGMENTS = 32;

/** Arc height for animation */
const ARC_HEIGHT_MAN = 0.5;
const ARC_HEIGHT_KING = 0.7;
/** Animation duration in seconds */
const MOVE_DURATION = 1.2;

/**
 * 3D checker piece with arc-flight animation.
 *
 * Man = single flat cylinder with a beveled edge.
 * King = two stacked discs with a gold crown ring between them.
 *
 * When the `square` prop changes, the piece animates along a parabolic arc
 * from its previous position to the new one.
 */
export function CheckerPiece({ type, color, square, onClick }: CheckerPieceProps) {
  const groupRef = useRef<Group>(null);
  const mat = color === 'w' ? WHITE_MAT : BLACK_MAT;

  const [tx, , tz] = useMemo(() => squareTo3D(square), [square]);

  const prevTargetRef = useRef<{ x: number; z: number } | null>(null);

  const animRef = useRef({
    fromX: tx,
    fromZ: tz,
    toX: tx,
    toZ: tz,
    progress: 1,
    arcHeight: type === 'king' ? ARC_HEIGHT_KING : ARC_HEIGHT_MAN,
  });

  useEffect(() => {
    const anim = animRef.current;
    const group = groupRef.current;
    if (!group) return;

    if (prevTargetRef.current === null) {
      group.position.set(tx, 0.01, tz);
      prevTargetRef.current = { x: tx, z: tz };
      return;
    }

    const fromX = prevTargetRef.current.x;
    const fromZ = prevTargetRef.current.z;
    const dx = tx - fromX;
    const dz = tz - fromZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.01) {
      anim.fromX = fromX;
      anim.fromZ = fromZ;
      anim.toX = tx;
      anim.toZ = tz;
      anim.arcHeight = Math.max(0.4, dist * 0.2 + (type === 'king' ? 0.35 : 0.25));
      anim.progress = 0;
      group.position.set(fromX, 0.01, fromZ);
    }

    prevTargetRef.current = { x: tx, z: tz };
  }, [tx, tz, type]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const anim = animRef.current;
    if (!group || anim.progress >= 1) return;

    anim.progress = Math.min(1, anim.progress + delta / MOVE_DURATION);

    const t = anim.progress;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const x = THREE.MathUtils.lerp(anim.fromX, anim.toX, ease);
    const z = THREE.MathUtils.lerp(anim.fromZ, anim.toZ, ease);
    const arcT = 4 * ease * (1 - ease);
    const y = 0.01 + arcT * anim.arcHeight;

    group.position.set(x, y, z);
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick(square);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {type === 'man' ? <ManGeometry mat={mat} /> : <KingGeometry mat={mat} />}
    </group>
  );
}

interface MatProps {
  color: string;
  roughness: number;
  metalness: number;
}

/** Single flat disc with a subtle groove ring on top */
function ManGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      {/* Main disc */}
      <mesh position={[0, DISC_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Top groove ring — subtle decoration */}
      <mesh position={[0, DISC_HEIGHT + 0.001, 0]} castShadow>
        <torusGeometry args={[DISC_RADIUS * 0.6, 0.015, 8, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...mat} roughness={mat.roughness + 0.1} />
      </mesh>
    </group>
  );
}

/** Two stacked discs with a gold crown ring between them */
function KingGeometry({ mat }: { mat: MatProps }) {
  const stackGap = 0.02;
  const totalBase = DISC_HEIGHT + stackGap + DISC_HEIGHT;

  return (
    <group>
      {/* Bottom disc */}
      <mesh position={[0, DISC_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_HEIGHT, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Crown ring between discs */}
      <mesh
        position={[0, DISC_HEIGHT + stackGap / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[DISC_RADIUS * 0.75, 0.025, 8, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...CROWN_MAT} />
      </mesh>
      {/* Top disc */}
      <mesh
        position={[0, DISC_HEIGHT + stackGap + DISC_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[DISC_RADIUS * 0.9, DISC_RADIUS * 0.9, DISC_HEIGHT, RADIAL_SEGMENTS]}
        />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Top crown symbol — small gold sphere */}
      <mesh position={[0, totalBase + 0.04, 0]} castShadow>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshStandardMaterial {...CROWN_MAT} />
      </mesh>
    </group>
  );
}
