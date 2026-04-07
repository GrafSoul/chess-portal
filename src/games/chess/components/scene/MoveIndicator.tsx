import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Square } from '../../engine/types';
import { squareTo3D } from '../../utils/boardCoords';

interface MoveIndicatorProps {
  squares: Square[];
}

/** Small pulsating dots on legal move target squares */
export function MoveIndicator({ squares }: MoveIndicatorProps) {
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
