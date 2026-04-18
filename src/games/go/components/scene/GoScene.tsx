import { useCallback, useState } from 'react';
import { useGoStore } from '../../stores/useGoStore';
import { useGoDisplayedBoardState } from '../../hooks/useGoDisplayedBoardState';
import { GoEnvironment } from './GoEnvironment';
import { GoLighting } from './GoLighting';
import { GoBoard } from './GoBoard';
import { GoStoneSet } from './GoStoneSet';
import { FadingGoStone } from './FadingGoStone';
import { GoTutorialOverlay } from './GoTutorialOverlay';
import { GoHoverPreview } from './GoHoverPreview';
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
 * Hover preview:
 * - In play mode, hovering an empty legal intersection shows a semi-transparent
 *   "ghost" stone in the current player's color. The preview is suppressed when
 *   the intersection is occupied, marked as ko, or when play is not interactive.
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
  const turn = useGoStore((s) => s.turn);

  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

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

  const handleHoverEnter = useCallback((p: Point) => {
    setHoveredPoint(p);
  }, []);

  // Clear hover when the pointer leaves the last-hovered cell. An incoming
  // `onHoverEnter` from the next cell will overwrite this immediately, so
  // there's no gap / flicker between adjacent intersections.
  const handleHoverLeave = useCallback((p: Point) => {
    setHoveredPoint((prev) =>
      prev && prev.x === p.x && prev.y === p.y ? null : prev,
    );
  }, []);

  // Preview is only valid during play (not scoring, tutorial, AI thinking,
  // or game end) and only on empty non-ko intersections.
  const canShowHover =
    display.interactive &&
    !display.scoring &&
    !display.tutorialActive &&
    hoveredPoint !== null;

  const hoveredCellEmpty =
    hoveredPoint !== null &&
    display.board[hoveredPoint.y]?.[hoveredPoint.x] === null;

  const hoveredIsKo =
    hoveredPoint !== null &&
    display.koPoint !== null &&
    display.koPoint.x === hoveredPoint.x &&
    display.koPoint.y === hoveredPoint.y;

  const showPreview = canShowHover && hoveredCellEmpty && !hoveredIsKo;

  let previewX = 0;
  let previewZ = 0;
  if (hoveredPoint) {
    [previewX, previewZ] = pointToWorld(hoveredPoint, display.boardSize);
  }

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
        onIntersectionHoverEnter={handleHoverEnter}
        onIntersectionHoverLeave={handleHoverLeave}
        territoryMap={display.territoryMap}
      />

      <GoStoneSet
        board={display.board}
        boardSize={display.boardSize}
        deadStones={display.deadStones}
      />

      {/* Ghost stone follows the cursor on legal empty intersections. */}
      <GoHoverPreview
        x={previewX}
        z={previewZ}
        color={turn}
        visible={showPreview}
      />

      {/* Fading capture ghosts (only in game mode, not tutorial) */}
      {!display.tutorialActive &&
        fadingStones.map((f) => {
          const [fx, fz] = pointToWorld(f.point, display.boardSize);
          return (
            <FadingGoStone key={f.id} x={fx} z={fz} color={f.color} />
          );
        })}

      {/* Tutorial overlays (highlights + arrows) */}
      <GoTutorialOverlay />
    </>
  );
}
