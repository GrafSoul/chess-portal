/**
 * Wraps the Go MCTS Web Worker with a Promise-based API.
 *
 * Lifecycle:
 * 1. `init()` — spawn the worker.
 * 2. `setLevel(config)` — store time budget and playout cap for subsequent searches.
 * 3. `getBestMove(snapshot)` — returns a promise with the AI's chosen move.
 * 4. `stop()` — abort the current search (rejects the promise).
 * 5. `dispose()` — terminate the worker.
 */

import type { AILevelConfig } from '../config/aiLevels';
import type { GoEngineJSON, Point } from '../engine/types';

/**
 * Result returned by the AI after MCTS search: either a stone placement or a pass.
 *
 * When `kind === 'play'`, `point` is always defined.
 * When `kind === 'pass'`, `point` is absent — the AI chose to pass the turn.
 *
 * @example
 * ```ts
 * const move = await service.getBestMove(snapshot);
 * if (move.kind === 'play' && move.point) {
 *   engine.playAt(move.point.x, move.point.y);
 * } else {
 *   engine.pass();
 * }
 * ```
 */
export interface GoAIMove {
  /** `'play'` for stone placement, `'pass'` to pass turn. */
  kind: 'play' | 'pass';
  /** Target intersection. Defined only when `kind === 'play'`. */
  point?: Point;
}

/**
 * Service wrapper around the Go MCTS Web Worker.
 *
 * Only one search may be in flight at a time — a new `getBestMove` call
 * automatically aborts any prior pending search to prevent stale responses.
 *
 * Typical lifecycle inside a React hook:
 * ```ts
 * // mount
 * const service = new GoAIService();
 * service.init();
 * service.setLevel(GO_AI_LEVELS['medium']);
 *
 * // on AI turn
 * const move = await service.getBestMove(engine.toJSON());
 *
 * // unmount
 * service.dispose();
 * ```
 */
export class GoAIService {
  private worker: Worker | null = null;
  private timeBudgetMs = 1500;
  private maxPlayouts = 5000;
  private currentResolver: ((move: GoAIMove) => void) | null = null;
  private currentRejecter: ((err: Error) => void) | null = null;

  /**
   * Spawn the MCTS Web Worker. Must be called before `getBestMove`.
   * Safe to call only once — subsequent calls will create duplicate workers.
   *
   * @example
   * ```ts
   * const service = new GoAIService();
   * service.init(); // worker is now running
   * ```
   */
  init(): void {
    this.worker = new Worker(
      new URL('./goWorker.ts', import.meta.url),
      { type: 'module' },
    );
    this.worker.addEventListener('message', this.handleMessage);
  }

  /**
   * Update difficulty parameters for subsequent searches.
   * Takes effect on the next `getBestMove` call — does not interrupt an
   * in-flight search.
   *
   * @param config - Time budget and playout cap from `GO_AI_LEVELS`.
   *
   * @example
   * ```ts
   * service.setLevel(GO_AI_LEVELS['hard']); // ~3 s, 10 000 playouts
   * ```
   */
  setLevel(config: AILevelConfig): void {
    this.timeBudgetMs = config.timeBudgetMs;
    this.maxPlayouts = config.maxPlayouts;
  }

  /**
   * Request the best move for the given engine snapshot.
   *
   * Only one search can be active at a time. Calling this while a search is
   * in progress will abort the previous promise with `'Search aborted'`.
   *
   * @param snapshot - Serialized engine state (from `engine.toJSON()`).
   * @returns Promise that resolves with the MCTS-selected move.
   * @throws {Error} With message `'Worker not initialized'` if `init()` was not called.
   * @throws {Error} With message `'Search aborted'` if a newer call superseded this one.
   * @throws {Error} With message `'Search stopped'` if `stop()` was called explicitly.
   * @throws {Error} Propagated from the worker on internal MCTS failures.
   *
   * @example
   * ```ts
   * const move = await service.getBestMove(engine.toJSON());
   * if (move.kind === 'play' && move.point) {
   *   store.playAt(move.point);
   * } else {
   *   store.pass();
   * }
   * ```
   */
  getBestMove(snapshot: GoEngineJSON): Promise<GoAIMove> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    // Abort any in-flight search
    if (this.currentRejecter) {
      this.currentRejecter(new Error('Search aborted'));
      this.currentResolver = null;
      this.currentRejecter = null;
    }

    return new Promise<GoAIMove>((resolve, reject) => {
      this.currentResolver = resolve;
      this.currentRejecter = reject;

      this.worker?.postMessage({
        type: 'search',
        snapshot,
        timeBudgetMs: this.timeBudgetMs,
        maxPlayouts: this.maxPlayouts,
      });
    });
  }

  /**
   * Abort the current search and reject the pending promise.
   *
   * Safe to call when no search is active — it is a no-op in that case.
   * Note: the worker itself cannot be interrupted mid-search (Web Workers have
   * no preemption), but the result will be silently discarded.
   *
   * @example
   * ```ts
   * // Cancel AI search when the user resigns
   * service.stop();
   * ```
   */
  stop(): void {
    if (this.currentRejecter) {
      this.currentRejecter(new Error('Search stopped'));
      this.currentResolver = null;
      this.currentRejecter = null;
    }
  }

  /**
   * Stop any pending search, remove the message listener, and terminate the
   * underlying worker thread. The service instance must not be used after this.
   *
   * Call inside a React `useEffect` cleanup to prevent worker leaks on unmount.
   *
   * @example
   * ```ts
   * useEffect(() => {
   *   service.init();
   *   return () => service.dispose();
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
   * Dispatch worker responses to the pending resolver or rejecter.
   * Bound as an arrow function so it can be passed directly as an event listener.
   *
   * Handles three message types from the worker:
   * - `'move'` — stone placement; resolves with `{ kind: 'play', point }`.
   * - `'pass'` — AI chose to pass; resolves with `{ kind: 'pass' }`.
   * - `'error'` — MCTS threw; rejects with the error message.
   */
  private handleMessage = (e: MessageEvent) => {
    const data = e.data;
    if (data.type === 'move' && this.currentResolver) {
      const resolver = this.currentResolver;
      this.currentResolver = null;
      this.currentRejecter = null;
      resolver({ kind: 'play', point: data.point });
    } else if (data.type === 'pass' && this.currentResolver) {
      const resolver = this.currentResolver;
      this.currentResolver = null;
      this.currentRejecter = null;
      resolver({ kind: 'pass' });
    } else if (data.type === 'error' && this.currentRejecter) {
      const rejecter = this.currentRejecter;
      this.currentResolver = null;
      this.currentRejecter = null;
      rejecter(new Error(data.message));
    }
  };
}
