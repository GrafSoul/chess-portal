import { create } from 'zustand';
import type { Square } from '../engine/types';
import { applyMoveToFen, setPieceAtSquare } from '../utils/fenUtils';

/** Matches Piece.tsx MOVE_DURATION (1.5s) plus a small buffer for settling. */
const MOVE_ANIMATION_MS = 1600;

/** Pause after a promotion swap so the transformed piece is clearly visible. */
const PROMOTION_SETTLE_MS = 600;

/** Optional move modifiers used by tutorial demonstrations. */
export interface TutorialMoveOptions {
  /**
   * Promotion target piece type. When set, after the primary move animation
   * completes, the arriving piece is replaced with this type on its landing
   * square (preserving color).
   */
  promote?: 'q' | 'r' | 'b' | 'n';
  /**
   * Additional move applied simultaneously with the primary one — used for
   * castling, where the king move is the primary and the rook move is `with`.
   */
  with?: { from: Square; to: Square };
}

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
   *
   * Options support two special cases:
   * - `with`: a paired move applied simultaneously with the primary — used to
   *   move the rook when the king castles.
   * - `promote`: after the primary animation finishes, replaces the arriving
   *   piece with a queen/rook/bishop/knight of the same color on its landing
   *   square, then pauses briefly so the transformation is visible.
   */
  playMove: (
    from: Square,
    to: Square,
    options?: TutorialMoveOptions,
  ) => Promise<void>;
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

    async playMove(from, to, options = {}) {
      const state = get();
      if (!state.isActive) return;

      // Stage 1: primary move (+ optional paired move for castling). Both are
      // committed in a single state update so PieceSet's closest-match piece
      // tracking animates both pieces simultaneously.
      let nextFen = applyMoveToFen(state.fen, from, to);
      if (nextFen === state.fen) return;
      if (options.with) {
        nextFen = applyMoveToFen(nextFen, options.with.from, options.with.to);
      }
      set({ fen: nextFen, lastMove: { from, to } });

      await new Promise<void>((resolve) => {
        setTimeout(resolve, MOVE_ANIMATION_MS);
      });

      // Stage 2: promotion swap — after the pawn has visibly arrived, rewrite
      // the landing square to hold the target piece of the same color. Done
      // as a separate state update so the user sees the transformation.
      if (options.promote) {
        // Determine color from the piece currently on the destination square
        const parts = get().fen.split(' ');
        const grid = parts[0] ?? '';
        const isWhite = /[A-Z]/.test(
          (() => {
            // Re-derive the piece via a minimal FEN probe — safer than
            // tracking color separately.
            const rows = grid.split('/');
            const rank = Number(to[1]);
            const file = to.charCodeAt(0) - 97;
            const row = rows[8 - rank] ?? '';
            // Decode the row to find the character at `file`
            let col = 0;
            for (const ch of row) {
              if (ch >= '0' && ch <= '9') {
                col += Number(ch);
              } else {
                if (col === file) return ch;
                col++;
              }
            }
            return '';
          })(),
        );
        const pieceChar = isWhite
          ? options.promote.toUpperCase()
          : options.promote.toLowerCase();
        const promotedFen = setPieceAtSquare(get().fen, to, pieceChar);
        set({ fen: promotedFen });
        await new Promise<void>((resolve) => {
          setTimeout(resolve, PROMOTION_SETTLE_MS);
        });
      }
    },
  }),
);
