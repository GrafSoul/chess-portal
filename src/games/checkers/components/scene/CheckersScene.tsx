import { CheckersBoard } from './CheckersBoard';
import { CheckerPieceSet } from './CheckerPieceSet';
import { CheckersMoveIndicator } from './CheckersMoveIndicator';
import { CheckersLighting } from './CheckersLighting';
import { CheckersEnvironment } from './CheckersEnvironment';
import { CheckersTutorialOverlay } from './CheckersTutorialOverlay';
import { FadingCheckerPiece } from './FadingCheckerPiece';
import { useCheckersStore } from '../../stores/useCheckersStore';
import { useCheckersDisplayedBoardState } from '../../hooks/useCheckersDisplayedBoardState';
import type { Square } from '../../engine/types';

/**
 * Root 3D checkers scene — connects store (or tutorial) to visual components.
 *
 * When tutorial is active, renders tutorial FEN with non-interactive board.
 * Otherwise renders the live game state with full interactivity.
 */
export function CheckersScene() {
  const display = useCheckersDisplayedBoardState();
  const selectSquare = useCheckersStore((s) => s.selectSquare);
  const fadingPieces = useCheckersStore((s) => s.fadingPieces);

  // No-op click handler while in tutorial mode — board is non-interactive
  const handleClick = display.interactive
    ? (sq: Square) => selectSquare(sq)
    : () => {};

  return (
    <>
      <CheckersEnvironment />
      <CheckersLighting />

      <CheckersBoard
        selectedSquare={display.selectedSquare}
        legalMoves={display.legalMoves}
        lastMove={display.lastMove}
        onSquareClick={handleClick}
      />

      <CheckerPieceSet
        key={display.snapKey}
        fen={display.fen}
        onPieceClick={handleClick}
      />

      {/* Captured pieces that linger visually during jump animation */}
      {!display.tutorialActive &&
        fadingPieces.map((fp) => (
          <FadingCheckerPiece
            key={fp.id}
            square={fp.square}
            color={fp.color}
            type={fp.type}
          />
        ))}

      <CheckersMoveIndicator squares={display.legalMoves} />

      {/* Tutorial overlays — highlights & arrows (no-op when inactive) */}
      <CheckersTutorialOverlay />
    </>
  );
}
