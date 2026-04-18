/**
 * Two-side clock for Go with support for three time-control families:
 *
 * - **standard** — main time plus optional Fischer-style per-move increment.
 *   Running out of main time loses on time.
 * - **byo-yomi** — main time, followed by N periods of equal length.
 *   When main time runs out, the player enters byo-yomi: they must complete
 *   each subsequent move within one period. Finishing a move with time left
 *   in the period resets it (periods do not deplete). Running out of period
 *   time consumes one period; losing all periods loses on time.
 * - **unlimited** — no clock. `start` / `switchTurn` are no-ops, no tick events.
 *
 * Pure TypeScript, no React dependencies. UI wires up callbacks and starts /
 * stops the clock based on game-lifecycle state.
 */

import type { ClockConfig } from '../config/clockPresets';
import type { Stone } from './types';

/** Per-color remaining time snapshot. */
export interface GoClockSnapshot {
  /** Main-time remaining in milliseconds (0 once the player has entered byo-yomi). */
  mainMs: number;
  /** Byo-yomi periods remaining. Always `0` for `standard` / `unlimited` clocks. */
  periodsLeft: number;
  /** Current byo-yomi period countdown in ms. `0` when not in byo-yomi. */
  periodMs: number;
  /** Whether this side has entered byo-yomi (main time exhausted). */
  inByoyomi: boolean;
}

/** Combined snapshot of both sides emitted on every tick. */
export interface GoClockState {
  black: GoClockSnapshot;
  white: GoClockSnapshot;
}

/** Callback fired approximately every 100 ms with the current clock state. */
export type GoClockTickCallback = (state: GoClockState) => void;

/** Callback fired when one player loses on time. */
export type GoClockTimeoutCallback = (loser: Stone) => void;

/** Tick frequency in milliseconds. */
const TICK_INTERVAL_MS = 100;

/**
 * Two-side Go clock implementing standard / byo-yomi / unlimited time controls.
 *
 * Only one side's time counts down at a time. Call {@link switchTurn} on each
 * accepted move to stop the current side, apply increment or period reset,
 * and start the opponent's clock.
 *
 * @example
 * ```ts
 * const clock = new GoClockManager(GO_CLOCK_PRESETS['byoyomi-standard']);
 * clock.setOnTick((state) => updateUI(state));
 * clock.setOnTimeout((loser) => endGame(loser));
 * clock.start('b');
 * // ... on move accepted:
 * clock.switchTurn();
 * ```
 */
export class GoClockManager {
  private config: ClockConfig;
  private black: GoClockSnapshot;
  private white: GoClockSnapshot;
  private activeColor: Stone | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;
  private onTick: GoClockTickCallback | null = null;
  private onTimeout: GoClockTimeoutCallback | null = null;

  /**
   * Build a clock with the given configuration.
   *
   * @param config - Preset chosen in settings (standard / byo-yomi / unlimited).
   */
  constructor(config: ClockConfig) {
    this.config = config;
    this.black = makeSnapshot(config);
    this.white = makeSnapshot(config);
  }

  /** Whether this clock runs at all (false for `unlimited`). */
  get isEnabled(): boolean {
    return this.config.kind !== 'unlimited';
  }

  /** Current running side, or `null` when paused / stopped. */
  get activeSide(): Stone | null {
    return this.activeColor;
  }

  /** Current full snapshot (both sides). */
  get state(): GoClockState {
    return { black: { ...this.black }, white: { ...this.white } };
  }

  /** Subscribe to periodic tick events (~10 Hz). Replaces any prior subscription. */
  setOnTick(cb: GoClockTickCallback): void {
    this.onTick = cb;
  }

  /** Subscribe to the time-loss event. Replaces any prior subscription. */
  setOnTimeout(cb: GoClockTimeoutCallback): void {
    this.onTimeout = cb;
  }

  /**
   * Start the clock for the given side. No-op for `unlimited`.
   * Stops any prior interval before starting a new one.
   */
  start(color: Stone): void {
    if (!this.isEnabled) return;
    this.stopInterval();
    this.activeColor = color;
    this.lastTickAt = performance.now();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  /** Stop the clock (pause without altering remaining times). */
  stop(): void {
    if (this.activeColor) this.tick(); // flush final delta into the active side
    this.stopInterval();
    this.activeColor = null;
  }

  /**
   * Called after a move lands. Applies time bonus, then starts the opposite
   * side's clock. No-op when clock is disabled or not running.
   *
   * - **standard:** adds `incrementMs` to the side that just moved.
   * - **byo-yomi:** resets the period if the side is in byo-yomi.
   */
  switchTurn(): void {
    if (!this.isEnabled) return;
    if (!this.activeColor) return;

    // Flush pending tick delta before bonus/reset.
    this.tick();

    const mover = this.activeColor;
    const moverSnap = mover === 'b' ? this.black : this.white;

    if (this.config.kind === 'standard') {
      moverSnap.mainMs += this.config.incrementMs;
    } else if (this.config.kind === 'byo-yomi' && moverSnap.inByoyomi) {
      // Reset the period — player retained the period by moving in time.
      moverSnap.periodMs = this.config.periodMs;
    }

    const next: Stone = mover === 'b' ? 'w' : 'b';
    this.start(next);
    this.emitTick();
  }

  /** Reset both sides to the starting values for `config`. Stops the interval. */
  reset(config?: ClockConfig): void {
    this.stopInterval();
    if (config) this.config = config;
    this.black = makeSnapshot(this.config);
    this.white = makeSnapshot(this.config);
    this.activeColor = null;
    this.emitTick();
  }

  /** Tear down — stop the interval and drop callbacks. */
  destroy(): void {
    this.stopInterval();
    this.activeColor = null;
    this.onTick = null;
    this.onTimeout = null;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Consume elapsed wall-time from the active side and fire callbacks. */
  private tick(): void {
    const now = performance.now();
    const delta = now - this.lastTickAt;
    this.lastTickAt = now;

    if (!this.activeColor || delta <= 0) return;

    const snap = this.activeColor === 'b' ? this.black : this.white;
    this.applyDelta(snap, delta);

    if (isTimedOut(snap, this.config)) {
      const loser = this.activeColor;
      // Freeze at zero and stop the clock; emit tick first so UI sees `0`.
      snap.mainMs = 0;
      snap.periodMs = 0;
      snap.periodsLeft = 0;
      this.emitTick();
      this.stop();
      this.onTimeout?.(loser);
      return;
    }

    this.emitTick();
  }

  /** Decrement the appropriate counter(s) in `snap` by `delta` milliseconds. */
  private applyDelta(snap: GoClockSnapshot, delta: number): void {
    const cfg = this.config;
    if (cfg.kind === 'standard') {
      snap.mainMs = Math.max(0, snap.mainMs - delta);
      return;
    }
    if (cfg.kind === 'byo-yomi') {
      if (!snap.inByoyomi) {
        if (snap.mainMs > delta) {
          snap.mainMs -= delta;
          return;
        }
        // Main time exhausted — flip to byo-yomi with the remainder of delta
        // consumed from the first period.
        const overflow = delta - snap.mainMs;
        snap.mainMs = 0;
        snap.inByoyomi = true;
        snap.periodMs = cfg.periodMs;
        this.consumePeriodTime(snap, overflow, cfg.periodMs);
        return;
      }
      this.consumePeriodTime(snap, delta, cfg.periodMs);
    }
  }

  /**
   * Decrement the current byo-yomi period. When a period expires, consume one
   * period and refresh the countdown. Carries overflow into the next period
   * if multiple periods expire within one tick (safety).
   */
  private consumePeriodTime(
    snap: GoClockSnapshot,
    delta: number,
    periodMs: number,
  ): void {
    let remaining = delta;
    while (remaining > 0 && snap.periodsLeft > 0) {
      if (snap.periodMs > remaining) {
        snap.periodMs -= remaining;
        return;
      }
      remaining -= snap.periodMs;
      snap.periodsLeft -= 1;
      snap.periodMs = snap.periodsLeft > 0 ? periodMs : 0;
    }
  }

  private emitTick(): void {
    this.onTick?.(this.state);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build an initial per-side snapshot from a `ClockConfig`. */
function makeSnapshot(config: ClockConfig): GoClockSnapshot {
  if (config.kind === 'standard') {
    return { mainMs: config.mainMs, periodsLeft: 0, periodMs: 0, inByoyomi: false };
  }
  if (config.kind === 'byo-yomi') {
    return {
      mainMs: config.mainMs,
      periodsLeft: config.periods,
      periodMs: config.periodMs,
      inByoyomi: false,
    };
  }
  // unlimited
  return { mainMs: Infinity, periodsLeft: 0, periodMs: 0, inByoyomi: false };
}

/** Whether the given snapshot represents a time-loss state. */
function isTimedOut(snap: GoClockSnapshot, config: ClockConfig): boolean {
  if (config.kind === 'standard') return snap.mainMs <= 0;
  if (config.kind === 'byo-yomi') {
    return snap.inByoyomi && snap.periodsLeft <= 0 && snap.periodMs <= 0;
  }
  return false;
}

/**
 * Format a snapshot for UI display.
 *
 * - Unlimited or negative → `'∞'`.
 * - Standard / pre-byo-yomi → `MM:SS`.
 * - In byo-yomi → `SS ×N` (seconds left in current period + periods remaining).
 */
export function formatGoClock(snap: GoClockSnapshot): string {
  if (!isFinite(snap.mainMs) && !snap.inByoyomi) return '∞';

  if (snap.inByoyomi) {
    const secs = Math.max(0, Math.ceil(snap.periodMs / 1000));
    return `${secs}s ×${snap.periodsLeft}`;
  }

  const total = Math.max(0, Math.ceil(snap.mainMs / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
