/**
 * Unified selector that routes board-rendering data from either the tutorial
 * store or the live game store, depending on whether tutorial mode is active.
 *
 * This keeps `BackgammonScene` agnostic of the data source:
 * - When `tutorialActive === true` → returns tutorial board + born-off,
 *   disables interactions.
 * - When `tutorialActive === false` → returns live game state, enables
 *   interactions when appropriate (not AI thinking, not ended).
 *
 * @module
 */

import { useBackgammonStore } from '../stores/useBackgammonStore';
import { useBackgammonTutorialStore } from '../stores/useBackgammonTutorialStore';
import type { PointState, PointIndex } from '../engine/types';

/**
 * Shape of data consumed by the 3D board rendering components.
 *
 * @example
 * ```ts
 * const { board, bornOff, selectedFrom, isInteractive, tutorialActive } =
 *   useBackgammonDisplayedBoardState();
 * ```
 */
export interface BackgammonDisplayedBoardState {
  /** 24-point board to render. */
  board: PointState[];
  /** Born-off stone counts shown in the bear-off trays. */
  bornOff: { w: number; b: number };
  /** Currently selected source point (`null` in tutorial mode). */
  selectedFrom: PointIndex | null;
  /** `true` when click interactions should be processed. */
  isInteractive: boolean;
  /** `true` when the tutorial store is driving the board. */
  tutorialActive: boolean;
  /**
   * Incremented on hard board resets (tutorial snap) — allows components
   * to use this as a React `key` to skip animation on position resets.
   */
  snapKey: number;
}

/**
 * Route board rendering data to either the tutorial or live game store.
 *
 * Keeps scene components decoupled from the data source: they only depend
 * on the shape returned here, not on which store is active.
 *
 * @returns Current board display state from the appropriate store.
 *
 * @example
 * ```tsx
 * function BackgammonScene() {
 *   const { board, bornOff, isInteractive, tutorialActive } =
 *     useBackgammonDisplayedBoardState();
 *   // …render stones, disable clicks when !isInteractive
 * }
 * ```
 */
export function useBackgammonDisplayedBoardState(): BackgammonDisplayedBoardState {
  const tutorialActive = useBackgammonTutorialStore((s) => s.isActive);
  const tutorialBoard = useBackgammonTutorialStore((s) => s.board);
  const tutorialBornOff = useBackgammonTutorialStore((s) => s.bornOff);
  const tutorialSnapKey = useBackgammonTutorialStore((s) => s.snapKey);

  const gameBoard = useBackgammonStore((s) => s.board);
  const gameBornOff = useBackgammonStore((s) => s.bornOff);
  const gameSelectedFrom = useBackgammonStore((s) => s.selectedFrom);
  const gameStatus = useBackgammonStore((s) => s.gameStatus);
  const isAIThinking = useBackgammonStore((s) => s.isAIThinking);

  if (tutorialActive) {
    return {
      board: tutorialBoard,
      bornOff: tutorialBornOff,
      selectedFrom: null,
      isInteractive: false,
      tutorialActive: true,
      snapKey: tutorialSnapKey,
    };
  }

  const isInteractive =
    !isAIThinking &&
    (gameStatus === 'choosing' || gameStatus === 'idle');

  return {
    board: gameBoard as PointState[],
    bornOff: gameBornOff,
    selectedFrom: gameSelectedFrom,
    isInteractive,
    tutorialActive: false,
    snapKey: 0,
  };
}
