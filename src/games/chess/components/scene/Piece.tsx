import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import type { PieceType, PieceColor, Square } from '../../engine/types';
import { squareTo3D } from '../../utils/boardCoords';

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  square: Square;
  onClick: (square: Square) => void;
}

const WHITE_MAT = { color: '#e8e0d4', roughness: 0.4, metalness: 0.1 };
const BLACK_MAT = { color: '#1a1210', roughness: 0.5, metalness: 0.15 };

/** Arc height — taller pieces fly higher */
const ARC_HEIGHT: Record<PieceType, number> = {
  p: 0.6,
  n: 1.2,
  b: 0.9,
  r: 0.8,
  q: 1.0,
  k: 0.7,
};

/** Animation duration in seconds */
const MOVE_DURATION = 1.5;

/**
 * Chess piece with arc flight animation.
 * When `square` changes, the piece lifts up in a parabolic arc
 * and lands smoothly on the new position.
 */
export function Piece({ type, color, square, onClick }: PieceProps) {
  const groupRef = useRef<Group>(null);
  const mat = color === 'w' ? WHITE_MAT : BLACK_MAT;

  const [tx, , tz] = useMemo(() => squareTo3D(square), [square]);

  // Tracks the previous target — used to compute "from" before React overwrites position
  const prevTargetRef = useRef<{ x: number; z: number } | null>(null);

  // Animation state stored in refs to avoid re-renders
  const animRef = useRef({
    fromX: tx,
    fromZ: tz,
    toX: tx,
    toZ: tz,
    progress: 1, // 1 = done, 0 = just started
    arcHeight: ARC_HEIGHT[type],
  });

  // When target square changes → start animation
  useEffect(() => {
    const anim = animRef.current;
    const group = groupRef.current;
    if (!group) return;

    // First mount: just place the piece, no animation
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
      anim.arcHeight = Math.max(0.5, dist * 0.25 + ARC_HEIGHT[type] * 0.5);
      anim.progress = 0;
      // Snap visual position back to "from" before animation kicks in
      group.position.set(fromX, 0.01, fromZ);
    }

    prevTargetRef.current = { x: tx, z: tz };
  }, [tx, tz, type]);

  // Animate per frame
  useFrame((_, delta) => {
    const group = groupRef.current;
    const anim = animRef.current;
    if (!group || anim.progress >= 1) return;

    // Advance progress
    anim.progress = Math.min(1, anim.progress + delta / MOVE_DURATION);

    // Smooth easing (ease-in-out cubic)
    const t = anim.progress;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Interpolate X and Z linearly with easing
    const x = THREE.MathUtils.lerp(anim.fromX, anim.toX, ease);
    const z = THREE.MathUtils.lerp(anim.fromZ, anim.toZ, ease);

    // Parabolic arc for Y: peaks at t=0.5
    const arcT = 4 * ease * (1 - ease); // 0 → 1 → 0
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
      {renderPieceGeometry(type, mat)}
    </group>
  );
}

interface MatProps {
  color: string;
  roughness: number;
  metalness: number;
}

function renderPieceGeometry(type: PieceType, mat: MatProps) {
  switch (type) {
    case 'p':
      return <PawnGeometry mat={mat} />;
    case 'r':
      return <RookGeometry mat={mat} />;
    case 'n':
      return <KnightGeometry mat={mat} />;
    case 'b':
      return <BishopGeometry mat={mat} />;
    case 'q':
      return <QueenGeometry mat={mat} />;
    case 'k':
      return <KingGeometry mat={mat} />;
  }
}

function PawnGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

function RookGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.4, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.16, 4]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

function KnightGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.4, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.48, 0.05]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.16, 0.24, 0.24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

function BishopGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 0.4, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.14, 0.32, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

function QueenGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.24, 0.44, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.76, 0]} castShadow>
        <coneGeometry args={[0.06, 0.12, 8]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

function KingGeometry({ mat }: { mat: MatProps }) {
  return (
    <group>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.24, 0.48, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.84, 0]} castShadow>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[0.14, 0.04, 0.04]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}
