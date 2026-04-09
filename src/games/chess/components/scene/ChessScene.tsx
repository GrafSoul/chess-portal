import { useMemo, Suspense } from 'react';
import { Board } from './Board';
import { PieceSet } from './PieceSet';
import { MoveIndicator } from './MoveIndicator';
import { CapturedPieces } from './CapturedPieces';
import { ChessLighting } from './ChessLighting';
import { ChessEnvironment } from './ChessEnvironment';
import { TutorialOverlay } from './TutorialOverlay';
import { useChessStore } from '../../stores/useChessStore';
import { useDisplayedBoardState } from '../../hooks/useDisplayedBoardState';
import type { Square } from '../../engine/types';

/** Root 3D chess scene — connects store (or tutorial) to visual components */
export function ChessScene() {
  const display = useDisplayedBoardState();
  const turn = useChessStore((s) => s.turn);
  const isCheck = useChessStore((s) => s.isCheck);
  const capturedPieces = useChessStore((s) => s.capturedPieces);
  const selectSquare = useChessStore((s) => s.selectSquare);
  const getEngine = useChessStore((s) => s.getEngine);

  // Find king square if in check (only meaningful when not in tutorial)
  const checkSquare = useMemo((): Square | null => {
    if (display.tutorialActive) return null;
    if (!isCheck) return null;
    const engine = getEngine();
    const board = engine.getBoard();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return (String.fromCharCode(97 + col) + (8 - row)) as Square;
        }
      }
    }
    return null;
  }, [isCheck, turn, getEngine, display.tutorialActive]);

  // No-op click handler while in tutorial mode — board is non-interactive
  const handleSquareClick = display.interactive ? selectSquare : () => {};

  return (
    <>
      <ChessEnvironment />
      <ChessLighting />

      <Board
        selectedSquare={display.selectedSquare}
        legalMoves={display.legalMoves}
        lastMove={display.lastMove}
        checkSquare={checkSquare}
        onSquareClick={handleSquareClick}
      />

      <PieceSet
        fen={display.fen}
        onPieceClick={handleSquareClick}
      />

      <MoveIndicator squares={display.legalMoves} />

      {/* Tutorial overlays — highlights & arrows (no-op when inactive) */}
      <TutorialOverlay />

      {/* Physics zone for captured pieces — hidden in tutorial mode */}
      {!display.tutorialActive && capturedPieces.length > 0 && (
        <Suspense fallback={null}>
          <CapturedPieces pieces={capturedPieces} />
        </Suspense>
      )}
    </>
  );
}
