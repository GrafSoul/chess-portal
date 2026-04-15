import { useEffect } from 'react';
import { useCheckersTutorialStore } from '../stores/useCheckersTutorialStore';
import { getCheckersChapterById } from '../data/tutorialChapters';
import { stepToMoveOptions } from '../data/tutorialChapters';

/**
 * Runs the current tutorial chapter's looped demonstration, if any.
 *
 * When a chapter with a `loop` becomes active, starts an async runner that
 * resets the board to `loop.fen`, plays each move in sequence (waiting for
 * each animation to complete), pauses for `loop.intervalMs`, and repeats.
 *
 * Cancels cleanly on chapter change, panel close, or unmount via token.
 *
 * @param chapterId Currently active chapter id
 */
export function useCheckersTutorialLoop(chapterId: string | null) {
  const isActive = useCheckersTutorialStore((s) => s.isActive);
  const snapPosition = useCheckersTutorialStore((s) => s.snapPosition);
  const playMove = useCheckersTutorialStore((s) => s.playMove);

  useEffect(() => {
    if (!isActive || !chapterId) return;
    const chapter = getCheckersChapterById(chapterId);
    if (!chapter.loop) return;

    const loop = chapter.loop;
    const token = { cancelled: false };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (!token.cancelled) {
        // Snap-reset to initial position (no animation, forces PieceSet remount)
        snapPosition(loop.fen);
        await sleep(400);
        if (token.cancelled) return;

        for (const step of loop.moves) {
          if (token.cancelled) return;
          await playMove(step.from, step.to, stepToMoveOptions(step));
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
  }, [isActive, chapterId, snapPosition, playMove]);
}
