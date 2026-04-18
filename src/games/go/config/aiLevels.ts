/**
 * AI difficulty-level configuration for the Go engine.
 *
 * Each level defines a time budget per move and a maximum number of Monte
 * Carlo playouts. These parameters are tuned in later sprints; the values
 * below are conservative defaults used for type-checking and test seeding.
 */

/** Supported AI difficulty levels. */
export type AILevel = 'easy' | 'medium' | 'hard' | 'expert';

/** Parameters for a single AI level. */
export interface AILevelConfig {
  /** Maximum wall-clock time (ms) the AI may spend per move. */
  timeBudgetMs: number;
  /** Maximum number of Monte Carlo playouts to perform per move. */
  maxPlayouts: number;
}

/** Map of AI level identifier to its configuration. */
// Playout counts are calibrated for both 9×9 and 19×19 boards.
// On 19×19 each playout can take ~5–15 ms due to board size, so even
// 1 000 playouts with tactical rollouts can approach the time budget.
// These values give snappy responses without sacrificing quality.
export const GO_AI_LEVELS: Record<AILevel, AILevelConfig> = {
  easy:   { timeBudgetMs: 400,  maxPlayouts: 300  },
  medium: { timeBudgetMs: 1200, maxPlayouts: 1500 },
  hard:   { timeBudgetMs: 3000, maxPlayouts: 6000 },
  expert: { timeBudgetMs: 7000, maxPlayouts: 25000 },
};

/** Default AI level used when none is specified. */
export const DEFAULT_AI_LEVEL: AILevel = 'medium';
