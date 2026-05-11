/**
 * Tests for BackgammonEngine.ts — engine facade functions.
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  applySubMove,
  undoSubMove,
  commitTurn,
  isTerminal,
  computeWinType,
  autoSkipIfNoMoves,
} from '../BackgammonEngine';
import { RULE_PRESETS } from '../../config/variants';
import { WHITE_HEAD, BLACK_HEAD, BOARD_POINTS } from '../constants';
import type { BackgammonState, SubMove, PointState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyBoard(): PointState[] {
  return Array.from({ length: BOARD_POINTS }, () => ({ color: null, count: 0 }));
}

function withDice(state: BackgammonState, dice: [number, number]): BackgammonState {
  return {
    ...state,
    dice: {
      values: dice,
      remaining: dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : [...dice],
    },
  };
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  it('white has 15 stones on point 23', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(state.board[WHITE_HEAD].color).toBe('w');
    expect(state.board[WHITE_HEAD].count).toBe(15);
  });

  it('black has 15 stones on point 11', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(state.board[BLACK_HEAD].color).toBe('b');
    expect(state.board[BLACK_HEAD].count).toBe(15);
  });

  it('all other points are empty', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    for (let i = 0; i < BOARD_POINTS; i++) {
      if (i !== WHITE_HEAD && i !== BLACK_HEAD) {
        expect(state.board[i].color).toBeNull();
        expect(state.board[i].count).toBe(0);
      }
    }
  });

  it('initial born-off counts are 0', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(state.bornOff).toEqual({ w: 0, b: 0 });
  });

  it('initial status is idle', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(state.gameStatus).toBe('idle');
  });

  it('isFirstTurn is true at start', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(state.isFirstTurn).toBe(true);
  });

  it('firstTurn parameter sets the turn color', () => {
    const stateB = createInitialState(RULE_PRESETS.classic, 'b');
    expect(stateB.turn).toBe('b');
  });

  it('pendingSequence is empty at start', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(state.pendingSequence).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applySubMove
// ---------------------------------------------------------------------------

describe('applySubMove', () => {
  it('moves a stone from source to destination', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const next = applySubMove(state, move);

    expect(next.board[WHITE_HEAD].count).toBe(14);
    expect(next.board[20].color).toBe('w');
    expect(next.board[20].count).toBe(1);
  });

  it('decrements the used die from remaining', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const next = applySubMove(state, move);
    expect(next.dice?.remaining).toEqual([5]);
  });

  it('appends the move to pendingSequence', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const next = applySubMove(state, move);
    expect(next.pendingSequence).toHaveLength(1);
    expect(next.pendingSequence[0]).toEqual(move);
  });

  it('increments headTakenThisTurn when moving from head', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const next = applySubMove(state, move);
    expect(next.headTakenThisTurn).toBe(1);
  });

  it('increments bornOff when to === "off"', () => {
    const board = emptyBoard();
    board[0] = { color: 'w', count: 15 };
    const state = withDice(
      { ...createInitialState(RULE_PRESETS.classic, 'w'), board },
      [1, 2],
    );
    const move: SubMove = { color: 'w', from: 0, to: 'off', pips: 1 };
    const next = applySubMove(state, move);
    expect(next.bornOff.w).toBe(1);
    expect(next.board[0].count).toBe(14);
  });

  it('does not mutate the input state', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const originalCount = state.board[WHITE_HEAD].count;
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    applySubMove(state, move);
    expect(state.board[WHITE_HEAD].count).toBe(originalCount);
  });
});

// ---------------------------------------------------------------------------
// undoSubMove
// ---------------------------------------------------------------------------

describe('undoSubMove', () => {
  it('reverses a move: stone returns to source', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const reverted = undoSubMove(after);

    expect(reverted.board[WHITE_HEAD].count).toBe(15);
    expect(reverted.board[20].count).toBe(0);
    expect(reverted.board[20].color).toBeNull();
  });

  it('restores the die value to remaining', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const reverted = undoSubMove(after);
    expect(reverted.dice?.remaining).toContain(3);
  });

  it('removes the last entry from pendingSequence', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const reverted = undoSubMove(after);
    expect(reverted.pendingSequence).toHaveLength(0);
  });

  it('apply + undo is a round-trip: board matches original', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const reverted = undoSubMove(after);

    for (let i = 0; i < BOARD_POINTS; i++) {
      expect(reverted.board[i]).toEqual(state.board[i]);
    }
    expect(reverted.headTakenThisTurn).toBe(state.headTakenThisTurn);
    // Remaining may be in different order; check sorted equality.
    expect([...reverted.dice?.remaining ?? []].sort()).toEqual(
      [...state.dice?.remaining ?? []].sort(),
    );
  });

  it('returns state unchanged when pendingSequence is empty', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    const result = undoSubMove(state);
    expect(result).toBe(state); // Same reference
  });
});

// ---------------------------------------------------------------------------
// commitTurn
// ---------------------------------------------------------------------------

describe('commitTurn', () => {
  it('switches turn from w to b', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const committed = commitTurn(after);
    expect(committed.turn).toBe('b');
  });

  it('clears pendingSequence after commit', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const committed = commitTurn(after);
    expect(committed.pendingSequence).toHaveLength(0);
  });

  it('increments turn number in history', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const committed = commitTurn(after);
    expect(committed.moveHistory).toHaveLength(1);
    expect(committed.moveHistory[0].turnNumber).toBe(1);
    expect(committed.moveHistory[0].color).toBe('w');
  });

  it('resets headTakenThisTurn to 0', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const move: SubMove = { color: 'w', from: WHITE_HEAD, to: 20, pips: 3 };
    const after = applySubMove(state, move);
    const committed = commitTurn(after);
    expect(committed.headTakenThisTurn).toBe(0);
  });

  it('sets status to rolling after commit', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    const committed = commitTurn(state);
    expect(committed.gameStatus).toBe('rolling');
  });

  it('sets isFirstTurn to false after first commit', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    expect(state.isFirstTurn).toBe(true);
    const committed = commitTurn(state);
    expect(committed.isFirstTurn).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isTerminal + computeWinType
// ---------------------------------------------------------------------------

describe('isTerminal and computeWinType', () => {
  it('not terminal at start', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(isTerminal(state)).toBe(false);
    expect(computeWinType(state)).toBeNull();
  });

  it('terminal when white has 15 borne off', () => {
    const state = { ...createInitialState(RULE_PRESETS.classic, 'w'), bornOff: { w: 15, b: 5 } };
    expect(isTerminal(state)).toBe(true);
  });

  it('normal win: loser has ≥1 born off', () => {
    const state = { ...createInitialState(RULE_PRESETS.classic, 'w'), bornOff: { w: 15, b: 3 } };
    expect(computeWinType(state)).toBe('normal');
  });

  it('mars win: loser has 0 born off, kokc disabled', () => {
    const rules = { ...RULE_PRESETS.classic, enableKokc: false };
    const state = { ...createInitialState(rules, 'w'), bornOff: { w: 15, b: 0 } };
    expect(computeWinType(state)).toBe('mars');
  });

  it('kokc win: loser has 0 born off + stones outside winner home, kokc enabled', () => {
    const rules = { ...RULE_PRESETS.classic, enableKokc: true };
    const board = emptyBoard();
    board[10] = { color: 'b', count: 15 }; // black stones NOT in white home (0-5)
    const state = {
      ...createInitialState(rules, 'w'),
      board,
      bornOff: { w: 15, b: 0 },
    };
    expect(computeWinType(state)).toBe('kokc');
  });

  it('mars (not kokc) when loser has 0 borne off but all stones IN winner home, kokc enabled', () => {
    const rules = { ...RULE_PRESETS.classic, enableKokc: true };
    const board = emptyBoard();
    board[3] = { color: 'b', count: 15 }; // black stones in white home (0-5)
    const state = {
      ...createInitialState(rules, 'w'),
      board,
      bornOff: { w: 15, b: 0 },
    };
    expect(computeWinType(state)).toBe('mars');
  });
});

// ---------------------------------------------------------------------------
// autoSkipIfNoMoves
// ---------------------------------------------------------------------------

describe('autoSkipIfNoMoves', () => {
  it('returns false when no dice', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(autoSkipIfNoMoves(state)).toBe(false);
  });

  it('returns false when moves are available', () => {
    const state = withDice(createInitialState(RULE_PRESETS.classic, 'w'), [3, 5]);
    expect(autoSkipIfNoMoves(state)).toBe(false);
  });

  it('returns true when all destinations are blocked', () => {
    const board = emptyBoard();
    board[WHITE_HEAD] = { color: 'w', count: 15 };
    // Block every reachable destination from the head.
    for (let die = 1; die <= 6; die++) {
      const dest = 23 - die;
      if (dest >= 0) board[dest] = { color: 'b', count: 2 };
    }
    const state: BackgammonState = {
      ...createInitialState(RULE_PRESETS.classic, 'w'),
      board,
      dice: { values: [2, 4], remaining: [2, 4] },
    };
    expect(autoSkipIfNoMoves(state)).toBe(true);
  });
});
