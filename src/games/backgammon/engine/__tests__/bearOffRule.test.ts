/**
 * Tests for rules/bearOffRule.ts — bear-off eligibility and move validity.
 */

import { describe, it, expect } from 'vitest';
import { canBearOff, validBearOffMove } from '../rules/bearOffRule';
import { createInitialState } from '../BackgammonEngine';
import { RULE_PRESETS } from '../../config/variants';
import type { BackgammonState, PointState } from '../types';
import { BOARD_POINTS } from '../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyBoard(): PointState[] {
  return Array.from({ length: BOARD_POINTS }, () => ({ color: null, count: 0 }));
}

function stateWith(overrides: Partial<BackgammonState>): BackgammonState {
  return { ...createInitialState(RULE_PRESETS.classic, 'w'), ...overrides };
}

/** Build a state where all 15 white stones are in home (points 0..4) */
function whiteAllInHome(): BackgammonState {
  const board = emptyBoard();
  board[0] = { color: 'w', count: 3 };
  board[1] = { color: 'w', count: 3 };
  board[2] = { color: 'w', count: 3 };
  board[3] = { color: 'w', count: 3 };
  board[4] = { color: 'w', count: 3 };
  return stateWith({ board, bornOff: { w: 0, b: 0 } });
}

// ---------------------------------------------------------------------------
// canBearOff
// ---------------------------------------------------------------------------

describe('canBearOff', () => {
  it('initial position: white NOT eligible to bear off (stones on head)', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    expect(canBearOff(state, 'w')).toBe(false);
  });

  it('white with one stone outside home: NOT eligible', () => {
    const board = emptyBoard();
    board[0] = { color: 'w', count: 14 };
    board[10] = { color: 'w', count: 1 }; // outside home
    const state = stateWith({ board });
    expect(canBearOff(state, 'w')).toBe(false);
  });

  it('all white stones in home: eligible', () => {
    const state = whiteAllInHome();
    expect(canBearOff(state, 'w')).toBe(true);
  });

  it('all white stones borne off: eligible (trivially)', () => {
    const state = stateWith({ bornOff: { w: 15, b: 0 }, board: emptyBoard() });
    expect(canBearOff(state, 'w')).toBe(true);
  });

  it('some white stones borne off + rest in home: eligible', () => {
    const board = emptyBoard();
    board[2] = { color: 'w', count: 5 };
    const state = stateWith({ board, bornOff: { w: 10, b: 0 } });
    expect(canBearOff(state, 'w')).toBe(true);
  });

  it('black initial: NOT eligible', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'b');
    expect(canBearOff(state, 'b')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validBearOffMove
// ---------------------------------------------------------------------------

describe('validBearOffMove', () => {
  it('exact match: stone on point 0 (distance=0, needs 1 pip), die=1 → legal', () => {
    const board = emptyBoard();
    board[0] = { color: 'w', count: 15 };
    const state = stateWith({ board, bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'w', 0, 1)).toBe(true);
  });

  it('exact match: stone on point 4 (distance=4-0=4→pathPos 19→dist 4, needs 5 pips), die=5 → legal', () => {
    // White point 4: pathPosition('w', 4) = 19, distanceFromHome = 23-19 = 4 → pipsRequired = 5.
    const board = emptyBoard();
    board[4] = { color: 'w', count: 15 };
    const state = stateWith({ board, bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'w', 4, 5)).toBe(true);
  });

  it('over-distance: stone on point 2 (needs 3), die=5, no stones farther from exit → legal', () => {
    // White point 2: distanceFromHome = 2, pipsRequired = 3.
    // No white stones at path positions < pathPosition('w', 2).
    const board = emptyBoard();
    board[2] = { color: 'w', count: 15 };
    const state = stateWith({ board, bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'w', 2, 5)).toBe(true);
  });

  it('over-distance: stone on point 2, but stone exists on point 4 (farther from exit) → illegal', () => {
    // White path positions: 4 → 19, 2 → 21. Point 4 has LOWER path pos → farther from exit.
    const board = emptyBoard();
    board[2] = { color: 'w', count: 10 };
    board[4] = { color: 'w', count: 5 }; // farther from exit than point 2
    const state = stateWith({ board, bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'w', 2, 6)).toBe(false);
  });

  it('die too small: stone on point 3 (needs 4), die=2 → not a bear-off move', () => {
    const board = emptyBoard();
    board[3] = { color: 'w', count: 15 };
    const state = stateWith({ board, bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'w', 3, 2)).toBe(false);
  });

  it('black bear-off: stone on point 12 (last home, distance=0, needs 1), die=1 → legal', () => {
    const board = emptyBoard();
    board[12] = { color: 'b', count: 15 };
    const state = stateWith({ board, turn: 'b', bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'b', 12, 1)).toBe(true);
  });

  it('black over-distance: stone on point 14 (needs 3 from black perspective), die=6, no farther stones → legal', () => {
    // Black path: 14 is at path pos 9 (BLACK_PATH[9]=2... wait, let me recalculate.
    // BLACK_PATH = [11,10,9,8,7,6,5,4,3,2,1,0,23,22,21,20,19,18,17,16,15,14,13,12]
    // pathPosition('b', 14) = 21, distanceFromHome = 23-21 = 2, pipsRequired = 3.
    const board = emptyBoard();
    board[14] = { color: 'b', count: 15 };
    const state = stateWith({ board, turn: 'b', bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'b', 14, 6)).toBe(true);
  });

  it('over-distance on farthest stone in home: legal', () => {
    // White stones only on point 5 (farthest from exit, distance=5, pipsRequired=6).
    // Die=6 → exact match actually.
    // Let's use die=6 for a stone at point 3 (distance=3, pipsRequired=4) with no stone farther.
    const board = emptyBoard();
    board[3] = { color: 'w', count: 15 };
    const state = stateWith({ board, bornOff: { w: 0, b: 0 } });
    expect(validBearOffMove(state, 'w', 3, 6)).toBe(true);
  });
});
