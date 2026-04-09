import { useChessStore } from '../stores/useChessStore';
import { useTutorialStore } from '../stores/useTutorialStore';
import type { Square } from '../engine/types';

/** Shape of data consumed by the 3D board components */
export interface DisplayedBoardState {
  /** FEN position to render */
  fen: string;
  /** Currently selected square (always null during tutorial) */
  selectedSquare: Square | null;
  /** Legal move targets for selection (always empty during tutorial) */
  legalMoves: Square[];
  /** Last move — used to highlight origin/target squares */
  lastMove: { from: Square; to: Square } | null;
  /** Whether the board should be interactive (click handlers active) */
  interactive: boolean;
  /** Whether tutorial overlays (highlights/arrows) should render */
  tutorialActive: boolean;
}

/**
 * Unified selector that routes board rendering data from either the live
 * chess store or the tutorial store depending on whether tutorial mode is
 * active.
 *
 * This keeps every board-rendering component (Board, PieceSet, MoveIndicator,
 * ChessScene) agnostic of the data source.
 */
export function useDisplayedBoardState(): DisplayedBoardState {
  const tutorialActive = useTutorialStore((s) => s.isActive);
  const tutorialFen = useTutorialStore((s) => s.fen);
  const tutorialLastMove = useTutorialStore((s) => s.lastMove);

  const chessFen = useChessStore((s) => s.fen);
  const chessSelected = useChessStore((s) => s.selectedSquare);
  const chessLegalMoves = useChessStore((s) => s.legalMoves);
  const chessLastMove = useChessStore((s) => s.lastMove);

  if (tutorialActive) {
    return {
      fen: tutorialFen,
      selectedSquare: null,
      legalMoves: [],
      lastMove: tutorialLastMove,
      interactive: false,
      tutorialActive: true,
    };
  }

  return {
    fen: chessFen,
    selectedSquare: chessSelected,
    legalMoves: chessLegalMoves,
    lastMove: chessLastMove,
    interactive: true,
    tutorialActive: false,
  };
}
