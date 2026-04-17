import { useGoStore } from '../../stores/useGoStore';
import { useGoDisplayedBoardState } from '../../hooks/useGoDisplayedBoardState';
import { GoEnvironment } from './GoEnvironment';
import { GoLighting } from './GoLighting';
import { GoBoard } from './GoBoard';
import { GoStoneSet } from './GoStoneSet';
import { FadingGoStone } from './FadingGoStone';
import { pointToWorld } from './boardLayout';
import type { Point } from '../../engine/types';

/**
 * Root 3D scene for the Go game.
 *
 * Composes the environment, lighting, board surface, live stones, and fading
 * capture ghosts into a single R3F scene tree. Reads all state from the store
 * via {@link useGoDisplayedBoardState} so child components receive only the
 * slices they need.
 *
 * Click routing is mode-aware:
 * - **Play mode** — forwards the click to `playAt` (place a stone).
 * - **Scoring mode** — forwards the click to `toggleDeadStone` (mark a stone
 *   group dead or alive). `lastPoint` and `koPoint` highlights are suppressed
 *   during scoring to avoid visual clutter.
 * - **Non-interactive** (AI thinking / game ended) — clicks are swallowed.
 *
 * @example
 * ```tsx
 * // Mount inside a React-Three-Fiber <Canvas>
 * <Canvas>
 *   <GoScene />
 * </Canvas>
 * ```
 */
export function GoScene() {
  const display = useGoDisplayedBoardState();
  const playAt = useGoStore((s) => s.playAt);
  const toggleDeadStone = useGoStore((s) => s.toggleDeadStone);
  const fadingStones = useGoStore((s) => s.fadingStones);

  // During scoring, clicks toggle dead stones instead of playing moves.
  const handleClick = display.interactive
    ? (p: Point) => {
        if (display.scoring) {
          toggleDeadStone(p);
        } else {
          playAt(p);
        }
      }
    : () => {};

  return (
    <>
      <GoEnvironment />
      <GoLighting />

      <GoBoard
        boardSize={display.boardSize}
        lastPoint={display.scoring ? null : display.lastPoint}
        koPoint={display.scoring ? null : display.koPoint}
        interactive={display.interactive}
        onIntersectionClick={handleClick}
        territoryMap={display.territoryMap}
      />

      <GoStoneSet
        board={display.board}
        boardSize={display.boardSize}
        deadStones={display.deadStones}
      />

      {fadingStones.map((f) => {
        const [fx, fz] = pointToWorld(f.point, display.boardSize);
        return (
          <FadingGoStone key={f.id} x={fx} z={fz} color={f.color} />
        );
      })}
    </>
  );
}
