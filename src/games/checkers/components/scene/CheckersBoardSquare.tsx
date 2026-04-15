import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Square } from '../../engine/types';
import { useCheckersSettingsStore } from '../../stores/useCheckersSettingsStore';
import { lightnessToHex } from '../../../../core/utils/grayscale';

interface CheckersBoardSquareProps {
  row: number;
  col: number;
  square: Square;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isDark: boolean;
  onClick: (square: Square) => void;
}

const LIGHT_COLOR = '#c8b898';
const SELECTED_COLOR = '#fbbf24';
const LEGAL_MOVE_COLOR = '#22c55e';
const LAST_MOVE_COLOR = '#6366f1';

/** Single checkers board square with highlight states */
export function CheckersBoardSquare({
  row,
  col,
  square,
  isSelected,
  isLegalMove,
  isLastMove,
  isDark,
  onClick,
}: CheckersBoardSquareProps) {
  const glowRef = useRef<Mesh>(null);
  const darkSquareLightness = useCheckersSettingsStore((s) => s.darkSquareLightness);

  const x = col - 3.5;
  const z = row - 3.5;

  const baseColor = isDark ? lightnessToHex(darkSquareLightness) : LIGHT_COLOR;

  const highlightColor = useMemo(() => {
    if (isSelected) return SELECTED_COLOR;
    if (isLastMove) return LAST_MOVE_COLOR;
    return null;
  }, [isSelected, isLastMove]);

  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material as { opacity: number };
    const target = isLegalMove ? 0.5 : 0;
    mat.opacity += (target - mat.opacity) * Math.min(delta * 8, 1);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh
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
          roughness={isDark ? 0.85 : 0.7}
          metalness={0.05}
        />
      </mesh>

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
