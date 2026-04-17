/**
 * Wires the MCTS AI into the Go game.
 *
 * - Initializes a Web Worker on mount, terminates on unmount.
 * - When game mode is `'ai'` and it is the AI's turn, requests a move from
 *   the worker and plays it via the store.
 * - Respects difficulty-level changes.
 *
 * Should be mounted once (used inside `useGoGame`).
 */

import { useEffect, useRef } from 'react';
import { useGoStore } from '../stores/useGoStore';
import { useGoSettingsStore } from '../stores/useGoSettingsStore';
import { GoAIService } from '../ai/GoAIService';
import { GO_AI_LEVELS } from '../config/aiLevels';

/** Delay before the AI starts searching (ms) — gives visual breathing room. */
const POST_MOVE_DELAY = 400;

/**
 * Manages the full lifecycle of the Go MCTS AI worker.
 *
 * - Spawns a `GoAIService` (Web Worker) on mount, terminates it on unmount.
 * - Monitors game state; when it is the AI's turn in `'ai'` mode, schedules
 *   a move search after a short `POST_MOVE_DELAY` to give the UI time to settle.
 * - Cancels any in-flight search automatically if the turn changes before the
 *   result arrives (e.g. human takes back a move).
 * - Silently ignores `'Search aborted'` / `'Search stopped'` rejections to
 *   avoid spurious console errors during rapid move sequences.
 *
 * This hook has no return value — all side effects go through the Go store.
 * Mount it exactly once, inside `useGoGame`.
 *
 * @returns `void` — all state changes flow through `useGoStore`.
 *
 * @example
 * ```ts
 * // Inside useGoGame:
 * useGoAI(); // mounts the worker, drives the AI
 * ```
 */
export function useGoAI() {
  const serviceRef = useRef<GoAIService | null>(null);

  const turn = useGoStore((s) => s.turn);
  const gameMode = useGoStore((s) => s.gameMode);
  const gameStatus = useGoStore((s) => s.gameStatus);
  const setAIThinking = useGoStore((s) => s.setAIThinking);
  const playAt = useGoStore((s) => s.playAt);
  const pass = useGoStore((s) => s.pass);
  const getEngine = useGoStore((s) => s.getEngine);
  const moveHistory = useGoStore((s) => s.moveHistory);

  const aiLevel = useGoSettingsStore((s) => s.aiLevel);
  const playerColor = useGoSettingsStore((s) => s.playerColor);
  const aiColor = playerColor === 'b' ? 'w' : 'b';

  // Initialize worker
  useEffect(() => {
    const service = new GoAIService();
    service.init();
    service.setLevel(GO_AI_LEVELS[aiLevel]);
    serviceRef.current = service;

    return () => {
      service.dispose();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update difficulty when changed
  useEffect(() => {
    serviceRef.current?.setLevel(GO_AI_LEVELS[aiLevel]);
  }, [aiLevel]);

  // Trigger AI move
  useEffect(() => {
    const service = serviceRef.current;
    if (!service) return;
    if (gameMode !== 'ai') return;
    if (turn !== aiColor) return;
    if (gameStatus !== 'idle' && gameStatus !== 'playing') return;

    let cancelled = false;
    setAIThinking(true);

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const engine = getEngine();
      const snapshot = engine.toJSON();

      service
        .getBestMove(snapshot)
        .then((move) => {
          if (cancelled) return;
          // Clear the thinking flag BEFORE playing so that the store's
          // `isAIThinking` guard in `playAt` / `pass` does not reject the
          // AI's own move.
          setAIThinking(false);
          if (move.kind === 'pass') {
            pass();
          } else if (move.point) {
            playAt(move.point);
          }
        })
        .catch((err: Error) => {
          if (err.message === 'Search aborted' || err.message === 'Search stopped') return;
          console.error('Go AI error:', err);
          setAIThinking(false);
        });
    }, POST_MOVE_DELAY);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      service.stop();
      setAIThinking(false);
    };
  }, [turn, gameMode, gameStatus, aiColor, setAIThinking, playAt, pass, getEngine, moveHistory.length]);
}
