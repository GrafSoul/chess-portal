/**
 * Scoring ruleset definitions for Go.
 *
 * Two supported rulesets:
 * - **Chinese (area scoring):** Score = territory + own stones on board +
 *   komi (for white). Prisoners are not counted separately.
 * - **Japanese (territory scoring):** Score = territory + prisoners +
 *   komi (for white). Stones on the board are not counted.
 */

/** Identifier for a supported scoring ruleset. */
export type ScoringRules = 'chinese' | 'japanese';

/** Descriptor of a scoring ruleset's constants and flags. */
export interface ScoringRulesConfig {
  /** Default komi (white compensation) for this ruleset. */
  defaultKomi: number;
  /** Whether stones on the board contribute to the score. */
  countsStones: boolean;
  /** Whether captured prisoners contribute to the score. */
  countsPrisoners: boolean;
}

/**
 * Map of scoring ruleset identifiers to their configuration.
 *
 * Chinese rules add stones-on-board (area scoring). Japanese rules add
 * prisoners (territory scoring). Default komi values follow the modern
 * conventions (7.5 for Chinese, 6.5 for Japanese) that prevent draws.
 */
export const SCORING_RULES: Record<ScoringRules, ScoringRulesConfig> = {
  chinese: {
    defaultKomi: 7.5,
    countsStones: true,
    countsPrisoners: false,
  },
  japanese: {
    defaultKomi: 6.5,
    countsStones: false,
    countsPrisoners: true,
  },
};
