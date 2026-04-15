import { create } from 'zustand';
import type { Square } from '../engine/types';
import { applyCheckersMoveToFen, removePiecesFromFen, type CheckersMoveOptions } from '../utils/fenUtils';

/** Matches CheckerPiece.tsx MOVE_DURATION (1.2s) plus a small buffer. */
const MOVE_ANIMATION_MS = 1400;

/** Arrow drawn on board during tutorial (from -> to, optional color) */
export interface CheckersTutorialArrow {
  from: Square;
  to: Square;
  color?: string;
}

/** Snapshot of the main checkers store used to restore state after exiting tutorial */
export interface CheckersTutorialSnapshot {
  /** FEN of the game at the moment tutorial was opened */
  fen: string;
}

/** Initial checkers FEN */
export const CHECKERS_INITIAL_FEN =
  'b1b1b1b1/1b1b1b1b/b1b1b1b1/8/8/1w1w1w1w/w1w1w1w1/1w1w1w1w w';

interface CheckersTutorialState {
  /** Whether tutorial mode is active */
  isActive: boolean;
  /** Currently displayed chapter id */
  currentChapterId: string | null;
  /** Displayed FEN position (source for Board + PieceSet while active) */
  fen: string;
  /** Highlighted squares (soft outline) */
  highlights: Square[];
  /** Arrows drawn on the board */
  arrows: CheckersTutorialArrow[];
  /** Last move indicator during tutorial */
  lastMove: { from: Square; to: Square } | null;
  /** Snapshot of the main game state captured when entering tutorial */
  snapshot: CheckersTutorialSnapshot | null;
  /** Incremented on snap-reset to force PieceSet remount (no animation) */
  snapKey: number;
}

interface CheckersTutorialActions {
  /** Enter tutorial mode, save snapshot of current checkers store */
  enter: (snapshot: CheckersTutorialSnapshot) => void;
  /** Exit tutorial mode and clear overlays */
  exit: () => void;
  /** Set current chapter id */
  setChapter: (id: string | null) => void;
  /** Set displayed FEN */
  setPosition: (fen: string) => void;
  /** Set highlighted squares */
  setHighlights: (squares: Square[]) => void;
  /** Set arrows */
  setArrows: (arrows: CheckersTutorialArrow[]) => void;
  /** Set last move (for highlight) */
  setLastMove: (move: { from: Square; to: Square } | null) => void;
  /** Reset position/highlights/arrows/lastMove but keep tutorial active */
  resetDisplay: (fen?: string) => void;
  /** Snap-reset position (no animation) — increments snapKey to force PieceSet remount */
  snapPosition: (fen: string) => void;
  /**
   * Animate a piece from one square to another by rewriting the tutorial FEN.
   * Resolves after the visual animation completes (~1.4s).
   *
   * @param from Origin square
   * @param to Destination square
   * @param options Captures and crowning options
   */
  playMove: (
    from: Square,
    to: Square,
    options?: CheckersMoveOptions,
  ) => Promise<void>;
}

const INITIAL_STATE: CheckersTutorialState = {
  isActive: false,
  currentChapterId: null,
  fen: CHECKERS_INITIAL_FEN,
  highlights: [],
  arrows: [],
  lastMove: null,
  snapshot: null,
  snapKey: 0,
};

/**
 * Tutorial store for checkers — holds standalone state used by the
 * Rules/Tutorial feature.
 *
 * When `isActive` is true, components that display the board read from
 * this store instead of the main `useCheckersStore`. This lets the tutorial
 * take over the 3D board without mutating the underlying game engine.
 */
export const useCheckersTutorialStore = create<
  CheckersTutorialState & CheckersTutorialActions
>((set, get) => ({
  ...INITIAL_STATE,

  enter(snapshot) {
    set({
      isActive: true,
      snapshot,
      fen: CHECKERS_INITIAL_FEN,
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

  snapPosition(fen) {
    set((state) => ({
      fen,
      lastMove: null,
      snapKey: state.snapKey + 1,
    }));
  },

  async playMove(from, to, options = {}) {
    const state = get();
    if (!state.isActive) return;

    // Phase 1: move piece, keep captured pieces on board during flight
    const moveOnlyFen = applyCheckersMoveToFen(state.fen, from, to, {
      crown: options.crown,
    });
    if (moveOnlyFen === state.fen) return;

    set({ fen: moveOnlyFen, lastMove: { from, to } });

    // Wait for piece to land
    await new Promise<void>((resolve) => {
      setTimeout(resolve, MOVE_ANIMATION_MS);
    });

    // Phase 2: remove captured pieces after landing
    if (options.captures && options.captures.length > 0) {
      const currentFen = get().fen;
      const finalFen = removePiecesFromFen(currentFen, options.captures);
      set({ fen: finalFen });
      // Brief pause so the capture registers visually
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 200);
      });
    }
  },
}));
