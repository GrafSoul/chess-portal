import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Square } from '../../engine/types';
import { isLightSquare } from '../../utils/boardCoords';

interface BoardSquareProps {
  row: number;
  col: number;
  square: Square;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onClick: (square: Square) => void;
}

const LIGHT_COLOR = '#c8b898';
const DARK_COLOR = '#0d0d0d';
const SELECTED_COLOR = '#fbbf24';
const LEGAL_MOVE_COLOR = '#22c55e';
const LAST_MOVE_COLOR = '#6366f1';
const CHECK_COLOR = '#ef4444';

/** Single board square with highlight states */
export function BoardSquare({
  row,
  col,
  square,
  isSelected,
  isLegalMove,
  isLastMove,
  isCheck,
  onClick,
}: BoardSquareProps) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const isLight = isLightSquare(row, col);

  const x = col - 3.5;
  const z = row - 3.5;

  const baseColor = isLight ? LIGHT_COLOR : DARK_COLOR;

  // Determine highlight color
  const highlightColor = useMemo(() => {
    if (isCheck) return CHECK_COLOR;
    if (isSelected) return SELECTED_COLOR;
    if (isLastMove) return LAST_MOVE_COLOR;
    return null;
  }, [isCheck, isSelected, isLastMove]);

  // Animate glow opacity for legal moves
  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as { opacity: number };
    const target = isLegalMove ? 0.5 : 0;
    mat.opacity += (target - mat.opacity) * Math.min(delta * 8, 1);
  });

  return (
    <group position={[x, 0, z]}>
      {/* Base square */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick(square);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = isLegalMove ? 'pointer' : 'default';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={[0.96, 0.96]} />
        <meshStandardMaterial
          color={highlightColor ?? baseColor}
          roughness={isLight ? 0.7 : 0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Legal move glow overlay */}
      <mesh
        ref={glowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, 0]}
      >
        <planeGeometry args={[0.96, 0.96]} />
        <meshBasicMaterial
          color={LEGAL_MOVE_COLOR}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
