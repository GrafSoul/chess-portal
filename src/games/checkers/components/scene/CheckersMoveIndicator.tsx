import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Square } from '../../engine/types';

interface CheckersMoveIndicatorProps {
  squares: Square[];
}

/** Convert checkers square to 3D position */
function squareTo3D(square: Square): [number, number, number] {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return [file - 4 + 0.5, 0, rank - 4 + 0.5];
}

/** Pulsating dots on legal move target squares */
export function CheckersMoveIndicator({ squares }: CheckersMoveIndicatorProps) {
  return (
    <group>
      {squares.map((sq) => (
        <Dot key={sq} square={sq} />
      ))}
    </group>
  );
}

function Dot({ square }: { square: Square }) {
  const ref = useRef<Mesh>(null);
  const [x, , z] = squareTo3D(square);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.15;
    ref.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={ref} position={[x, 0.015, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.12, 16]} />
      <meshBasicMaterial color="#22c55e" transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}
