/**
 * AI difficulty levels and their associated search parameters for
 * the Long Backgammon expectimax engine.
 *
 * Mirrors the structure used in `src/games/go/config/aiLevels.ts` so that
 * the AI worker and the settings panel can share the same pattern.
 *
 * @example
 * ```ts
 * import { AI_LEVEL_CONFIG, type AILevel } from '../config/aiLevels';
 *
 * const config = AI_LEVEL_CONFIG['medium'];
 * // config.depth === 3, config.iterationBudget === 5000
 * ```
 */

/**
 * Named AI difficulty levels exposed to the player in `BackgammonSettingsPanel`.
 *
 * - `'easy'`   — Shallow search; plays reasonable but makeable moves.
 * - `'medium'` — Standard search; resembles a capable amateur.
 * - `'hard'`   — Deep search with an enhanced heuristic; difficult to beat.
 */
export type AILevel = 'easy' | 'medium' | 'hard';

/**
 * Per-level expectimax configuration.
 *
 * `depth` is the number of half-plies (alternating player + chance nodes)
 * that the expectimax tree is expanded before calling the heuristic.
 * `iterationBudget` caps the total number of leaf evaluations per move to
 * prevent UI freezes in the Web Worker.
 */
export interface AILevelConfig {
  /**
   * Expectimax tree depth.
   *
   * - 1 → evaluate own move sequences only (greedy).
   * - 3 → own sequence + opponent dice chance node + opponent move.
   * - 5 → deeper look-ahead through two full ply + chance nodes.
   */
  depth: number;

  /**
   * Maximum number of board evaluations allowed per AI turn.
   * The worker aborts the search and returns the best move found so far
   * when this budget is exhausted.
   */
  iterationBudget: number;
}

/**
 * Mapping from `AILevel` to the concrete search parameters used by
 * `expectimax.ts` inside the Web Worker.
 *
 * Tune these numbers via self-play benchmarks before shipping. The current
 * values are conservative starting points:
 *
 * | Level  | depth | budget  |
 * |--------|-------|---------|
 * | easy   | 1     | 500     |
 * | medium | 3     | 5 000   |
 * | hard   | 5     | 50 000  |
 */
export const AI_LEVEL_CONFIG: Record<AILevel, AILevelConfig> = {
  easy: {
    depth: 1,
    iterationBudget: 500,
  },
  medium: {
    depth: 3,
    iterationBudget: 5_000,
  },
  hard: {
    depth: 5,
    iterationBudget: 50_000,
  },
} as const;
