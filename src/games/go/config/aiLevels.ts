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
export const GO_AI_LEVELS: Record<AILevel, AILevelConfig> = {
  easy: { timeBudgetMs: 500, maxPlayouts: 1000 },
  medium: { timeBudgetMs: 1500, maxPlayouts: 5000 },
  hard: { timeBudgetMs: 4000, maxPlayouts: 20000 },
  expert: { timeBudgetMs: 10000, maxPlayouts: 80000 },
};

/** Default AI level used when none is specified. */
export const DEFAULT_AI_LEVEL: AILevel = 'medium';
