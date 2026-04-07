import { useMemo, Suspense } from 'react';
import { Board } from './Board';
import { PieceSet } from './PieceSet';
import { MoveIndicator } from './MoveIndicator';
import { CapturedPieces } from './CapturedPieces';
import { ChessLighting } from './ChessLighting';
import { ChessEnvironment } from './ChessEnvironment';
import { useChessStore } from '../../stores/useChessStore';
import type { Square } from '../../engine/types';

/** Root 3D chess scene — connects store to visual components */
export function ChessScene() {
  const fen = useChessStore((s) => s.fen);
  const turn = useChessStore((s) => s.turn);
  const selectedSquare = useChessStore((s) => s.selectedSquare);
  const legalMoves = useChessStore((s) => s.legalMoves);
  const lastMove = useChessStore((s) => s.lastMove);
  const isCheck = useChessStore((s) => s.isCheck);
  const capturedPieces = useChessStore((s) => s.capturedPieces);
  const selectSquare = useChessStore((s) => s.selectSquare);
  const getEngine = useChessStore((s) => s.getEngine);

  // Find king square if in check
  const checkSquare = useMemo((): Square | null => {
    if (!isCheck) return null;
    const engine = getEngine();
    const board = engine.getBoard();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return String.fromCharCode(97 + col) + (8 - row) as Square;
        }
      }
    }
    return null;
  }, [isCheck, turn, getEngine, fen]);

  return (
    <>
      <ChessEnvironment />
      <ChessLighting />

      <Board
        selectedSquare={selectedSquare}
        legalMoves={legalMoves}
        lastMove={lastMove}
        checkSquare={checkSquare}
        onSquareClick={selectSquare}
      />

      <PieceSet
        fen={fen}
        onPieceClick={selectSquare}
      />

      <MoveIndicator squares={legalMoves} />

      {/* Physics zone for captured pieces */}
      {capturedPieces.length > 0 && (
        <Suspense fallback={null}>
          <CapturedPieces pieces={capturedPieces} />
        </Suspense>
      )}
    </>
  );
}
