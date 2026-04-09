import { create } from 'zustand';
import type { Square } from '../engine/types';
import { applyMoveToFen } from '../utils/fenUtils';

/** Matches Piece.tsx MOVE_DURATION (1.5s) plus a small buffer for settling. */
const MOVE_ANIMATION_MS = 1600;

/** Arrow drawn on board during tutorial (from → to, optional color) */
export interface TutorialArrow {
  from: Square;
  to: Square;
  color?: string;
}

/** Snapshot of the main chess store used to restore state after exiting tutorial */
export interface TutorialChessSnapshot {
  fen: string;
  // We intentionally snapshot only visible state. When restoring, the board
  // simply re-reads from the chess store because we never mutated it.
}

/** Starting FEN used as default tutorial canvas */
export const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Empty board with just the two kings (minimal legal position for demos) */
export const EMPTY_FEN_KINGS_ONLY = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';

interface TutorialState {
  /** Whether tutorial mode is active — when true, the 3D board renders tutorial data */
  isActive: boolean;
  /** Currently displayed chapter id */
  currentChapterId: string | null;
  /** Displayed FEN position (source for Board + PieceSet while active) */
  fen: string;
  /** Highlighted squares (soft outline) */
  highlights: Square[];
  /** Arrows drawn on the board */
  arrows: TutorialArrow[];
  /** Last move indicator during tutorial (for animated move highlight) */
  lastMove: { from: Square; to: Square } | null;
  /** Snapshot of the main game state captured when entering tutorial */
  snapshot: TutorialChessSnapshot | null;
}

interface TutorialActions {
  /** Enter tutorial mode, save snapshot of current chess store */
  enter: (snapshot: TutorialChessSnapshot) => void;
  /** Exit tutorial mode and clear overlays */
  exit: () => void;
  /** Set current chapter id */
  setChapter: (id: string | null) => void;
  /** Set displayed FEN */
  setPosition: (fen: string) => void;
  /** Set highlighted squares */
  setHighlights: (squares: Square[]) => void;
  /** Set arrows */
  setArrows: (arrows: TutorialArrow[]) => void;
  /** Set last move (for highlight) */
  setLastMove: (move: { from: Square; to: Square } | null) => void;
  /** Reset position/highlights/arrows/lastMove but keep tutorial active */
  resetDisplay: (fen?: string) => void;
  /**
   * Animate a piece from one square to another by rewriting the tutorial FEN.
   * Resolves after the visual animation completes (~1.6s). No legality check.
   */
  playMove: (from: Square, to: Square) => Promise<void>;
}

const INITIAL_STATE: TutorialState = {
  isActive: false,
  currentChapterId: null,
  fen: STARTING_FEN,
  highlights: [],
  arrows: [],
  lastMove: null,
  snapshot: null,
};

/**
 * Tutorial store — holds standalone state used by the Rules/Tutorial feature.
 *
 * When `isActive` is true, components that display the board (see
 * `useDisplayedBoardState`) read from this store instead of the main
 * `useChessStore`. This lets the tutorial take over the 3D board without
 * mutating the underlying chess engine.
 */
export const useTutorialStore = create<TutorialState & TutorialActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    enter(snapshot) {
      set({
        isActive: true,
        snapshot,
        fen: STARTING_FEN,
        highlights: [],
        arrows: [],
        lastMove: null,
      });
    },

    exit() {
      set({ ...INITIAL_STATE });
    },

    setChapter(id) {
      set({ currentChapterId: id });
    },

    setPosition(fen) {
      set({ fen });
    },

    setHighlights(squares) {
      set({ highlights: squares });
    },

    setArrows(arrows) {
      set({ arrows });
    },

    setLastMove(move) {
      set({ lastMove: move });
    },

    resetDisplay(fen) {
      set((state) => ({
        fen: fen ?? state.fen,
        highlights: [],
        arrows: [],
        lastMove: null,
      }));
    },

    async playMove(from, to) {
      const state = get();
      if (!state.isActive) return;
      const newFen = applyMoveToFen(state.fen, from, to);
      // If the move was a no-op (empty source), skip the animation wait
      if (newFen === state.fen) return;
      set({ fen: newFen, lastMove: { from, to } });
      await new Promise<void>((resolve) => {
        setTimeout(resolve, MOVE_ANIMATION_MS);
      });
    },
  }),
);
