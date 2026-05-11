/**
 * Promise-based wrapper around the Backgammon expectimax Web Worker.
 *
 * Mirrors `GoAIService` — only one search may be in flight at a time. A new
 * `findBestSequence` call automatically aborts any prior pending search.
 *
 * Typical lifecycle inside a React hook:
 * ```ts
 * // mount
 * const svc = new BackgammonAIService();
 * svc.init();
 * svc.setLevel(AI_LEVEL_CONFIG['medium']);
 *
 * // on AI turn
 * const seq = await svc.findBestSequence(snapshot, 'b');
 *
 * // unmount
 * svc.dispose();
 * ```
 */

import type { BackgammonState, StoneColor, MoveSequence } from '../engine/types';
import type { AILevelConfig } from '../config/aiLevels';
import { AI_LEVEL_CONFIG } from '../config/aiLevels';

// ---------------------------------------------------------------------------
// Worker message types (mirrored here for type safety on the main-thread side)
// ---------------------------------------------------------------------------

/** Messages the main thread sends to the worker. */
type WorkerInMessage =
  | { type: 'think'; state: BackgammonState; aiColor: StoneColor; level: AILevelConfig }
  | { type: 'stop' };

/** Messages the worker posts back to the main thread. */
type WorkerOutMessage =
  | { type: 'result'; sequence: MoveSequence }
  | { type: 'stopped' };

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

/**
 * Main-thread service that manages the Backgammon AI Web Worker lifecycle and
 * exposes a Promise-based API for requesting move sequences.
 *
 * Only one search may be active at a time — starting a new search cancels the
 * previous one and rejects its promise with `'Search aborted'`.
 *
 * @example
 * ```ts
 * const svc = new BackgammonAIService();
 * svc.init();
 * svc.setLevel(AI_LEVEL_CONFIG.hard);
 *
 * const seq = await svc.findBestSequence(gameSnapshot, 'b');
 * // seq is a MoveSequence — apply it via executeSubMove in sequence
 *
 * svc.dispose(); // call on unmount
 * ```
 */
export class BackgammonAIService {
  private worker: Worker | null = null;
  private resolver: ((seq: MoveSequence) => void) | null = null;
  private rejecter: ((e: Error) => void) | null = null;
  private config: AILevelConfig = AI_LEVEL_CONFIG.medium;

  /**
   * Spawn the expectimax Web Worker. Must be called before `findBestSequence`.
   * Safe to call only once — subsequent calls create duplicate workers.
   *
   * @example
   * ```ts
   * const svc = new BackgammonAIService();
   * svc.init();
   * ```
   */
  init(): void {
    this.worker = new Worker(
      new URL('./backgammonWorker.ts', import.meta.url),
      { type: 'module' },
    );
    this.worker.addEventListener('message', this.handleMessage);
  }

  /**
   * Update the search depth and iteration budget for subsequent searches.
   * Does not interrupt an in-flight search.
   *
   * @param config - AI level configuration from `AI_LEVEL_CONFIG`.
   *
   * @example
   * ```ts
   * svc.setLevel(AI_LEVEL_CONFIG.easy);
   * ```
   */
  setLevel(config: AILevelConfig): void {
    this.config = config;
  }

  /**
   * Request the best move sequence for the given game state snapshot.
   *
   * Only one search can be active at a time. Calling this while a search is
   * in progress aborts the previous promise with `'Search aborted'`.
   *
   * @param state   - A serializable snapshot of the current `BackgammonState`.
   * @param aiColor - The AI's stone color (`'w'` or `'b'`).
   * @returns Promise that resolves with the best `MoveSequence` found.
   * @throws {Error} `'Worker not initialized'` if `init()` was not called.
   * @throws {Error} `'Search aborted'` if a newer call superseded this one.
   * @throws {Error} `'Search stopped'` if `stop()` was called explicitly.
   *
   * @example
   * ```ts
   * const seq = await svc.findBestSequence(state, 'b');
   * for (const move of seq) {
   *   store.executeSubMove(move.to, move.pips);
   * }
   * ```
   */
  findBestSequence(state: BackgammonState, aiColor: StoneColor): Promise<MoveSequence> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    // Abort any in-flight search.
    if (this.rejecter) {
      this.rejecter(new Error('Search aborted'));
      this.resolver = null;
      this.rejecter = null;
    }

    return new Promise<MoveSequence>((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;

      const msg: WorkerInMessage = {
        type: 'think',
        state,
        aiColor,
        level: this.config,
      };
      this.worker?.postMessage(msg);
    });
  }

  /**
   * Abort the current search and reject the pending promise with `'Search stopped'`.
   * Safe to call when no search is active — it is a no-op in that case.
   *
   * @example
   * ```ts
   * svc.stop(); // called when user resigns mid-AI-turn
   * ```
   */
  stop(): void {
    const msg: WorkerInMessage = { type: 'stop' };
    this.worker?.postMessage(msg);
    if (this.rejecter) {
      this.rejecter(new Error('Search stopped'));
      this.resolver = null;
      this.rejecter = null;
    }
  }

  /**
   * Stop any pending search, remove the message listener, and terminate the
   * underlying worker thread. The instance must not be used after this.
   *
   * Call inside a React `useEffect` cleanup to prevent worker leaks on unmount.
   *
   * @example
   * ```ts
   * useEffect(() => {
   *   svc.init();
   *   return () => svc.dispose();
   * }, []);
   * ```
   */
  dispose(): void {
    this.stop();
    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessage);
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Handles incoming messages from the worker and settles the pending promise.
   *
   * Bound as an arrow function so it can be used directly as an event listener
   * without losing the `this` context.
   *
   * @param e - The MessageEvent from the worker.
   */
  private handleMessage = (e: MessageEvent<WorkerOutMessage>): void => {
    const msg = e.data;

    if (msg.type === 'result' && this.resolver) {
      const resolve = this.resolver;
      this.resolver = null;
      this.rejecter = null;
      resolve(msg.sequence);
    } else if (msg.type === 'stopped' && this.rejecter) {
      const reject = this.rejecter;
      this.resolver = null;
      this.rejecter = null;
      reject(new Error('Search stopped'));
    }
  };
}
