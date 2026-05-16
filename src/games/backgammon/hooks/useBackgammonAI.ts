/**
 * React hook that drives the Backgammon AI turn lifecycle.
 *
 * Manages the `BackgammonAIService` (Web Worker wrapper) lifecycle:
 * - Spawns the worker on mount, terminates it on unmount.
 * - Watches game state; when it is the AI's turn in `'ai'` mode and the
 *   status is `'idle'`, schedules a dice roll after a short delay.
 * - When status becomes `'choosing'` on the AI's turn, sends the current
 *   game snapshot to the worker, then plays back each sub-move with visual
 *   pacing delays.
 * - Sets `isAIThinking` in the store so the UI can dim interactive controls.
 *
 * This hook has no return value. Mount it exactly once inside `useBackgammonGame`.
 *
 * @returns `void` — all side-effects flow through `useBackgammonStore`.
 *
 * @example
 * ```ts
 * // Inside useBackgammonGame:
 * useBackgammonAI();
 * ```
 */

import { useEffect, useRef } from 'react';
import { useBackgammonStore } from '../stores/useBackgammonStore';
import { useBackgammonSettingsStore } from '../stores/useBackgammonSettingsStore';
import { BackgammonAIService } from '../ai/BackgammonAIService';
import { AI_LEVEL_CONFIG } from '../config/aiLevels';
import type { StoneColor, BackgammonState } from '../engine/types';

/** Delay before the AI triggers its dice roll, in ms. */
const AI_ROLL_DELAY_MS = 600;

/** Delay before the AI starts executing its first sub-move, in ms. */
const AI_THINK_START_DELAY_MS = 300;

/** Delay between consecutive AI sub-moves for visual pacing, in ms. */
const AI_SUBMOVE_INTERVAL_MS = 400;

/**
 * Manages the full lifecycle of the Backgammon expectimax AI worker.
 *
 * The hook monitors game state and drives the AI's turn automatically:
 * 1. When `gameStatus === 'idle'` and it is the AI's turn, triggers a dice roll.
 * 2. When `gameStatus === 'choosing'` and it is the AI's turn, sends the state
 *    snapshot to the worker and waits for the best `MoveSequence`.
 * 3. Executes each sub-move in the sequence with `AI_SUBMOVE_INTERVAL_MS` gaps
 *    so the player can follow the AI's moves visually.
 * 4. Falls back to `confirmTurn()` if the worker returns an empty sequence
 *    (no legal moves available).
 *
 * @returns `void`
 */
export function useBackgammonAI(): void {
  // --- Store selectors -------------------------------------------------------
  const gameStatus = useBackgammonStore((s) => s.gameStatus);
  const turn = useBackgammonStore((s) => s.turn);
  const dice = useBackgammonStore((s) => s.dice);
  const gameMode = useBackgammonStore((s) => s.gameMode);

  const rollDice = useBackgammonStore((s) => s.rollDice);
  const executeSubMove = useBackgammonStore((s) => s.executeSubMove);
  const confirmTurn = useBackgammonStore((s) => s.confirmTurn);
  const setAIThinking = useBackgammonStore((s) => s.setAIThinking);

  const playerColor = useBackgammonSettingsStore((s) => s.playerColor);
  const aiLevel = useBackgammonSettingsStore((s) => s.aiLevel);

  // --- Derived values --------------------------------------------------------
  const aiColor: StoneColor = playerColor === 'w' ? 'b' : 'w';
  const isAITurn = gameMode === 'ai' && turn === aiColor;

  // --- Refs ------------------------------------------------------------------
  const serviceRef = useRef<BackgammonAIService | null>(null);
  /**
   * Guard to prevent launching a second search while one is in flight.
   * Using a ref (not state) avoids triggering a re-render on toggle.
   */
  const isThinkingRef = useRef(false);
  /**
   * Guard to prevent re-triggering the worker while sub-moves are being
   * played back sequentially via setTimeout. The effect re-fires when
   * `dice` changes (after each executeSubMove), but we must NOT launch a
   * second search during playback.
   */
  const isPlayingRef = useRef(false);

  // --- Worker lifecycle: mount / unmount -------------------------------------
  useEffect(() => {
    const svc = new BackgammonAIService();
    svc.init();
    svc.setLevel(AI_LEVEL_CONFIG[aiLevel]);
    serviceRef.current = svc;

    return () => {
      svc.dispose();
      serviceRef.current = null;
    };
    // Worker is created once; aiLevel changes handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Propagate difficulty changes ------------------------------------------
  useEffect(() => {
    serviceRef.current?.setLevel(AI_LEVEL_CONFIG[aiLevel]);
  }, [aiLevel]);

  // --- AI dice roll ----------------------------------------------------------
  // When it is the AI's turn and the game is waiting for a roll, trigger it
  // after a short delay so the UI visually registers the turn switch first.
  useEffect(() => {
    if (!isAITurn || gameStatus !== 'idle' || isThinkingRef.current) return;

    const timer = window.setTimeout(() => {
      rollDice();
    }, AI_ROLL_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isAITurn, gameStatus, rollDice]);

  // --- AI move search --------------------------------------------------------
  // When dice have settled and it is the AI's turn, run expectimax in the
  // worker, then play back the result sub-move by sub-move.
  useEffect(() => {
    if (!isAITurn || gameStatus !== 'choosing' || dice === null) return;
    if (isThinkingRef.current) return;
    if (isPlayingRef.current) return;

    const svc = serviceRef.current;
    if (!svc) return;

    isThinkingRef.current = true;
    setAIThinking(true);

    // Extract only serializable data fields from the store for the worker.
    // `getState()` includes Zustand actions (functions) which cannot be cloned
    // via `postMessage` — sending them would throw a DataCloneError.
    const s = useBackgammonStore.getState();
    const snapshot: BackgammonState = {
      board: s.board,
      turn: s.turn,
      dice: s.dice,
      moveHistory: s.moveHistory,
      bornOff: s.bornOff,
      gameStatus: s.gameStatus,
      winner: s.winner,
      winType: s.winType,
      rules: s.rules,
      isFirstTurn: s.isFirstTurn,
      headTakenThisTurn: s.headTakenThisTurn,
      selectedFrom: s.selectedFrom,
      pendingSequence: s.pendingSequence,
    };

    /**
     * `searchCancelled` only gates the worker result — NOT the sub-move
     * execution timeouts. This prevents the effect cleanup (triggered when
     * `dice` changes after each sub-move) from aborting later moves.
     */
    let searchCancelled = false;

    svc
      .findBestSequence(snapshot, aiColor)
      .then((seq) => {
        if (searchCancelled) return;

        isThinkingRef.current = false;
        setAIThinking(false);

        if (seq.length === 0) {
          // No legal moves — confirm the empty turn.
          confirmTurn();
          return;
        }

        // Execute each sub-move with visual pacing so the player can track them.
        // Each move reads fresh state via getState() to avoid stale closures.
        // The `isPlayingRef` guard prevents the effect re-trigger (caused by
        // dice.remaining shrinking) from launching a second worker search.
        isPlayingRef.current = true;

        seq.forEach((move, index) => {
          const delay = AI_THINK_START_DELAY_MS + index * AI_SUBMOVE_INTERVAL_MS;
          window.setTimeout(() => {
            const store = useBackgammonStore.getState();
            // Safety: if the game was reset or ended mid-sequence, bail out.
            if (store.gameStatus !== 'choosing') {
              isPlayingRef.current = false;
              return;
            }
            store.selectFrom(move.from);
            store.executeSubMove(move.to, move.pips);

            // After the last move, clear the playing guard.
            if (index === seq.length - 1) {
              isPlayingRef.current = false;
            }
          }, delay);
        });
      })
      .catch((err: Error) => {
        if (searchCancelled) return;
        if (err.message === 'Search aborted' || err.message === 'Search stopped') return;
        console.error('Backgammon AI error:', err);
        isThinkingRef.current = false;
        setAIThinking(false);
      });

    return () => {
      searchCancelled = true;
      svc.stop();
      isThinkingRef.current = false;
      setAIThinking(false);
    };
    // `dice` included so this effect re-triggers on each new roll.
    // `aiColor` is stable between renders unless playerColor changes.
  }, [isAITurn, gameStatus, dice, aiColor, setAIThinking, executeSubMove, confirmTurn]);
}
