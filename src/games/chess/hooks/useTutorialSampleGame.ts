import { useEffect } from 'react';
import { Chess } from 'chess.js';
import { useTutorialStore } from '../stores/useTutorialStore';
import { getChapterById } from '../data/tutorialChapters';

/** Minimum time a move visibly spends on the board (matches Piece animation + buffer). */
const MIN_MOVE_MS = 1600;

/**
 * Runs the current chapter's `sampleGame` — a sequence of SAN moves played
 * automatically on the main 3D board.
 *
 * Uses a sandboxed chess.js instance (isolated from `useChessStore`) to parse
 * SAN notation and resolve each move's from/to squares. After every move, the
 * resulting FEN is pushed into `useTutorialStore`, which causes the board
 * components to animate the piece via their normal transition.
 *
 * Behavior:
 * - At the start of each iteration, the board is reset to `sampleGame.fen`.
 * - Each SAN move is played in sequence with `stepPauseMs` between moves.
 * - After the final move the runner waits `loopPauseMs` and repeats.
 * - Cancels cleanly on chapter change, panel close, or unmount via token.
 *
 * Intentionally separate from `useTutorialLoop` because sample games use a
 * completely different data format (SAN strings with legal-move resolution)
 * vs. explicit from/to loops used for single-piece demonstrations.
 */
export function useTutorialSampleGame(chapterId: string | null) {
  const isActive = useTutorialStore((s) => s.isActive);
  const setPosition = useTutorialStore((s) => s.setPosition);
  const setLastMove = useTutorialStore((s) => s.setLastMove);

  useEffect(() => {
    if (!isActive || !chapterId) return;
    const chapter = getChapterById(chapterId);
    if (!chapter.sampleGame) return;

    const { fen, sanMoves, stepPauseMs, loopPauseMs } = chapter.sampleGame;
    const token = { cancelled: false };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (!token.cancelled) {
        // Fresh chess.js instance per iteration — avoids state carryover
        const sandbox = new Chess(fen);
        setPosition(sandbox.fen());
        setLastMove(null);
        await sleep(700);
        if (token.cancelled) return;

        for (const san of sanMoves) {
          if (token.cancelled) return;

          let move;
          try {
            move = sandbox.move(san);
          } catch {
            // Illegal SAN — skip but keep looping to avoid hanging
            continue;
          }
          if (!move) continue;

          setPosition(sandbox.fen());
          setLastMove({ from: move.from, to: move.to });

          // Wait at least MIN_MOVE_MS for the animation to finish, then
          // the configured pause (if larger).
          await sleep(Math.max(MIN_MOVE_MS, stepPauseMs));
          if (token.cancelled) return;
        }

        if (token.cancelled) return;
        await sleep(loopPauseMs);
      }
    };

    run();

    return () => {
      token.cancelled = true;
    };
  }, [isActive, chapterId, setPosition, setLastMove]);
}
