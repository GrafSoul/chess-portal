/**
 * Effect hook that runs the current tutorial chapter's looped demonstration.
 *
 * When a chapter with a `loop` definition becomes active, starts an async
 * runner that resets the board to the loop's starting position, plays each
 * stone placement in sequence (waiting for animations), pauses, and repeats.
 *
 * Cancels cleanly on chapter change, panel close, or unmount via a token.
 *
 * @module
 */

import { useEffect } from 'react';
import { useGoTutorialStore } from '../stores/useGoTutorialStore';
import { getGoChapterById } from '../tutorial/tutorialChapters';

/**
 * Runs the looped demonstration for the given tutorial chapter.
 *
 * Side-effect-only hook. Starts the async animation runner on mount/chapter
 * change and cancels it via a token on cleanup — no manual teardown needed
 * by the caller. Does nothing when `chapterId` is `null` or the chapter has
 * no `loop` definition.
 *
 * @param chapterId - Currently active chapter id, or `null` to stop the loop.
 * @returns `void` — all effects are internal side effects.
 *
 * @example
 * ```tsx
 * function GoRulesPanel() {
 *   const currentChapterId = useGoTutorialStore((s) => s.currentChapterId);
 *   // Starts the loop automatically; cancels when chapterId changes or
 *   // the component unmounts.
 *   useGoTutorialLoop(currentChapterId);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useGoTutorialLoop(chapterId: string | null): void {
  const isActive = useGoTutorialStore((s) => s.isActive);
  const snapBoard = useGoTutorialStore((s) => s.snapBoard);
  const placeStone = useGoTutorialStore((s) => s.placeStone);

  useEffect(() => {
    if (!isActive || !chapterId) return;
    const chapter = getGoChapterById(chapterId);
    if (!chapter.loop) return;

    const loop = chapter.loop;
    const token = { cancelled: false };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (!token.cancelled) {
        // Snap-reset to the loop's starting position (instant, no animation)
        snapBoard(loop.boardNotation);
        await sleep(500);
        if (token.cancelled) return;

        // Play each step in sequence
        for (const step of loop.steps) {
          if (token.cancelled) return;
          await placeStone(step.point, step.color, step.captures);
          if (token.cancelled) return;
          if (step.pauseAfterMs && step.pauseAfterMs > 0) {
            await sleep(step.pauseAfterMs);
          }
        }

        if (token.cancelled) return;
        await sleep(loop.intervalMs);
      }
    };

    run();

    return () => {
      token.cancelled = true;
    };
  }, [isActive, chapterId, snapBoard, placeStone]);
}
