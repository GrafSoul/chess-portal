/**
 * Rule presets for Long Backgammon (Длинные нарды).
 *
 * Every contested rule in Long Backgammon is represented as a flag inside
 * `BackgammonRules`. This module exports the standard presets that map to
 * named playing styles: Classic, Strict, Relaxed, Caucasian, and Custom.
 *
 * The user selects a preset in `BackgammonSettingsPanel` before the game
 * starts. Changing presets triggers a full game reset via `handleNewGame`.
 *
 * @example
 * ```ts
 * import { RULE_PRESETS } from '../config/variants';
 * const rules = RULE_PRESETS.classic;
 * ```
 */

/**
 * All configurable rule flags for a Long Backgammon game.
 *
 * Every field corresponds to a disputed rule that varies across regions,
 * clubs, and informal house rules.
 */
export interface BackgammonRules {
  /**
   * When `true`, rolling 6-6, 4-4, or 3-3 on the very first turn allows
   * the moving player to take 2 stones off the head instead of the usual 1.
   * Applies only when `isFirstTurn` is `true` in `BackgammonState`.
   */
  headExceptionOnFirstDoubles: boolean;

  /**
   * How to handle a prime of 6 consecutive same-color points.
   *
   * - `'classical'`        — Forbidden only if no opponent stone has
   *                          already passed the blocking prime.
   * - `'always-allowed'`   — A 6-block may always be formed.
   * - `'always-forbidden'` — A 6-block may never be formed.
   */
  sixBlockRule: 'classical' | 'always-allowed' | 'always-forbidden';

  /**
   * When `true`, winning with the opponent having zero stones borne off
   * AND still having stones outside the winner's home counts as "Kokc"
   * (triple win, 3 points) instead of Mars (double win, 2 points).
   */
  enableKokc: boolean;

  /**
   * When `true`, which side moves first is determined by each player
   * rolling one die — the higher roll wins the first turn.
   * When `false`, White always moves first.
   */
  firstMoveByDiceRoll: boolean;

  /**
   * When `true` (classic rule), if a player can only use one of the two
   * dice they must play the larger die value rather than the smaller.
   * Should always be `true` in standard play; exposed as a flag for
   * completeness and testing.
   */
  strictMaxDieRule: boolean;
}

/**
 * Named collection of `BackgammonRules` presets.
 *
 * Each preset is an object literal that satisfies `BackgammonRules` in full
 * so TypeScript can catch missing or extra keys at compile time.
 */
export interface RulePresets {
  /** Standard Long Backgammon. Head exception on 6-6/4-4/3-3 first turn; classical 6-block; no Kokc; dice-roll for first move. */
  classic: BackgammonRules;
  /** Strictest tournament rules. No head exception; 6-block always forbidden; Kokc enabled; dice-roll for first move. */
  strict: BackgammonRules;
  /** Casual / relaxed play. Head exception enabled; 6-block always allowed; no Kokc; White always moves first. */
  relaxed: BackgammonRules;
  /** Caucasian regional rules. Head exception enabled; classical 6-block; Kokc enabled; dice-roll for first move. */
  caucasian: BackgammonRules;
  /**
   * Placeholder for user-defined rules. All fields start identical to
   * `classic`; the UI overrides them individually.
   */
  custom: BackgammonRules;
}

/**
 * All built-in rule presets for Long Backgammon.
 *
 * Import and spread a preset to build a `BackgammonRules` object:
 *
 * @example
 * ```ts
 * const rules: BackgammonRules = { ...RULE_PRESETS.strict };
 * ```
 */
export const RULE_PRESETS: RulePresets = {
  classic: {
    headExceptionOnFirstDoubles: true,
    sixBlockRule: 'classical',
    enableKokc: false,
    firstMoveByDiceRoll: true,
    strictMaxDieRule: true,
  },
  strict: {
    headExceptionOnFirstDoubles: false,
    sixBlockRule: 'always-forbidden',
    enableKokc: true,
    firstMoveByDiceRoll: true,
    strictMaxDieRule: true,
  },
  relaxed: {
    headExceptionOnFirstDoubles: true,
    sixBlockRule: 'always-allowed',
    enableKokc: false,
    firstMoveByDiceRoll: false,
    strictMaxDieRule: true,
  },
  caucasian: {
    headExceptionOnFirstDoubles: true,
    sixBlockRule: 'classical',
    enableKokc: true,
    firstMoveByDiceRoll: true,
    strictMaxDieRule: true,
  },
  custom: {
    headExceptionOnFirstDoubles: true,
    sixBlockRule: 'classical',
    enableKokc: false,
    firstMoveByDiceRoll: true,
    strictMaxDieRule: true,
  },
} as const;
