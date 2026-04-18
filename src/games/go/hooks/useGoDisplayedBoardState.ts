/**
 * Selector hook that returns the board state to display, routing between
 * the live Go store and (later) a tutorial store.
 *
 * For Sprint 2 the tutorial layer does not yet exist; we route directly
 * from `useGoStore`. The shape is kept forward-compatible with a future
 * `useGoTutorialStore` just like `useCheckersDisplayedBoardState` does.
 */

import { useGoStore } from '../stores/useGoStore';
import { useGoTutorialStore } from '../stores/useGoTutorialStore';
import type { Board, BoardSize, Point, Stone } from '../engine/types';

/**
 * Snapshot of Go board state that the 3D scene components need to render.
 *
 * Produced by {@link useGoDisplayedBoardState} and consumed by `GoBoard`,
 * `GoStoneSet`, and `GoScene`. Fields related to scoring (`scoring`,
 * `deadStones`, `territoryMap`) are neutral defaults (`false`, `[]`, `null`)
 * during normal play so scene components don't need null guards.
 *
 * @see {@link useGoDisplayedBoardState}
 */
export interface GoDisplayedBoardState {
  /** Board matrix to render. */
  board: Board;
  /** Board dimension. */
  boardSize: BoardSize;
  /** Last play point for subtle highlighting, or `null`. */
  lastPoint: Point | null;
  /** Forbidden ko point this turn, or `null`. */
  koPoint: Point | null;
  /** Whether the board should be interactive (accept clicks). */
  interactive: boolean;
  /** Whether the board is in scoring mode (dead-stone selection). */
  scoring: boolean;
  /** Points currently marked as dead. Empty outside of scoring phase. */
  deadStones: Point[];
  /** Territory ownership map. `null` outside of scoring phase. */
  territoryMap: Map<string, Stone | 'neutral'> | null;
  /** Placeholder for future tutorial overlays. */
  tutorialActive: boolean;
}

/**
 * Selector hook that assembles everything the 3D scene needs to render
 * a consistent board view from the live Go store.
 *
 * `interactive` is `true` in three situations: normal play (when the AI is not
 * thinking), and the scoring phase (so the player can click stones to mark them
 * dead). It is `false` when the AI is computing, or after the game has ended.
 *
 * Scoring-related fields (`scoring`, `deadStones`, `territoryMap`) are always
 * populated — they default to safe neutral values outside the scoring phase so
 * child components never need to handle `undefined`.
 *
 * @returns Snapshot of display-ready board state derived from `useGoStore`.
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   const display = useGoDisplayedBoardState();
 *   return (
 *     <GoBoard
 *       boardSize={display.boardSize}
 *       interactive={display.interactive}
 *       territoryMap={display.territoryMap}
 *       onIntersectionClick={handleClick}
 *     />
 *   );
 * }
 * ```
 */
export function useGoDisplayedBoardState(): GoDisplayedBoardState {
  // Tutorial store — when active, overrides the game board entirely.
  const tutorialActive = useGoTutorialStore((s) => s.isActive);
  const tutorialBoard = useGoTutorialStore((s) => s.board);
  const tutorialBoardSize = useGoTutorialStore((s) => s.boardSize);

  // Game store — used when tutorial is inactive.
  const board = useGoStore((s) => s.board);
  const boardSize = useGoStore((s) => s.boardSize);
  const lastPoint = useGoStore((s) => s.lastPoint);
  const koPoint = useGoStore((s) => s.koPoint);
  const gameStatus = useGoStore((s) => s.gameStatus);
  const isAIThinking = useGoStore((s) => s.isAIThinking);
  const deadStones = useGoStore((s) => s.deadStones);
  const territoryMap = useGoStore((s) => s.territoryMap);

  // Tutorial mode: board is non-interactive, no scoring, no overlays.
  if (tutorialActive) {
    return {
      board: tutorialBoard,
      boardSize: tutorialBoardSize,
      lastPoint: null,
      koPoint: null,
      interactive: false,
      scoring: false,
      deadStones: [],
      territoryMap: null,
      tutorialActive: true,
    };
  }

  const isScoring = gameStatus === 'scoring';

  // Board is interactive for normal play AND during scoring (for dead-stone clicks).
  const interactive =
    !isAIThinking &&
    (gameStatus === 'idle' || gameStatus === 'playing' || isScoring);

  return {
    board,
    boardSize,
    lastPoint,
    koPoint,
    interactive,
    scoring: isScoring,
    deadStones,
    territoryMap,
    tutorialActive: false,
  };
}
