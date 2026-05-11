/**
 * BackgammonEngine — façade for the Long Backgammon game engine.
 *
 * All functions are pure: they accept a `BackgammonState` and return a new
 * `BackgammonState` (or another value) without mutating the input. React
 * stores and the AI worker can freely share state objects across threads
 * (via structured-clone) because nothing is mutable here.
 *
 * Typical lifecycle:
 * 1. `createInitialState(rules)` — build the starting board.
 * 2. Store sets `dice` and status → `'rolling'`.
 * 3. After dice settle: `generateLegalSequences` (from `moveGenerator.ts`).
 * 4. UI / AI calls `applySubMove` one or more times.
 * 5. `commitTurn` to switch sides and record history.
 * 6. Repeat until `isTerminal`.
 */

import type { BackgammonState, StoneColor, PointState, SubMove, WinType } from './types';
import type { BackgammonRules } from '../config/variants';
import { BOARD_POINTS, STONES_PER_SIDE, WHITE_HEAD, BLACK_HEAD } from './constants';
import { generateLegalSequences } from './moveGenerator';
import { isHeadPoint, canLeaveHead } from './rules/headRule';
import { canBearOff, validBearOffMove } from './rules/bearOffRule';
import { wouldCreateIllegal6Block } from './rules/blockRule';
import { isInHome } from './pathUtils';

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

/**
 * Builds the starting board for Long Backgammon:
 * - White: 15 stones on point 23 (WHITE_HEAD).
 * - Black: 15 stones on point 11 (BLACK_HEAD).
 * - All other points empty.
 */
function buildInitialBoard(): PointState[] {
  const board: PointState[] = Array.from({ length: BOARD_POINTS }, () => ({
    color: null,
    count: 0,
  }));

  board[WHITE_HEAD] = { color: 'w', count: STONES_PER_SIDE };
  board[BLACK_HEAD] = { color: 'b', count: STONES_PER_SIDE };

  return board;
}

/**
 * Creates the initial `BackgammonState` for a new game.
 *
 * @param rules      - The rule preset to use for this game.
 * @param firstTurn  - Which color moves first. Defaults to `'w'` (White).
 *                     If `rules.firstMoveByDiceRoll` is `true`, the caller
 *                     should determine this via a dice-roll comparison before
 *                     calling `createInitialState`.
 * @returns A fully initialized `BackgammonState` ready for play.
 *
 * @example
 * ```ts
 * import { RULE_PRESETS } from '../config/variants';
 * const state = createInitialState(RULE_PRESETS.classic, 'w');
 * ```
 */
export function createInitialState(
  rules: BackgammonRules,
  firstTurn: StoneColor = 'w',
): BackgammonState {
  return {
    board: buildInitialBoard(),
    turn: firstTurn,
    dice: null,
    moveHistory: [],
    bornOff: { w: 0, b: 0 },
    gameStatus: 'idle',
    winner: null,
    winType: null,
    rules,
    isFirstTurn: true,
    headTakenThisTurn: 0,
    selectedFrom: null,
    pendingSequence: [],
  };
}

// ---------------------------------------------------------------------------
// Sub-move application
// ---------------------------------------------------------------------------

/**
 * Immutably applies a single sub-move to `state`, returning a new state.
 *
 * This function trusts the caller: it does NOT validate legality. For
 * UI-triggered moves use `validateSubMove` first.
 *
 * Side-effects modelled (all in the returned state):
 * - `board`: stone moved from `move.from` to `move.to` (or borne off).
 * - `bornOff[color]`: incremented if `move.to === 'off'`.
 * - `pendingSequence`: sub-move appended.
 * - `headTakenThisTurn`: incremented if `move.from` is the head.
 * - `dice.remaining`: the die value `move.pips` is removed (first match).
 *
 * @param state - The current game state.
 * @param move  - The sub-move to apply.
 * @returns New state with the sub-move applied.
 *
 * @example
 * ```ts
 * const next = applySubMove(state, { color: 'w', from: 23, to: 20, pips: 3 });
 * ```
 */
export function applySubMove(
  state: BackgammonState,
  move: SubMove,
): BackgammonState {
  // Clone board.
  const newBoard: PointState[] = state.board.map((ps) => ({ ...ps }));

  // Remove stone from source.
  const src = newBoard[move.from];
  newBoard[move.from] = {
    color: src.count === 1 ? null : src.color,
    count: src.count - 1,
  };

  // Add stone to destination or increment born-off count.
  const newBornOff = { ...state.bornOff };
  if (move.to === 'off') {
    newBornOff[move.color]++;
  } else {
    const dst = newBoard[move.to];
    newBoard[move.to] = {
      color: move.color,
      count: dst.count + 1,
    };
  }

  // Remove the consumed die value (first match) from remaining.
  const newRemaining = [...(state.dice?.remaining ?? [])];
  const dieIndex = newRemaining.indexOf(move.pips);
  if (dieIndex !== -1) {
    newRemaining.splice(dieIndex, 1);
  }

  // Track head lifts.
  const newHeadTaken = isHeadPoint(move.color, move.from)
    ? state.headTakenThisTurn + 1
    : state.headTakenThisTurn;

  return {
    ...state,
    board: newBoard,
    bornOff: newBornOff,
    dice: state.dice
      ? { ...state.dice, remaining: newRemaining }
      : null,
    pendingSequence: [...state.pendingSequence, move],
    headTakenThisTurn: newHeadTaken,
  };
}

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------

/**
 * Reverses the last sub-move in `state.pendingSequence`, returning a new state.
 *
 * If `pendingSequence` is empty, returns `state` unchanged.
 *
 * @param state - The current game state with at least one pending sub-move.
 * @returns New state with the last sub-move undone.
 *
 * @example
 * ```ts
 * const reverted = undoSubMove(afterMove);
 * // reverted.board is identical to state.board before the last applySubMove
 * ```
 */
export function undoSubMove(state: BackgammonState): BackgammonState {
  if (state.pendingSequence.length === 0) {
    return state;
  }

  const move = state.pendingSequence[state.pendingSequence.length - 1];
  const newPending = state.pendingSequence.slice(0, -1);

  // Clone board.
  const newBoard: PointState[] = state.board.map((ps) => ({ ...ps }));

  // Restore stone to source.
  const srcCurrent = newBoard[move.from];
  newBoard[move.from] = {
    color: move.color,
    count: srcCurrent.count + 1,
  };

  // Remove stone from destination (or decrement born-off).
  const newBornOff = { ...state.bornOff };
  if (move.to === 'off') {
    newBornOff[move.color]--;
  } else {
    const dst = newBoard[move.to];
    newBoard[move.to] = {
      color: dst.count === 1 ? null : dst.color,
      count: dst.count - 1,
    };
  }

  // Restore the die value to remaining.
  const newRemaining = state.dice
    ? [...state.dice.remaining, move.pips]
    : [];

  // Reverse head-lift count.
  const newHeadTaken = isHeadPoint(move.color, move.from)
    ? Math.max(0, state.headTakenThisTurn - 1)
    : state.headTakenThisTurn;

  return {
    ...state,
    board: newBoard,
    bornOff: newBornOff,
    dice: state.dice
      ? { ...state.dice, remaining: newRemaining }
      : null,
    pendingSequence: newPending,
    headTakenThisTurn: newHeadTaken,
  };
}

// ---------------------------------------------------------------------------
// Commit turn
// ---------------------------------------------------------------------------

/**
 * Commits the current pending sequence as a completed turn and transitions
 * to the next player.
 *
 * Actions:
 * - Appends a `HistoryEntry` to `moveHistory` with the committed sequence.
 * - Clears `pendingSequence` and `headTakenThisTurn`.
 * - Clears `dice` (next roll comes from the store / UI).
 * - Flips `turn` to the opponent.
 * - Sets `isFirstTurn = false` (once first turn committed, the flag is permanently false).
 * - Sets `gameStatus` to `'rolling'` (ready for next dice roll) unless the game is over.
 * - Checks for terminal condition; if the game is over, sets `winner`, `winType`,
 *   and `gameStatus = 'ended'`.
 *
 * @param state - The current game state (may have `pendingSequence` populated).
 * @returns New state representing the start of the next player's turn.
 *
 * @example
 * ```ts
 * const next = commitTurn(state);
 * next.turn; // → 'b' if it was 'w's turn
 * next.pendingSequence; // → []
 * ```
 */
export function commitTurn(state: BackgammonState): BackgammonState {
  const { turn, pendingSequence, moveHistory, dice } = state;

  const turnNumber =
    moveHistory.length > 0
      ? moveHistory[moveHistory.length - 1].turnNumber + 1
      : 1;

  const historyEntry = {
    color: turn,
    dice: dice?.values ?? [1, 1] as [number, number],
    sequence: [...pendingSequence],
    turnNumber,
  };

  const newHistory = [...moveHistory, historyEntry];
  const opponent: StoneColor = turn === 'w' ? 'b' : 'w';

  // Check for win condition.
  const newBornOff = { ...state.bornOff };
  const gameOver = newBornOff[turn] === STONES_PER_SIDE;

  let winner: StoneColor | null = null;
  let winType: WinType | null = null;
  let gameStatus = state.gameStatus;

  if (gameOver) {
    winner = turn;
    winType = computeWinTypeFromBornOff(state, turn);
    gameStatus = 'ended';
  } else {
    gameStatus = 'rolling';
  }

  return {
    ...state,
    turn: gameOver ? turn : opponent,
    dice: null,
    moveHistory: newHistory,
    pendingSequence: [],
    headTakenThisTurn: 0,
    selectedFrom: null,
    isFirstTurn: false,
    gameStatus,
    winner,
    winType,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates a single sub-move before applying it (for UI-triggered moves).
 *
 * Checks (in order):
 * 1. The source point contains stones of the current player's color.
 * 2. The die value is in `state.dice.remaining`.
 * 3. Head rule (if moving from head).
 * 4. Destination is empty or same color.
 * 5. 6-block rule.
 * 6. Bear-off prerequisites (if destination is 'off').
 *
 * @param state - The current game state.
 * @param move  - The sub-move to validate.
 * @returns `{ ok: true }` or `{ ok: false, reason: string }`.
 *
 * @example
 * ```ts
 * const result = validateSubMove(state, { color: 'w', from: 23, to: 20, pips: 3 });
 * if (!result.ok) console.warn(result.reason);
 * ```
 */
export function validateSubMove(
  state: BackgammonState,
  move: SubMove,
): { ok: boolean; reason?: string } {
  const { board, turn, dice, rules } = state;

  if (move.color !== turn) {
    return { ok: false, reason: 'Not your turn.' };
  }

  const srcPoint = board[move.from];
  if (srcPoint.color !== turn || srcPoint.count === 0) {
    return { ok: false, reason: 'No own stone at source point.' };
  }

  if (!dice || !dice.remaining.includes(move.pips)) {
    return { ok: false, reason: `Die value ${move.pips} not available.` };
  }

  // Head rule.
  if (isHeadPoint(turn, move.from)) {
    if (!canLeaveHead(state, turn)) {
      return { ok: false, reason: 'Head rule: cannot move another stone from head this turn.' };
    }
  }

  if (move.to === 'off') {
    if (!canBearOff(state, turn)) {
      return { ok: false, reason: 'Cannot bear off: not all stones in home.' };
    }
    if (!validBearOffMove(state, turn, move.from, move.pips)) {
      return { ok: false, reason: 'Invalid bear-off: farther stones exist or die too small.' };
    }
  } else {
    const dest = board[move.to];
    if (dest.color !== null && dest.color !== turn) {
      return { ok: false, reason: 'Destination occupied by opponent.' };
    }

    // Check 6-block rule after simulating the move.
    const simulatedBoard: PointState[] = board.map((ps) => ({ ...ps }));
    simulatedBoard[move.from] = {
      color: simulatedBoard[move.from].count === 1 ? null : simulatedBoard[move.from].color,
      count: simulatedBoard[move.from].count - 1,
    };
    simulatedBoard[move.to] = {
      color: turn,
      count: simulatedBoard[move.to].count + 1,
    };

    if (wouldCreateIllegal6Block(simulatedBoard, turn, rules)) {
      return { ok: false, reason: '6-block rule: this move would create an illegal 6-block.' };
    }
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Terminal detection
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the game is over (one side has borne off all 15 stones).
 *
 * @param state - The current game state.
 * @returns `true` if a winner exists.
 *
 * @example
 * ```ts
 * isTerminal(state); // → true once state.bornOff.w === 15 or state.bornOff.b === 15
 * ```
 */
export function isTerminal(state: BackgammonState): boolean {
  return state.bornOff.w === STONES_PER_SIDE || state.bornOff.b === STONES_PER_SIDE;
}

/**
 * Internal helper: compute the win type given the winner and current bornOff.
 */
function computeWinTypeFromBornOff(
  state: BackgammonState,
  winner: StoneColor,
): WinType {
  const loser: StoneColor = winner === 'w' ? 'b' : 'w';
  const loserBornOff = state.bornOff[loser];

  if (loserBornOff > 0) {
    return 'normal';
  }

  // Mars or Kokc: loser has 0 borne off.
  if (!state.rules.enableKokc) {
    return 'mars';
  }

  // Kokc: loser has 0 borne off AND still has stones outside winner's home.
  // Check if loser has any stone outside winner's home quadrant.
  for (let i = 0; i < BOARD_POINTS; i++) {
    const ps = state.board[i];
    if (ps.color === loser && ps.count > 0) {
      if (!isInHome(winner, i)) {
        return 'kokc';
      }
    }
  }

  return 'mars';
}

/**
 * Computes the win type for the current terminal state.
 *
 * Returns `null` if the game is not yet over.
 *
 * Win classification:
 * - `'normal'` — Loser has ≥1 stone borne off.
 * - `'mars'`   — Loser has 0 stones borne off (backgammon/gammon); 2 points.
 * - `'kokc'`   — `mars` conditions + loser has stones outside winner's home
 *                (only when `rules.enableKokc === true`); 3 points.
 *
 * @param state - The current game state.
 * @returns The `WinType` or `null` if not terminal.
 *
 * @example
 * ```ts
 * computeWinType(endState); // → 'mars' if loser has 0 borne off
 * ```
 */
export function computeWinType(state: BackgammonState): WinType | null {
  if (!isTerminal(state)) return null;

  const winner = state.bornOff.w === STONES_PER_SIDE ? 'w' : 'b';
  return computeWinTypeFromBornOff(state, winner);
}

// ---------------------------------------------------------------------------
// Auto-skip
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the current player has absolutely no legal moves and
 * the turn should be automatically skipped (committed as an empty sequence).
 *
 * This happens when `generateLegalSequences` returns `[[]]` — a single empty
 * sequence — indicating complete blockage.
 *
 * Callers (store / AI hook) should call `commitTurn` immediately when this
 * returns `true`.
 *
 * @param state - The current game state (must have `dice` populated).
 * @returns `true` if the turn must be skipped.
 *
 * @example
 * ```ts
 * if (autoSkipIfNoMoves(state)) {
 *   dispatch(commitTurn(state));
 * }
 * ```
 */
export function autoSkipIfNoMoves(state: BackgammonState): boolean {
  if (!state.dice) return false;

  const sequences = generateLegalSequences(state, state.dice.values);
  return sequences.length === 1 && sequences[0].length === 0;
}
