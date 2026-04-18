import { memo, useMemo } from 'react';
import type { Board, BoardSize, Point } from '../../engine/types';
import { GoStone } from './GoStone';
import { pointToWorld } from './boardLayout';

/**
 * Props for {@link GoStoneSet}.
 *
 * `deadStones` defaults to `[]` so the component can be used without
 * changes outside the scoring phase. The dead-stone lookup is memoised
 * internally into a `Set<string>` so passing a new array reference each render
 * only triggers a re-memo when the content actually changes.
 */
interface GoStoneSetProps {
  /** Current board matrix (row-major, index as `board[y][x]`). */
  board: Board;
  /** Board dimension (needed for the world-coordinate centering transform). */
  boardSize: BoardSize;
  /**
   * Points marked as dead during the scoring phase.
   * Each matching stone is rendered at 35% opacity with a red × marker.
   * Defaults to `[]` — no dead stones outside scoring.
   */
  deadStones?: Point[];
}

/**
 * Renders every stone currently on the board as a flat `<group>` of
 * {@link GoStone} instances.
 *
 * Two separate `useMemo` calls are used deliberately:
 * 1. `deadSet` — recomputes only when `deadStones` changes; cheap Set build.
 * 2. `stones` — recomputes when `board`, `boardSize`, or `deadSet` changes;
 *    expensive board scan. Splitting avoids rebuilding the full stone list on
 *    every dead-stone toggle if the board itself hasn't changed.
 *
 * Keys are `"x,y,color"` so React mounts a new `GoStone` (triggering the
 * drop animation) whenever a stone is placed, and unmounts it on capture.
 * Fading capture ghosts are handled separately by `FadingGoStone`.
 *
 * @param props - Component props.
 * @param props.board - Current board matrix.
 * @param props.boardSize - Board dimension used for world-coordinate transform.
 * @param props.deadStones - Points marked dead during scoring. Defaults to `[]`.
 *
 * @example
 * ```tsx
 * <GoStoneSet
 *   board={display.board}
 *   boardSize={display.boardSize}
 *   deadStones={display.deadStones}
 * />
 * ```
 */
function GoStoneSetImpl({ board, boardSize, deadStones = [] }: GoStoneSetProps) {
  const deadSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of deadStones) s.add(`${p.x},${p.y}`);
    return s;
  }, [deadStones]);

  const stones = useMemo(() => {
    const list: { key: string; color: 'b' | 'w'; x: number; z: number; isDead: boolean }[] = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const cell = board[y]?.[x];
        if (cell === 'b' || cell === 'w') {
          const [wx, wz] = pointToWorld({ x, y }, boardSize);
          list.push({
            key: `${x},${y},${cell}`,
            color: cell,
            x: wx,
            z: wz,
            isDead: deadSet.has(`${x},${y}`),
          });
        }
      }
    }
    return list;
  }, [board, boardSize, deadSet]);

  return (
    <group>
      {stones.map((s) => (
        <GoStone key={s.key} color={s.color} x={s.x} z={s.z} isDead={s.isDead} />
      ))}
    </group>
  );
}

/**
 * Memoised stone set — re-renders only when `board`, `boardSize`, or the
 * `deadStones` reference changes. Important because unrelated scene state
 * (e.g. `hoveredPoint` in `GoScene`) would otherwise walk all 361 children.
 */
export const GoStoneSet = memo(GoStoneSetImpl);
