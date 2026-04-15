/**
 * Clock time-control presets for checkers.
 *
 * Identical structure to chess — checkers games tend to be shorter, so the
 * same presets work well. Re-exported here so the checkers module is fully
 * self-contained.
 */

/** Clock preset shape */
export interface ClockPreset {
  /** Human-readable label */
  label: string;
  /** Starting time per side in milliseconds */
  timeMs: number;
  /** Increment added after each move in milliseconds */
  incrementMs: number;
}

/** Available clock time-control presets */
export const CLOCK_PRESETS: Record<string, ClockPreset> = {
  bullet: { label: 'Bullet 1+0', timeMs: 60_000, incrementMs: 0 },
  blitz: { label: 'Blitz 3+2', timeMs: 180_000, incrementMs: 2_000 },
  rapid: { label: 'Rapid 10+5', timeMs: 600_000, incrementMs: 5_000 },
  classical: { label: 'Classical 30+0', timeMs: 1_800_000, incrementMs: 0 },
  unlimited: { label: 'Unlimited', timeMs: Infinity, incrementMs: 0 },
} as const;

/** Default clock preset key */
export const DEFAULT_CLOCK_PRESET = 'rapid';
