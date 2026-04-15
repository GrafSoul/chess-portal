import { useCheckersStore } from '../stores/useCheckersStore';
import { useCheckersTutorialStore } from '../stores/useCheckersTutorialStore';
import type { Square } from '../engine/types';

/** Shape of data consumed by the 3D board components */
export interface CheckersDisplayedBoardState {
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
  /** Changes on snap-reset to force PieceSet remount (skip animation) */
  snapKey: number;
}

/**
 * Unified selector that routes board rendering data from either the live
 * checkers store or the tutorial store depending on whether tutorial mode
 * is active.
 *
 * This keeps every board-rendering component (Board, PieceSet, MoveIndicator,
 * CheckersScene) agnostic of the data source.
 *
 * @returns Current board display state
 */
export function useCheckersDisplayedBoardState(): CheckersDisplayedBoardState {
  const tutorialActive = useCheckersTutorialStore((s) => s.isActive);
  const tutorialFen = useCheckersTutorialStore((s) => s.fen);
  const tutorialLastMove = useCheckersTutorialStore((s) => s.lastMove);
  const tutorialSnapKey = useCheckersTutorialStore((s) => s.snapKey);

  const checkersFen = useCheckersStore((s) => s.fen);
  const checkersSelected = useCheckersStore((s) => s.selectedSquare);
  const checkersLegalMoves = useCheckersStore((s) => s.legalMoves);
  const checkersLastMove = useCheckersStore((s) => s.lastMove);
  const gameStatus = useCheckersStore((s) => s.gameStatus);
  const isAIThinking = useCheckersStore((s) => s.isAIThinking);

  if (tutorialActive) {
    return {
      fen: tutorialFen,
      selectedSquare: null,
      legalMoves: [],
      lastMove: tutorialLastMove,
      interactive: false,
      tutorialActive: true,
      snapKey: tutorialSnapKey,
    };
  }

  const isInteractive =
    !isAIThinking && (gameStatus === 'idle' || gameStatus === 'playing');

  return {
    fen: checkersFen,
    selectedSquare: checkersSelected,
    legalMoves: checkersLegalMoves,
    lastMove: checkersLastMove,
    interactive: isInteractive,
    tutorialActive: false,
    snapKey: 0,
  };
}
