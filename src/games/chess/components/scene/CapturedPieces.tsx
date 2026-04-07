import { useRef, useEffect } from 'react';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import type { CapturedPiece, PieceType } from '../../engine/types';

interface CapturedPiecesProps {
  pieces: CapturedPiece[];
}

const WHITE_MAT = { color: '#e8e0d4', roughness: 0.4, metalness: 0.1 };
const BLACK_MAT = { color: '#1a1210', roughness: 0.5, metalness: 0.15 };

/** Physics zone for captured pieces — they fly off the board with impulse */
export function CapturedPieces({ pieces }: CapturedPiecesProps) {
  return (
    <Physics gravity={[0, -15, 0]}>
      {/* Floor to catch fallen pieces */}
      <RigidBody type="fixed" position={[0, -1, 0]}>
        <CuboidCollider args={[20, 0.5, 20]} />
      </RigidBody>

      {/* Walls to keep pieces nearby */}
      <RigidBody type="fixed" position={[8, 0, 0]}>
        <CuboidCollider args={[0.2, 3, 8]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-8, 0, 0]}>
        <CuboidCollider args={[0.2, 3, 8]} />
      </RigidBody>

      {/* Captured pieces */}
      {pieces.map((p) => (
        <CapturedPieceBody key={`captured-${p.index}`} piece={p} />
      ))}
    </Physics>
  );
}

function CapturedPieceBody({ piece }: { piece: CapturedPiece }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const mat = piece.color === 'w' ? WHITE_MAT : BLACK_MAT;

  // Side where captured pieces fly to: white pieces go right, black go left
  const side = piece.color === 'w' ? 1 : -1;
  const spawnX = side * 5.5;
  const spawnZ = (piece.index % 8) * 0.6 - 2;

  // Apply impulse when piece spawns
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    // Random impulse for variety
    const rx = (Math.random() - 0.5) * 2;
    const ry = 3 + Math.random() * 3;
    const rz = (Math.random() - 0.5) * 2;
    body.applyImpulse({ x: rx, y: ry, z: rz }, true);

    // Random torque for tumbling
    const tx = (Math.random() - 0.5) * 5;
    const ty = (Math.random() - 0.5) * 5;
    const tz = (Math.random() - 0.5) * 5;
    body.applyTorqueImpulse({ x: tx, y: ty, z: tz }, true);
  }, []);

  return (
    <RigidBody
      ref={bodyRef}
      position={[spawnX, 1, spawnZ]}
      colliders="hull"
      restitution={0.3}
      friction={0.8}
      mass={0.5}
    >
      <CapturedPieceGeometry type={piece.type} mat={mat} />
    </RigidBody>
  );
}

function CapturedPieceGeometry({
  type,
  mat,
}: {
  type: PieceType;
  mat: { color: string; roughness: number; metalness: number };
}) {
  // Simplified geometry for physics — just a cylinder
  const height = type === 'p' ? 0.3 : type === 'q' || type === 'k' ? 0.5 : 0.4;
  const radius = type === 'p' ? 0.13 : 0.16;

  return (
    <mesh castShadow>
      <cylinderGeometry args={[radius, radius * 1.2, height, 12]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}
