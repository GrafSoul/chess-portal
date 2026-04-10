import { useMemo } from 'react';
import { BoardSquare } from './BoardSquare';
import { BoardLabels } from './BoardLabels';
import type { Square } from '../../engine/types';

interface BoardProps {
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkSquare: Square | null;
  onSquareClick: (square: Square) => void;
}

/** 8x8 chess board with frame */
export function Board({
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare,
  onSquareClick,
}: BoardProps) {
  const squares = useMemo(() => {
    const result: { row: number; col: number; square: Square }[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square: Square = String.fromCharCode(97 + col) + (row + 1);
        result.push({ row, col, square });
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
      {squares.map(({ row, col, square }) => (
        <BoardSquare
          key={square}
          row={row}
          col={col}
          square={square}
          isSelected={selectedSquare === square}
          isLegalMove={legalMoveSet.has(square)}
          isLastMove={lastMoveSet.has(square)}
          isCheck={checkSquare === square}
          onClick={onSquareClick}
        />
      ))}

      {/* Coordinate labels (a–h, 1–8) on the frame */}
      <BoardLabels />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
    </group>
  );
}
