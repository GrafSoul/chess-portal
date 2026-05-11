/**
 * Standalone Zustand store for the Backgammon tutorial / rules panel.
 *
 * When `isActive` is `true`, the 3D board renders this store's `board` and
 * `bornOff` instead of the live game state. This lets the tutorial
 * demonstrate positions without touching the running game engine.
 *
 * Pattern mirrors `useCheckersTutorialStore`.
 *
 * @module
 */

import { create } from 'zustand';
import type { PointState, PointIndex, StoneColor } from '../engine/types';

// ─── Arrow type (re-exported so overlay can import from one place) ────────────

/**
 * A directional arrow drawn between two board points in the tutorial overlay.
 *
 * @example
 * ```ts
 * const arrow: TutorialArrow = { from: 23, to: 19, color: '#7c5cff' };
 * ```
 */
export interface TutorialArrow {
  /** Source point index (0..23). */
  from: PointIndex;
  /** Destination point index (0..23). */
  to: PointIndex;
  /** CSS/hex color; defaults to accent when omitted by the overlay. */
  color?: string;
}

// ─── State & actions ──────────────────────────────────────────────────────────

/** Build an empty 24-point board (all points vacant). */
function makeEmptyBoard(): PointState[] {
  return Array.from({ length: 24 }, () => ({
    color: null as StoneColor | null,
    count: 0,
  }));
}

interface BackgammonTutorialState {
  /** `true` while the rules panel is open and the board shows tutorial content. */
  isActive: boolean;
  /** Stable id of the chapter currently displayed. */
  currentChapterId: string | null;
  /** Board position to render (24 `PointState` entries). */
  board: PointState[];
  /** Born-off stone counts shown in the bear-off trays. */
  bornOff: { w: number; b: number };
  /** Point indices to highlight with a glow ring. */
  highlights: PointIndex[];
  /** Arrows to draw between points. */
  arrows: TutorialArrow[];
  /**
   * Incremented by `snapBoard` to signal a hard position reset — consuming
   * components can use this as a React `key` to force remount without animation.
   */
  snapKey: number;
}

interface BackgammonTutorialActions {
  /**
   * Enter tutorial mode. Clears any previous tutorial state.
   * Call when the rules panel opens.
   */
  enter: () => void;
  /**
   * Exit tutorial mode. Resets all fields to their defaults.
   * Call when the rules panel closes.
   */
  exit: () => void;
  /**
   * Set the active chapter id. Triggers the `useEffect` in the panel that
   * loads position data for the new chapter.
   *
   * @param id - Chapter identifier, or `null` to clear.
   */
  setChapter: (id: string | null) => void;
  /**
   * Set the board and born-off counts without forcing a remount.
   * Used by the tutorial loop to animate between board states.
   *
   * @param board   - New 24-point position.
   * @param bornOff - Optional born-off override; defaults to `{w:0,b:0}`.
   */
  setBoard: (board: PointState[], bornOff?: { w: number; b: number }) => void;
  /**
   * Set point highlights.
   *
   * @param pts - Point indices to show a glow ring on.
   */
  setHighlights: (pts: PointIndex[]) => void;
  /**
   * Set directional arrows drawn on the board.
   *
   * @param arrows - List of point-to-point arrows.
   */
  setArrows: (arrows: TutorialArrow[]) => void;
  /**
   * Hard-reset to a new position, incrementing `snapKey` to signal a remount.
   * Use for loop restarts where you want a clean snap, not an animated lerp.
   *
   * @param board   - New 24-point position.
   * @param bornOff - Optional born-off override; defaults to `{w:0,b:0}`.
   */
  snapBoard: (board: PointState[], bornOff?: { w: number; b: number }) => void;
}

const INITIAL_STATE: BackgammonTutorialState = {
  isActive: false,
  currentChapterId: null,
  board: makeEmptyBoard(),
  bornOff: { w: 0, b: 0 },
  highlights: [],
  arrows: [],
  snapKey: 0,
};

/**
 * Tutorial store for Backgammon — holds the board position and overlay
 * data used by the rules panel and 3D overlay while tutorial mode is active.
 *
 * When `isActive` is `true`, `useBackgammonDisplayedBoardState` routes
 * rendering to this store instead of the live `useBackgammonStore`.
 *
 * @example
 * ```ts
 * const enter = useBackgammonTutorialStore((s) => s.enter);
 * const setBoard = useBackgammonTutorialStore((s) => s.setBoard);
 * enter();
 * setBoard(myPosition, { w: 3, b: 0 });
 * ```
 */
export const useBackgammonTutorialStore = create<
  BackgammonTutorialState & BackgammonTutorialActions
>((set) => ({
  ...INITIAL_STATE,

  enter() {
    set({
      isActive: true,
      board: makeEmptyBoard(),
      bornOff: { w: 0, b: 0 },
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

  setBoard(board, bornOff) {
    set({ board, bornOff: bornOff ?? { w: 0, b: 0 } });
  },

  setHighlights(pts) {
    set({ highlights: pts });
  },

  setArrows(arrows) {
    set({ arrows });
  },

  snapBoard(board, bornOff) {
    set((s) => ({
      board,
      bornOff: bornOff ?? { w: 0, b: 0 },
      snapKey: s.snapKey + 1,
    }));
  },
}));
