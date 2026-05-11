/**
 * Dice utilities for Long Backgammon.
 *
 * Provides random rolling, doubles expansion, and the precomputed probability
 * distribution over all 21 unique two-dice outcomes used by the expectimax AI.
 */

/**
 * Rolls two fair six-sided dice and returns the result.
 *
 * Uses `Math.random()` which is sufficient for a UI game but NOT for the
 * seeded-debug mode (that layer adds a PRNG wrapper before calling this).
 *
 * @returns A tuple `[d1, d2]` where each value is an integer in `[1, 6]`.
 *
 * @example
 * ```ts
 * const [d1, d2] = rollDice(); // e.g. [3, 5]
 * ```
 */
export function rollDice(): [number, number] {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return [d1, d2];
}

/**
 * Expands a dice roll into the sequence of die values available for the turn.
 *
 * For doubles, the player gets four moves with the same value.
 * For non-doubles, the player gets two moves.
 *
 * @param values - The raw two-die roll `[d1, d2]`.
 * @returns An array of die values: length 4 for doubles, 2 for non-doubles.
 *
 * @example
 * ```ts
 * expandDoubles([3, 3]); // → [3, 3, 3, 3]
 * expandDoubles([2, 5]); // → [2, 5]
 * ```
 */
export function expandDoubles(values: [number, number]): number[] {
  const [d1, d2] = values;
  if (d1 === d2) {
    return [d1, d1, d1, d1];
  }
  return [d1, d2];
}

/**
 * Describes one unique two-die outcome together with its probability.
 */
export interface DiceOutcome {
  /** The two dice values as rolled (pair, with `values[0] <= values[1]`). */
  values: [number, number];
  /** Probability of this outcome over all 36 equally-likely rolls. */
  probability: number;
}

/**
 * Returns the complete probability distribution over all 21 unique two-dice
 * outcomes (canonical pairs with `d1 ≤ d2`).
 *
 * Probabilities:
 * - Doubles (6 outcomes, e.g. 1-1): each has probability `1/36`.
 * - Non-doubles (15 outcomes, e.g. 1-2): each has probability `2/36` because
 *   both orderings (d1,d2) and (d2,d1) map to the same canonical pair.
 *
 * The 21 probabilities sum to exactly 1.0 (within floating-point precision).
 *
 * Used by the expectimax engine to compute expected values over chance nodes.
 *
 * @returns Array of 21 `DiceOutcome` objects, ordered doubles-first then
 *          non-doubles in lexicographic order.
 *
 * @example
 * ```ts
 * const dist = enumerateDiceDistribution();
 * dist.length; // → 21
 * dist.reduce((s, o) => s + o.probability, 0); // ≈ 1.0
 * ```
 */
export function enumerateDiceDistribution(): DiceOutcome[] {
  const results: DiceOutcome[] = [];

  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = d1; d2 <= 6; d2++) {
      const isDouble = d1 === d2;
      results.push({
        values: [d1, d2],
        // 1 ordering for doubles, 2 orderings for non-doubles → /36 each
        probability: isDouble ? 1 / 36 : 2 / 36,
      });
    }
  }

  return results;
}

/**
 * Comparison function for ordering die values when applying the
 * "must play the larger die if only one is playable" rule.
 *
 * Returns a negative number if `a > b` (so larger comes first in a sort),
 * meaning that when filtering for the "prefer larger die" rule the first
 * element after sorting is the die that must be played.
 *
 * @param a - First die value.
 * @param b - Second die value.
 * @returns Negative when `a` is larger, positive when `b` is larger, 0 when equal.
 *
 * @example
 * ```ts
 * [2, 6].sort(comparePriority); // → [6, 2]
 * ```
 */
export function comparePriority(a: number, b: number): number {
  return b - a; // descending: larger die has higher priority
}
