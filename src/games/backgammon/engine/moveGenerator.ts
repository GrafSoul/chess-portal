/**
 * Legal move generator for Long Backgammon.
 *
 * The generator produces all `MoveSequence` arrays that are legal for the
 * current player given the rolled dice. It is the most complex part of the
 * engine and is called by both the UI (to highlight destinations) and the AI
 * (as the branching factor at decision nodes in expectimax).
 *
 * Algorithm overview:
 * 1. For a non-double roll `[d1, d2]`, try both orderings `[d1,d2]` and
 *    `[d2,d1]` as the sequence of die values to consume.
 * 2. For a double roll `[d,d]`, only one ordering `[d,d,d,d]` is possible.
 * 3. Run a DFS over all legal sub-moves for each die ordering, building up
 *    `MoveSequence` candidates.
 * 4. Apply the maximum-use filter:
 *    - If any sequence uses all available dice, keep only those.
 *    - If no complete sequence exists, keep only sequences that use the
 *      maximum number of dice, and (if `strictMaxDieRule`) break ties
 *      by preferring the sequence that uses the larger individual die.
 * 5. Deduplicate sequences that are identical in effect (same from/to tuples).
 */

import type { BackgammonState, SubMove, MoveSequence, PointState } from './types';
import { nextPoint } from './pathUtils';
import { canLeaveHead, isHeadPoint } from './rules/headRule';
import { wouldCreateIllegal6Block } from './rules/blockRule';
import { canBearOff, validBearOffMove } from './rules/bearOffRule';
import { BOARD_POINTS } from './constants';
import { expandDoubles } from './diceUtils';

// ---------------------------------------------------------------------------
// Board mutation helpers (pure — return new PointState arrays)
// ---------------------------------------------------------------------------

/**
 * Immutably applies a single sub-move to the board, returning a new board.
 *
 * Does NOT update any other state fields; this is only used internally by
 * the move generator during DFS to explore intermediate positions.
 *
 * @param board - The current board.
 * @param move  - The sub-move to apply.
 * @returns A new board array with the stone moved.
 */
function applySubMoveToBoard(
  board: readonly PointState[],
  move: SubMove,
): PointState[] {
  const next = board.map((ps) => ({ ...ps }));

  // Remove from source.
  next[move.from] = {
    color: next[move.from].count === 1 ? null : next[move.from].color,
    count: next[move.from].count - 1,
  };

  // Add to destination (if not borne off).
  if (move.to !== 'off') {
    const dest = next[move.to];
    next[move.to] = {
      color: move.color,
      count: dest.count + 1,
    };
  }

  return next;
}

// ---------------------------------------------------------------------------
// Single-die sub-move generation
// ---------------------------------------------------------------------------

/**
 * Generates all legal sub-moves for a single die value from the current
 * (potentially mid-turn) state.
 *
 * Checks:
 * - Source point has stones of the current player's color.
 * - Head rule: `canLeaveHead` if source is the head point.
 * - Destination is empty or same color (no blotting in Long Backgammon).
 * - 6-block rule via `wouldCreateIllegal6Block`.
 * - Bear-off rule: only if `canBearOff` and `validBearOffMove` pass.
 * - Deduplication: multiple stones on the same point yield one sub-move entry.
 *
 * @param state            - The current game state (may be mid-turn).
 * @param die              - The die value to generate moves for.
 * @param board            - The current board (may differ from `state.board` mid-DFS).
 * @param headTakenThisTurn - Count of head stones already moved this turn so far.
 * @returns Array of legal `SubMove` objects.
 */
export function generateSubMoves(
  state: BackgammonState,
  die: number,
  board: readonly PointState[],
  headTakenThisTurn: number,
): SubMove[] {
  const { turn: color, rules } = state;
  const result: SubMove[] = [];
  const seenFromPoints = new Set<number>();

  for (let point = 0; point < BOARD_POINTS; point++) {
    const ps = board[point];
    if (ps.color !== color || ps.count === 0) continue;

    // Deduplicate: multiple stones on the same source produce identical sub-moves.
    if (seenFromPoints.has(point)) continue;
    seenFromPoints.add(point);

    // Head rule check.
    if (isHeadPoint(color, point)) {
      // Build a minimal state fragment for canLeaveHead to use.
      const stateForHeadCheck: BackgammonState = {
        ...state,
        board: board as PointState[],
        headTakenThisTurn,
      };
      if (!canLeaveHead(stateForHeadCheck, color)) {
        continue;
      }
    }

    const destination = nextPoint(color, point, die);

    if (destination === 'off') {
      // Bear-off move: requires all stones in home + valid bear-off distance.
      const stateForBearOff: BackgammonState = {
        ...state,
        board: board as PointState[],
      };
      if (!canBearOff(stateForBearOff, color)) continue;
      if (!validBearOffMove(stateForBearOff, color, point, die)) continue;

      result.push({ color, from: point, to: 'off', pips: die });
      continue;
    }

    // Normal move: destination must be empty or same color.
    const destPs = board[destination];
    if (destPs.color !== null && destPs.color !== color) {
      // Opponent occupies destination — illegal in Long Backgammon.
      continue;
    }

    // 6-block rule: simulate the board after the move and check.
    const tentativeBoard = applySubMoveToBoard(board, {
      color,
      from: point,
      to: destination,
      pips: die,
    });
    if (wouldCreateIllegal6Block(tentativeBoard, color, rules)) {
      continue;
    }

    result.push({ color, from: point, to: destination, pips: die });
  }

  return result;
}

// ---------------------------------------------------------------------------
// DFS sequence builder
// ---------------------------------------------------------------------------

/**
 * Recursively builds all legal `MoveSequence` candidates starting from
 * `currentBoard` with `remainingDice` still to play.
 *
 * Partial sequences (reached when no further moves are possible) are stored
 * as-is and the maximum-use filter handles them later.
 *
 * @param state             - The base game state for rules/color/etc.
 * @param currentBoard      - Board mid-DFS (may have pending sub-moves applied).
 * @param remainingDice     - Die values still to consume.
 * @param currentSequence   - Sub-moves built so far.
 * @param headTakenThisTurn - Running count of head stones lifted this turn.
 * @param results           - Accumulated results (mutated in place for performance).
 */
function dfs(
  state: BackgammonState,
  currentBoard: readonly PointState[],
  remainingDice: readonly number[],
  currentSequence: MoveSequence,
  headTakenThisTurn: number,
  results: MoveSequence[],
): void {
  if (remainingDice.length === 0) {
    results.push([...currentSequence]);
    return;
  }

  const die = remainingDice[0];
  const rest = remainingDice.slice(1);

  const subMoves = generateSubMoves(state, die, currentBoard, headTakenThisTurn);

  if (subMoves.length === 0) {
    // No moves for this die — record partial sequence.
    results.push([...currentSequence]);
    return;
  }

  for (const move of subMoves) {
    const newBoard = applySubMoveToBoard(currentBoard, move);
    const newHeadTaken =
      isHeadPoint(state.turn, move.from) ? headTakenThisTurn + 1 : headTakenThisTurn;

    currentSequence.push(move);
    dfs(state, newBoard, rest, currentSequence, newHeadTaken, results);
    currentSequence.pop();
  }
}

// ---------------------------------------------------------------------------
// Sequence key for deduplication
// ---------------------------------------------------------------------------

/**
 * Produces a canonical string key for a `MoveSequence` so that two sequences
 * with the same set of (from, to) pairs (in any order of dice ordering) can
 * be deduplicated.
 *
 * @param sequence - A move sequence.
 * @returns A sorted, joined string of `"from:to"` pairs.
 */
function sequenceKey(sequence: MoveSequence): string {
  return sequence
    .map((m) => `${m.from}:${String(m.to)}`)
    .sort()
    .join('|');
}

// ---------------------------------------------------------------------------
// Maximum-use filter
// ---------------------------------------------------------------------------

/**
 * Applies the "maximum dice use" rule and the "prefer larger die" rule to a
 * raw list of move sequences:
 *
 * 1. Prefer sequences that use the most dice (discard shorter ones if longer exist).
 * 2. Among sequences of equal length, if `strictMaxDieRule` is active and only
 *    one die can be played, prefer sequences that use the larger die value.
 *
 * @param sequences       - All generated sequences (may include partials).
 * @param totalDice       - Number of dice in the original roll (2 or 4 for doubles).
 * @param strictMaxDieRule - If `true`, enforce the "must play the larger die" rule.
 * @returns Filtered array of legal sequences.
 */
function applyMaxUseFilter(
  sequences: MoveSequence[],
  totalDice: number,
  strictMaxDieRule: boolean,
): MoveSequence[] {
  if (sequences.length === 0) return sequences;

  // Find the maximum number of dice used by any sequence.
  let maxUsed = 0;
  for (const seq of sequences) {
    if (seq.length > maxUsed) maxUsed = seq.length;
  }

  // Keep only sequences that use the maximum number of dice.
  let filtered = sequences.filter((seq) => seq.length === maxUsed);

  // If only one sub-move sequences exist (partial — couldn't use both dice),
  // and strictMaxDieRule is on, keep only those using the larger die.
  if (strictMaxDieRule && maxUsed < totalDice && maxUsed === 1) {
    let maxDie = 0;
    for (const seq of filtered) {
      if (seq[0].pips > maxDie) maxDie = seq[0].pips;
    }
    filtered = filtered.filter((seq) => seq[0].pips === maxDie);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates all legal move sequences for the current player given the rolled
 * dice in `state.dice`.
 *
 * Returns an empty array if the state has no dice (status is `'idle'` or
 * `'rolling'`).
 *
 * Returns `[[]]` (an array containing one empty sequence) only when the player
 * has no legal moves at all — signaling that the turn should be skipped.
 *
 * **Important:** callers should use `autoSkipIfNoMoves` in `BackgammonEngine`
 * rather than checking the result of this function directly.
 *
 * @param state - The current game state with `dice` populated.
 * @returns Array of legal `MoveSequence` objects, deduplicated.
 *
 * @example
 * ```ts
 * const sequences = generateLegalSequences(state, [3, 5]);
 * // Returns multiple sequences; each sequence is an array of 1-2 sub-moves.
 * ```
 */
export function generateLegalSequences(
  state: BackgammonState,
  diceValues: [number, number],
): MoveSequence[] {
  const expandedDice = expandDoubles(diceValues);
  const isDouble = diceValues[0] === diceValues[1];

  // Determine orderings to try.
  const orderings: number[][] = isDouble
    ? [expandedDice]
    : [expandedDice, [expandedDice[1], expandedDice[0]]];

  const allSequences: MoveSequence[] = [];

  for (const ordering of orderings) {
    dfs(
      state,
      state.board,
      ordering,
      [],
      state.headTakenThisTurn,
      allSequences,
    );
  }

  // Deduplicate by canonical key.
  const seenKeys = new Set<string>();
  const deduplicated: MoveSequence[] = [];
  for (const seq of allSequences) {
    const key = sequenceKey(seq);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicated.push(seq);
    }
  }

  // Apply maximum-use and max-die filters.
  const filtered = applyMaxUseFilter(
    deduplicated,
    expandedDice.length,
    state.rules.strictMaxDieRule,
  );

  // If no legal moves at all, return one empty sequence to signal skip.
  if (filtered.length === 0) {
    return [[]];
  }

  return filtered;
}
