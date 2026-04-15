import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { CheckersBoardSquare } from './CheckersBoardSquare';
import type { Square } from '../../engine/types';

interface CheckersBoardProps {
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  onSquareClick: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const FONT_SIZE = 0.2;
const LABEL_Y = 0.001;
const LABEL_COLOR = '#a09080';
const LABEL_OFFSET = 4.2;

/** 8x8 checkers board with frame and coordinate labels */
export function CheckersBoard({
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
}: CheckersBoardProps) {
  const squares = useMemo(() => {
    const result: { row: number; col: number; square: Square; isDark: boolean }[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square: Square = String.fromCharCode(97 + col) + (row + 1);
        const isDark = (row + col) % 2 === 1;
        result.push({ row, col, square, isDark });
      }
    }
    return result;
  }, []);

  const legalMoveSet = useMemo(() => new Set(legalMoves), [legalMoves]);
  const lastMoveSet = useMemo(
    () => new Set(lastMove ? [lastMove.from, lastMove.to] : []),
    [lastMove],
  );

  return (
    <group>
      {/* Board frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[8.8, 8.8]} />
        <meshStandardMaterial color="#1a1210" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Squares */}
      {squares.map(({ row, col, square, isDark }) => (
        <CheckersBoardSquare
          key={square}
          row={row}
          col={col}
          square={square}
          isSelected={selectedSquare === square}
          isLegalMove={legalMoveSet.has(square)}
          isLastMove={lastMoveSet.has(square)}
          isDark={isDark}
          onClick={onSquareClick}
        />
      ))}

      {/* Coordinate labels */}
      {FILES.map((file, i) => {
        const x = i - 3.5;
        return (
          <group key={`file-${file}`}>
            <Text position={[x, LABEL_Y, -LABEL_OFFSET]} rotation={[-Math.PI / 2, 0, 0]}
              fontSize={FONT_SIZE} color={LABEL_COLOR} anchorX="center" anchorY="middle">
              {file}
            </Text>
            <Text position={[x, LABEL_Y, LABEL_OFFSET]} rotation={[-Math.PI / 2, 0, 0]}
              fontSize={FONT_SIZE} color={LABEL_COLOR} anchorX="center" anchorY="middle">
              {file}
            </Text>
          </group>
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const z = i - 3.5;
        const rank = String(i + 1);
        return (
          <group key={`rank-${rank}`}>
            <Text position={[-LABEL_OFFSET, LABEL_Y, z]} rotation={[-Math.PI / 2, 0, 0]}
              fontSize={FONT_SIZE} color={LABEL_COLOR} anchorX="center" anchorY="middle">
              {rank}
            </Text>
            <Text position={[LABEL_OFFSET, LABEL_Y, z]} rotation={[-Math.PI / 2, 0, 0]}
              fontSize={FONT_SIZE} color={LABEL_COLOR} anchorX="center" anchorY="middle">
              {rank}
            </Text>
          </group>
        );
      })}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
    </group>
  );
}
