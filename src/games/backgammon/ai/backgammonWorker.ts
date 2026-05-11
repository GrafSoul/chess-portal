/**
 * Backgammon AI Web Worker — expectimax with chance nodes.
 *
 * Runs off the main thread so that the search never blocks the UI.
 * This file contains NO React, NO DOM access, and NO browser-only APIs.
 * It is a pure TypeScript module executed inside a Web Worker context.
 *
 * Message protocol:
 *
 * Main → Worker:
 * ```ts
 * { type: 'think'; state: BackgammonState; aiColor: StoneColor; level: AILevelConfig }
 * { type: 'stop' }
 * ```
 *
 * Worker → Main:
 * ```ts
 * { type: 'result'; sequence: MoveSequence }
 * { type: 'stopped' }
 * ```
 *
 * Algorithm: expectimax tree with alternating decision nodes (move choice)
 * and chance nodes (dice distribution). Budget-limited via node count to
 * prevent unbounded search time.
 */

import type { BackgammonState, StoneColor, MoveSequence } from '../engine/types';
import type { AILevelConfig } from '../config/aiLevels';
import { applySubMove, commitTurn, isTerminal } from '../engine/BackgammonEngine';
import { generateLegalSequences } from '../engine/moveGenerator';
import { enumerateDiceDistribution, expandDoubles } from '../engine/diceUtils';
import { evaluateHeuristic } from '../engine/evaluator';

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

/**
 * Messages the main thread sends to this worker.
 */
type WorkerInMessage =
  | { type: 'think'; state: BackgammonState; aiColor: StoneColor; level: AILevelConfig }
  | { type: 'stop' };

/**
 * Messages this worker posts back to the main thread.
 */
type WorkerOutMessage =
  | { type: 'result'; sequence: MoveSequence }
  | { type: 'stopped' };

// ---------------------------------------------------------------------------
// Budget sentinel — thrown (not returned) to abort the search early
// ---------------------------------------------------------------------------

/** Thrown when the iteration budget is exhausted during expectimax. */
class BudgetExhausted extends Error {
  constructor() {
    super('BudgetExhausted');
    this.name = 'BudgetExhausted';
  }
}

/** Mutable counter passed through the recursive search to track node evaluations. */
interface Budget {
  count: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Helper: apply a full MoveSequence to a BackgammonState
// ---------------------------------------------------------------------------

/**
 * Applies all sub-moves in `seq` sequentially to `state`, returning the
 * resulting state. Does NOT commit the turn — that is the caller's
 * responsibility.
 *
 * @param state - The starting game state.
 * @param seq   - The sequence of sub-moves to apply.
 * @returns New state after all sub-moves are applied.
 */
function applyFullSequence(state: BackgammonState, seq: MoveSequence): BackgammonState {
  let s = state;
  for (const move of seq) {
    s = applySubMove(s, move);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Expectimax
// ---------------------------------------------------------------------------

/**
 * Recursive expectimax search with alternating decision and chance nodes.
 *
 * Decision nodes (gameStatus === 'choosing'): enumerate all legal move sequences,
 * recurse on each child, keep the max or min depending on `maximizing`.
 *
 * Chance nodes (gameStatus === 'idle' | 'rolling'): enumerate all 21 unique
 * dice outcomes, weight each by its probability, return the expected value.
 *
 * @param state      - Current game state (may have dice set or not).
 * @param depth      - Remaining look-ahead depth. Zero triggers leaf evaluation.
 * @param maximizing - `true` when we are maximizing for `aiColor`.
 * @param aiColor    - The AI's stone color, used by the leaf heuristic.
 * @param budget     - Shared mutable node counter; throws `BudgetExhausted` when limit hit.
 * @returns Heuristic score from the perspective of `aiColor`.
 * @throws {BudgetExhausted} When `budget.count >= budget.limit`.
 */
function expectimax(
  state: BackgammonState,
  depth: number,
  maximizing: boolean,
  aiColor: StoneColor,
  budget: Budget,
): number {
  budget.count++;
  if (budget.count >= budget.limit) {
    throw new BudgetExhausted();
  }

  if (depth === 0 || isTerminal(state)) {
    return evaluateHeuristic(state, aiColor);
  }

  // ---- Decision node -------------------------------------------------------
  if (state.gameStatus === 'choosing' && state.dice !== null) {
    const seqs = generateLegalSequences(state, state.dice.values);

    // Single empty sequence means no legal moves — treat as leaf.
    if (seqs.length === 0 || (seqs.length === 1 && seqs[0].length === 0)) {
      return evaluateHeuristic(state, aiColor);
    }

    let best = maximizing ? -Infinity : Infinity;

    for (const seq of seqs) {
      const afterSeq = applyFullSequence(state, seq);
      // commitTurn flips turn, clears dice, sets gameStatus → 'rolling' (or 'ended').
      const child = commitTurn(afterSeq);
      const v = expectimax(child, depth - 1, !maximizing, aiColor, budget);
      best = maximizing ? Math.max(best, v) : Math.min(best, v);
    }

    return best;
  }

  // ---- Chance node ---------------------------------------------------------
  // gameStatus is 'idle' or 'rolling' — dice not yet set; average over all outcomes.
  const dist = enumerateDiceDistribution();
  let expected = 0;

  for (const outcome of dist) {
    const remaining = expandDoubles(outcome.values);
    const childState: BackgammonState = {
      ...state,
      dice: { values: outcome.values, remaining },
      gameStatus: 'choosing',
    };
    const v = expectimax(childState, depth - 1, maximizing, aiColor, budget);
    expected += outcome.probability * v;
  }

  return expected;
}

// ---------------------------------------------------------------------------
// Root search: find the best sequence at the current decision node
// ---------------------------------------------------------------------------

/**
 * Selects the best move sequence for the AI given the current game state.
 *
 * - Returns `[]` (empty) if no legal sequences exist (auto-skip situation).
 * - Returns the single sequence immediately if only one legal option exists.
 * - On `easy` level, 25% of the time returns a random sequence from the top 3
 *   candidates to introduce deliberate imperfection.
 * - Runs expectimax up to `config.depth - 1` plies after each candidate
 *   sequence, bounded by `config.iterationBudget`.
 * - If the budget is exhausted mid-search, returns the best sequence found so far.
 *
 * @param state   - Current game state; must be in `'choosing'` status with dice set.
 * @param aiColor - The AI's stone color.
 * @param config  - AI difficulty parameters (depth + iteration budget).
 * @returns The chosen `MoveSequence`; may be empty for a forced pass turn.
 */
function findBestSequence(
  state: BackgammonState,
  aiColor: StoneColor,
  config: AILevelConfig,
): MoveSequence {
  if (state.dice === null) return [];

  const seqs = generateLegalSequences(state, state.dice.values);

  if (seqs.length === 0) return [];
  // No legal moves — single empty sequence means the turn auto-skips.
  if (seqs.length === 1 && seqs[0].length === 0) return [];
  if (seqs.length === 1) return seqs[0];

  // Easy-level randomness: 25% chance of a random pick from up to top-3 options.
  if (config.depth === 1 && Math.random() < 0.25) {
    const pool = seqs.slice(0, Math.min(3, seqs.length));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const budget: Budget = { count: 0, limit: config.iterationBudget };
  let bestSeq = seqs[0];
  let bestScore = -Infinity;

  try {
    for (const seq of seqs) {
      const afterSeq = applyFullSequence(state, seq);
      // After the AI's own sequence commit, it is the opponent's chance node.
      const child = commitTurn(afterSeq);
      // depth - 1 because we already consumed one decision ply (our own move).
      const score = expectimax(child, config.depth - 1, false, aiColor, budget);
      if (score > bestScore) {
        bestScore = score;
        bestSeq = seq;
      }
    }
  } catch (err) {
    if (!(err instanceof BudgetExhausted)) {
      throw err;
    }
    // Return the best found before budget was exhausted.
  }

  return bestSeq;
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  if (msg.type === 'stop') {
    (self as unknown as { postMessage: (data: WorkerOutMessage) => void }).postMessage(
      { type: 'stopped' },
    );
    return;
  }

  if (msg.type === 'think') {
    const sequence = findBestSequence(msg.state, msg.aiColor, msg.level);
    (self as unknown as { postMessage: (data: WorkerOutMessage) => void }).postMessage(
      { type: 'result', sequence },
    );
  }
};
