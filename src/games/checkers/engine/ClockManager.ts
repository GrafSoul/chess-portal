import type { PieceColor } from './types';

/** Callback fired on each tick */
type TickCallback = (white: number, black: number) => void;

/** Callback fired when time runs out */
type TimeoutCallback = (loser: PieceColor) => void;

/**
 * Checkers clock — two independent countdown timers with increment support.
 * Pure TypeScript, no React dependencies.
 */
export class ClockManager {
  private whiteTimeMs: number;
  private blackTimeMs: number;
  private incrementMs: number;
  private activeColor: PieceColor | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTickTimestamp = 0;
  private onTick: TickCallback | null = null;
  private onTimeout: TimeoutCallback | null = null;

  constructor(timeMs: number, incrementMs: number) {
    this.whiteTimeMs = timeMs;
    this.blackTimeMs = timeMs;
    this.incrementMs = incrementMs;
  }

  /** Subscribe to tick events (called ~every 100ms) */
  setOnTick(callback: TickCallback): void {
    this.onTick = callback;
  }

  /** Subscribe to timeout events */
  setOnTimeout(callback: TimeoutCallback): void {
    this.onTimeout = callback;
  }

  /** Start the clock for a specific color */
  start(color: PieceColor): void {
    this.stop();
    this.activeColor = color;
    this.lastTickTimestamp = performance.now();

    this.intervalId = setInterval(() => {
      this.tick();
    }, 100);
  }

  /** Stop the clock (pause) */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.activeColor) {
      this.tick();
    }
    this.activeColor = null;
  }

  /** Switch to the other player's clock and add increment */
  switchTurn(): void {
    if (!this.activeColor) return;

    this.tick();

    if (this.activeColor === 'w') {
      this.whiteTimeMs += this.incrementMs;
    } else {
      this.blackTimeMs += this.incrementMs;
    }

    const nextColor: PieceColor = this.activeColor === 'w' ? 'b' : 'w';
    this.start(nextColor);
  }

  /** Remaining time for white (ms) */
  get whiteTime(): number {
    return Math.max(0, this.whiteTimeMs);
  }

  /** Remaining time for black (ms) */
  get blackTime(): number {
    return Math.max(0, this.blackTimeMs);
  }

  /** Whether the clock is currently running */
  get isRunning(): boolean {
    return this.activeColor !== null;
  }

  /** Reset clocks to new time values */
  reset(timeMs: number, incrementMs: number): void {
    this.stop();
    this.whiteTimeMs = timeMs;
    this.blackTimeMs = timeMs;
    this.incrementMs = incrementMs;
    this.onTick?.(this.whiteTimeMs, this.blackTimeMs);
  }

  /** Destroy — clean up interval */
  destroy(): void {
    this.stop();
    this.onTick = null;
    this.onTimeout = null;
  }

  private tick(): void {
    const now = performance.now();
    const delta = now - this.lastTickTimestamp;
    this.lastTickTimestamp = now;

    if (!this.activeColor) return;

    if (this.activeColor === 'w') {
      this.whiteTimeMs -= delta;
    } else {
      this.blackTimeMs -= delta;
    }

    if (this.whiteTimeMs <= 0) {
      this.whiteTimeMs = 0;
      this.stop();
      this.onTimeout?.('w');
    }
    if (this.blackTimeMs <= 0) {
      this.blackTimeMs = 0;
      this.stop();
      this.onTimeout?.('b');
    }

    this.onTick?.(this.whiteTime, this.blackTime);
  }

  /** Format milliseconds to MM:SS string */
  static formatTime(ms: number): string {
    if (!isFinite(ms)) return '--:--';
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
