/**
 * Runs the looped board-state demonstration for the current tutorial chapter.
 *
 * When a chapter with a `loop` becomes active, the hook starts an async runner
 * that cycles through the chapter's `steps`, snapping the board to each
 * `PointState[]` snapshot in sequence with per-step `pauseMs` delays between
 * them, then waits `loop.intervalMs` before restarting.
 *
 * The runner is cancelled cleanly via a cancellation-token object on chapter
 * change, panel close, or component unmount.
 *
 * @module
 */

import { useEffect } from 'react';
import { useBackgammonTutorialStore } from '../stores/useBackgammonTutorialStore';
import { getBackgammonChapterById } from '../data/tutorialChapters';

/**
 * Drives looped board-state animations for a tutorial chapter.
 *
 * Internally uses `setBoard` from the tutorial store (not `snapBoard`) so the
 * transition between steps is a smooth React re-render rather than a forced
 * remount — suitable for showing stones appearing/disappearing between
 * positions without animation artifacts.
 *
 * @param chapterId - The currently displayed chapter id, or `null`.
 *
 * @example
 * ```ts
 * // Inside BackgammonRulesPanel:
 * useBackgammonTutorialLoop(currentChapterId);
 * ```
 */
export function useBackgammonTutorialLoop(chapterId: string | null): void {
  const isActive = useBackgammonTutorialStore((s) => s.isActive);
  const setBoard = useBackgammonTutorialStore((s) => s.setBoard);

  useEffect(() => {
    if (!isActive || !chapterId) return;

    const chapter = getBackgammonChapterById(chapterId);
    if (!chapter.loop) return;

    const { steps, intervalMs } = chapter.loop;

    /** Cancellation token — set to `true` by the cleanup fn to halt the runner. */
    const token = { cancelled: false };

    const sleep = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const run = async (): Promise<void> => {
      while (!token.cancelled) {
        for (const step of steps) {
          if (token.cancelled) return;
          setBoard(step.board, step.bornOff);
          await sleep(step.pauseMs);
        }
        if (token.cancelled) return;
        await sleep(intervalMs);
      }
    };

    run();

    return () => {
      token.cancelled = true;
    };
  }, [isActive, chapterId, setBoard]);
}
