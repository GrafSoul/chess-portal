import { useEffect } from 'react';
import { useTutorialStore } from '../stores/useTutorialStore';
import { getChapterById } from '../data/tutorialChapters';

/**
 * Runs the current tutorial chapter's looped demonstration, if any.
 *
 * Behavior:
 * - When a chapter with a `loop` becomes active, starts an async runner that
 *   resets the board to `loop.fen`, plays each move in sequence (waiting for
 *   each animation to complete), pauses for `loop.intervalMs`, and repeats.
 * - When a chapter with a `sampleGame` becomes active, plays the SAN sequence
 *   — currently handled in a future phase; this hook only runs `loop` demos.
 * - Cancels cleanly on chapter change, panel close, or unmount.
 *
 * Cancellation is handled via a per-run token: each run receives a fresh
 * token object, and before every async step the runner checks whether the
 * token still matches the latest one. If not, it exits silently.
 */
export function useTutorialLoop(chapterId: string | null) {
  const isActive = useTutorialStore((s) => s.isActive);
  const setPosition = useTutorialStore((s) => s.setPosition);
  const setLastMove = useTutorialStore((s) => s.setLastMove);
  const playMove = useTutorialStore((s) => s.playMove);

  useEffect(() => {
    if (!isActive || !chapterId) return;
    const chapter = getChapterById(chapterId);
    if (!chapter.loop) return;

    const loop = chapter.loop;
    // Token pattern: each effect run creates its own { cancelled: false }
    // and cleanup sets it to true. All async waits check this before acting.
    const token = { cancelled: false };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (!token.cancelled) {
        // Reset to initial position at the start of each iteration
        setPosition(loop.fen);
        setLastMove(null);
        // Brief settle pause so the reset isn't visually instantaneous
        await sleep(400);
        if (token.cancelled) return;

        for (const step of loop.moves) {
          if (token.cancelled) return;
          await playMove(step.from, step.to, {
            promote: step.promote,
            with: step.with,
          });
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
  }, [isActive, chapterId, setPosition, setLastMove, playMove]);
}
