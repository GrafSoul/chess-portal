import type { CheckersAIConfig } from '../config/aiLevels';

/** Move returned by the AI worker */
export interface CheckersAIMove {
  from: string;
  to: string;
}

/**
 * Wraps the checkers minimax Web Worker with a Promise-based API.
 *
 * Lifecycle:
 * 1. `init()` — spawn the worker.
 * 2. `setLevel(config)` — store depth and delay for subsequent searches.
 * 3. `getBestMove(fen)` — returns a promise with the AI's chosen move.
 * 4. `stop()` — abort the current search (rejects the promise).
 * 5. `dispose()` — terminate the worker.
 */
export class CheckersAIService {
  private worker: Worker | null = null;
  private depth = 4;
  private delayMs = 200;
  private currentResolver: ((move: CheckersAIMove) => void) | null = null;
  private currentRejecter: ((err: Error) => void) | null = null;

  /** Initialize the worker */
  init(): void {
    this.worker = new Worker(
      new URL('./checkersWorker.ts', import.meta.url),
      { type: 'module' },
    );
    this.worker.addEventListener('message', this.handleMessage);
  }

  /** Set difficulty parameters */
  setLevel(config: CheckersAIConfig): void {
    this.depth = config.depth;
    this.delayMs = config.delayMs;
  }

  /** Request the best move for the given FEN position */
  getBestMove(fen: string): Promise<CheckersAIMove> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    // Abort any in-flight search
    if (this.currentRejecter) {
      this.currentRejecter(new Error('Search aborted'));
      this.currentResolver = null;
      this.currentRejecter = null;
    }

    return new Promise<CheckersAIMove>((resolve, reject) => {
      this.currentResolver = resolve;
      this.currentRejecter = reject;

      // Add artificial delay for lower difficulties
      const sendSearch = () => {
        this.worker?.postMessage({ type: 'search', fen, depth: this.depth });
      };

      if (this.delayMs > 0) {
        setTimeout(sendSearch, this.delayMs);
      } else {
        sendSearch();
      }
    });
  }

  /** Abort the current search */
  stop(): void {
    if (this.currentRejecter) {
      this.currentRejecter(new Error('Search stopped'));
      this.currentResolver = null;
      this.currentRejecter = null;
    }
  }

  /** Terminate the worker */
  dispose(): void {
    this.stop();
    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessage);
      this.worker.terminate();
      this.worker = null;
    }
  }

  private handleMessage = (e: MessageEvent) => {
    const data = e.data;
    if (data.type === 'bestmove' && this.currentResolver) {
      const resolver = this.currentResolver;
      this.currentResolver = null;
      this.currentRejecter = null;
      resolver({ from: data.from, to: data.to });
    } else if (data.type === 'error' && this.currentRejecter) {
      const rejecter = this.currentRejecter;
      this.currentResolver = null;
      this.currentRejecter = null;
      rejecter(new Error(data.message));
    }
  };
}
