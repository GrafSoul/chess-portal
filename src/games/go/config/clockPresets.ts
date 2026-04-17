/**
 * Clock-mode presets for Go games.
 *
 * Go supports three common time systems:
 * - **Standard** — main time with an optional per-move increment (Fischer style).
 * - **Byo-yomi** — main time followed by N periods of fixed seconds each.
 *   When main time runs out, each move must be completed within one period.
 *   Using a full period resets its countdown but does not consume it;
 *   failing to move within a period consumes one period. Losing all periods
 *   loses on time.
 * - **Unlimited** — no clock at all (casual / correspondence play).
 */

/** Discriminated union describing a clock configuration. */
export type ClockConfig =
  | {
      /** Standard main-time-plus-increment clock. */
      kind: 'standard';
      /** Main time in milliseconds. */
      mainMs: number;
      /** Per-move increment in milliseconds (0 for sudden death). */
      incrementMs: number;
    }
  | {
      /** Japanese-style byo-yomi clock. */
      kind: 'byo-yomi';
      /** Main time in milliseconds. */
      mainMs: number;
      /** Number of byo-yomi periods. */
      periods: number;
      /** Duration of each byo-yomi period, in milliseconds. */
      periodMs: number;
    }
  | {
      /** No clock — unlimited thinking time. */
      kind: 'unlimited';
    };

/** One second expressed in milliseconds. */
const SECOND = 1000;
/** One minute expressed in milliseconds. */
const MINUTE = 60 * SECOND;

/**
 * Available clock presets, keyed by identifier.
 *
 * Naming convention: `<family>-<variant>`.
 * Families: `standard-*`, `byoyomi-*`, `unlimited`.
 */
export const GO_CLOCK_PRESETS: Record<string, ClockConfig> = {
  // Standard (main time + optional increment)
  'standard-blitz': { kind: 'standard', mainMs: 5 * MINUTE, incrementMs: 0 },
  'standard-rapid': { kind: 'standard', mainMs: 15 * MINUTE, incrementMs: 10 * SECOND },
  'standard-classical': { kind: 'standard', mainMs: 30 * MINUTE, incrementMs: 0 },

  // Byo-yomi (main time + periods)
  'byoyomi-casual': {
    kind: 'byo-yomi',
    mainMs: 1 * MINUTE,
    periods: 3,
    periodMs: 30 * SECOND,
  },
  'byoyomi-standard': {
    kind: 'byo-yomi',
    mainMs: 5 * MINUTE,
    periods: 5,
    periodMs: 30 * SECOND,
  },
  'byoyomi-long': {
    kind: 'byo-yomi',
    mainMs: 10 * MINUTE,
    periods: 3,
    periodMs: 60 * SECOND,
  },

  // Unlimited
  unlimited: { kind: 'unlimited' },
};

/** Default preset used when no explicit choice is made. */
export const DEFAULT_GO_CLOCK_PRESET = 'byoyomi-standard';
