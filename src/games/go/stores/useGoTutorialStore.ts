/**
 * Zustand store for the Go tutorial / rules panel.
 *
 * When `isActive` is `true`, the display-state hook routes board rendering
 * from this store instead of the main game store. This lets the tutorial
 * take over the 3D board without mutating the live game engine.
 *
 * The store holds a standalone `Board` matrix, highlight points, arrows,
 * and actions to animate stone placements during looped demonstrations.
 *
 * @module
 */

import { create } from 'zustand';
import type { Board, Point, Stone } from '../engine/types';
import type { GoTutorialArrow } from '../tutorial/tutorialChapters';
import { parseGoBoard, emptyBoard } from '../tutorial/boardNotation';
import { cloneBoard } from '../utils/groupUtils';

/** Duration of the GoStone drop animation (ms) + buffer for visual settling. */
const PLACEMENT_ANIMATION_MS = 500;

/** State shape for the Go tutorial store. */
interface GoTutorialState {
  /** Whether tutorial mode is active (overrides the game board). */
  isActive: boolean;
  /** Currently displayed chapter id. */
  currentChapterId: string | null;
  /** Board matrix currently rendered by the tutorial. */
  board: Board;
  /** Board dimension for the tutorial (always 9). */
  boardSize: 9;
  /** Points highlighted on the board (soft glow). */
  highlights: Point[];
  /** Arrows drawn on the board. */
  arrows: GoTutorialArrow[];
  /**
   * Incremented on snap-reset to force GoStoneSet remount (skip animation).
   * React keys include this so stones appear instantly on board reset.
   */
  snapKey: number;
}

/** Actions for the Go tutorial store. */
interface GoTutorialActions {
  /** Enter tutorial mode. */
  enter: () => void;
  /** Exit tutorial mode and restore game board display. */
  exit: () => void;
  /** Set the current chapter id. */
  setChapter: (id: string | null) => void;
  /** Set the displayed board from a compact notation string. */
  setBoard: (notation: string) => void;
  /** Set highlighted points. */
  setHighlights: (points: Point[]) => void;
  /** Set arrows. */
  setArrows: (arrows: GoTutorialArrow[]) => void;
  /** Reset board and overlays but keep tutorial active. */
  resetDisplay: (notation?: string) => void;
  /** Snap-reset board (no animation). */
  snapBoard: (notation: string) => void;
  /**
   * Place a stone on the tutorial board and optionally remove captured stones.
   * Resolves after the placement animation completes.
   *
   * @param point - Where to place the stone.
   * @param color - Stone color to place.
   * @param captures - Points to remove after placement (captures).
   * @returns Promise that resolves when the animation has completed.
   */
  placeStone: (point: Point, color: Stone, captures?: Point[]) => Promise<void>;
}

const EMPTY_9X9 = emptyBoard(9);

const INITIAL_STATE: GoTutorialState = {
  isActive: false,
  currentChapterId: null,
  board: EMPTY_9X9,
  boardSize: 9,
  highlights: [],
  arrows: [],
  snapKey: 0,
};

/**
 * Tutorial store for Go — holds standalone board state used by the
 * Rules/Tutorial feature.
 *
 * When `isActive` is true, the display-state hook reads from this store
 * instead of the main `useGoStore`, so the 3D board shows tutorial
 * positions without touching the live game.
 *
 * @returns Combined state (`GoTutorialState`) and actions (`GoTutorialActions`).
 *
 * @example
 * ```tsx
 * // Read a state slice
 * const isActive = useGoTutorialStore((s) => s.isActive);
 *
 * // Call an action
 * const enter = useGoTutorialStore((s) => s.enter);
 * enter();
 *
 * // Shallow selector for multiple values
 * const { highlights, arrows } = useGoTutorialStore(
 *   (s) => ({ highlights: s.highlights, arrows: s.arrows }),
 *   shallow,
 * );
 * ```
 */
export const useGoTutorialStore = create<GoTutorialState & GoTutorialActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    enter() {
      set({
        isActive: true,
        board: EMPTY_9X9,
        boardSize: 9,
        highlights: [],
        arrows: [],
        snapKey: 0,
      });
    },

    exit() {
      set({ ...INITIAL_STATE });
    },

    setChapter(id) {
      set({ currentChapterId: id });
    },

    setBoard(notation) {
      set({ board: parseGoBoard(notation) });
    },

    setHighlights(points) {
      set({ highlights: points });
    },

    setArrows(arrows) {
      set({ arrows: arrows });
    },

    resetDisplay(notation) {
      set({
        board: notation ? parseGoBoard(notation) : EMPTY_9X9,
        highlights: [],
        arrows: [],
      });
    },

    snapBoard(notation) {
      set((state) => ({
        board: parseGoBoard(notation),
        snapKey: state.snapKey + 1,
      }));
    },

    async placeStone(point, color, captures = []) {
      const state = get();
      if (!state.isActive) return;

      // Place the stone on the board
      const newBoard = cloneBoard(state.board);
      newBoard[point.y][point.x] = color;
      set({ board: newBoard });

      // Wait for the GoStone drop animation to complete
      await new Promise<void>((resolve) => {
        setTimeout(resolve, PLACEMENT_ANIMATION_MS);
      });

      // Remove captured stones after placement animation
      if (captures.length > 0) {
        const currentBoard = cloneBoard(get().board);
        for (const cap of captures) {
          currentBoard[cap.y][cap.x] = null;
        }
        set({ board: currentBoard });
        // Brief pause so the capture registers visually
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 200);
        });
      }
    },
  }),
);
