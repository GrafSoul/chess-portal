import type { AILevelConfig } from '../engine/types';

/**
 * Path to the Stockfish worker script in /public.
 * Single-threaded lite build — does not require COOP/COEP cross-origin isolation.
 */
const STOCKFISH_WORKER_URL = '/stockfish/stockfish-18-lite-single.js';

/** UCI bestmove response — `bestmove e2e4` or `bestmove e7e8q` */
const BESTMOVE_REGEX = /^bestmove\s+([a-h][1-8][a-h][1-8][nbrq]?)/;

/**
 * UCI move format returned by Stockfish.
 * Example: "e2e4", "e7e8q" (promotion).
 */
export interface StockfishMove {
  from: string;
  to: string;
  promotion?: 'n' | 'b' | 'r' | 'q';
}

/**
 * Wraps the Stockfish WASM Web Worker and exposes a Promise-based API.
 *
 * Lifecycle:
 * 1. `init()` — spawn worker, send `uci` and wait for `uciok`, then `isready`/`readyok`.
 * 2. `setLevel(config)` — set Skill Level option for difficulty.
 * 3. `getBestMove(fen)` — returns the move Stockfish wants to play for the side to move.
 * 4. `stop()` — interrupts current search.
 * 5. `dispose()` — terminates the worker.
 *
 * Only one search runs at a time. Calling `getBestMove` while another search is
 * in progress will reject the previous one (`stop` is sent first).
 */
export class StockfishService {
  private worker: Worker | null = null;
  private ready = false;
  private currentResolver: ((move: StockfishMove) => void) | null = null;
  private currentRejecter: ((reason: Error) => void) | null = null;
  private currentMoveTimeMs = 1000;

  /** Initializes the worker and waits for the engine to be ready. */
  async init(): Promise<void> {
    if (this.ready) return;

    this.worker = new Worker(STOCKFISH_WORKER_URL);
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);

    // Wait for `uciok`
    await this.sendAndWait('uci', 'uciok');
    // Wait for `readyok`
    await this.sendAndWait('isready', 'readyok');

    this.ready = true;
  }

  /** Configure difficulty via Skill Level (0-20) and store moveTimeMs for searches. */
  setLevel(config: AILevelConfig): void {
    if (!this.worker) throw new Error('Stockfish not initialized');
    this.send(`setoption name Skill Level value ${config.skillLevel}`);
    this.currentMoveTimeMs = config.moveTimeMs;
  }

  /**
   * Asks Stockfish for the best move in the given position.
   * Resolves with the move once Stockfish replies with `bestmove`.
   */
  getBestMove(fen: string): Promise<StockfishMove> {
    if (!this.worker || !this.ready) {
      return Promise.reject(new Error('Stockfish not initialized'));
    }

    // If a previous search is in flight — abort it
    if (this.currentRejecter) {
      this.send('stop');
      this.currentRejecter(new Error('Search aborted'));
      this.currentResolver = null;
      this.currentRejecter = null;
    }

    return new Promise<StockfishMove>((resolve, reject) => {
      this.currentResolver = resolve;
      this.currentRejecter = reject;
      this.send(`position fen ${fen}`);
      this.send(`go movetime ${this.currentMoveTimeMs}`);
    });
  }

  /** Resets engine state for a new game. */
  newGame(): void {
    if (!this.worker) return;
    this.send('ucinewgame');
    this.send('isready');
  }

  /** Aborts the current search if any. */
  stop(): void {
    if (!this.worker) return;
    this.send('stop');
    if (this.currentRejecter) {
      this.currentRejecter(new Error('Search stopped'));
      this.currentResolver = null;
      this.currentRejecter = null;
    }
  }

  /** Terminates the worker and releases resources. */
  dispose(): void {
    this.stop();
    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessage);
      this.worker.removeEventListener('error', this.handleError);
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
  }

  // ── private ─────────────────────────────────────────────────────────────

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  /**
   * Sends a UCI command and resolves once a line containing `expected` is seen.
   * Used for handshake commands like `uci`/`uciok` and `isready`/`readyok`.
   */
  private sendAndWait(cmd: string, expected: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not created'));
        return;
      }
      const onMessage = (e: MessageEvent) => {
        const text = typeof e.data === 'string' ? e.data : '';
        if (text.includes(expected)) {
          this.worker?.removeEventListener('message', onMessage);
          resolve();
        }
      };
      this.worker.addEventListener('message', onMessage);
      this.send(cmd);
    });
  }

  private handleMessage = (e: MessageEvent) => {
    const text = typeof e.data === 'string' ? e.data : '';
    const match = text.match(BESTMOVE_REGEX);
    if (match && this.currentResolver) {
      const uci = match[1];
      const move: StockfishMove = {
        from: uci.substring(0, 2),
        to: uci.substring(2, 4),
      };
      if (uci.length === 5) {
        move.promotion = uci[4] as 'n' | 'b' | 'r' | 'q';
      }
      const resolver = this.currentResolver;
      this.currentResolver = null;
      this.currentRejecter = null;
      resolver(move);
    }
  };

  private handleError = (e: ErrorEvent) => {
    if (this.currentRejecter) {
      this.currentRejecter(new Error(`Stockfish worker error: ${e.message}`));
      this.currentResolver = null;
      this.currentRejecter = null;
    }
  };
}
