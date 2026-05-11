/**
 * Tests for rules/headRule.ts — head-stone lifting limits.
 */

import { describe, it, expect } from 'vitest';
import { canLeaveHead, isHeadPoint } from '../rules/headRule';
import { createInitialState } from '../BackgammonEngine';
import { RULE_PRESETS } from '../../config/variants';
import type { BackgammonState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stateWith(overrides: Partial<BackgammonState>): BackgammonState {
  const base = createInitialState(RULE_PRESETS.classic, 'w');
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// Normal turn — 1-stone limit
// ---------------------------------------------------------------------------

describe('canLeaveHead — normal turn (1-stone limit)', () => {
  it('headTakenThisTurn=0 → can leave head', () => {
    const state = stateWith({ headTakenThisTurn: 0 });
    expect(canLeaveHead(state, 'w')).toBe(true);
  });

  it('headTakenThisTurn=1 → cannot leave head (normal turn)', () => {
    const state = stateWith({
      headTakenThisTurn: 1,
      isFirstTurn: false,
      dice: { values: [3, 5], remaining: [5] },
    });
    expect(canLeaveHead(state, 'w')).toBe(false);
  });

  it('black head: headTakenThisTurn=0 → can leave head', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'b');
    expect(canLeaveHead({ ...state, headTakenThisTurn: 0 }, 'b')).toBe(true);
  });

  it('black head: headTakenThisTurn=1, normal turn → cannot leave head', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'b');
    const s = {
      ...state,
      headTakenThisTurn: 1,
      isFirstTurn: false,
      dice: { values: [2, 4] as [number, number], remaining: [4] },
    };
    expect(canLeaveHead(s, 'b')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// First-turn doubles exception
// ---------------------------------------------------------------------------

describe('canLeaveHead — first-turn doubles exception', () => {
  it('first turn + 6-6 + headException enabled + headTaken=0 → can leave', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 0,
      dice: { values: [6, 6], remaining: [6, 6, 6, 6] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(true);
  });

  it('first turn + 6-6 + headException enabled + headTaken=1 → still can (second stone allowed)', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 1,
      dice: { values: [6, 6], remaining: [6, 6, 6] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(true);
  });

  it('first turn + 6-6 + headException enabled + headTaken=2 → cannot (limit reached)', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 2,
      dice: { values: [6, 6], remaining: [6, 6] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(false);
  });

  it('first turn + 4-4 + headException enabled + headTaken=1 → can (4-4 qualifies)', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 1,
      dice: { values: [4, 4], remaining: [4, 4, 4] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(true);
  });

  it('first turn + 3-3 + headException enabled + headTaken=1 → can (3-3 qualifies)', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 1,
      dice: { values: [3, 3], remaining: [3, 3, 3] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(true);
  });

  it('first turn + 5-5 (non-qualifying doubles) + headTaken=1 → cannot (5-5 does not qualify)', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 1,
      dice: { values: [5, 5], remaining: [5, 5, 5] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(false);
  });

  it('first turn + 6-6 + headExceptionOnFirstDoubles=false → no exception; headTaken=1 → cannot', () => {
    const state = stateWith({
      isFirstTurn: true,
      headTakenThisTurn: 1,
      dice: { values: [6, 6], remaining: [6, 6, 6] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: false },
    });
    expect(canLeaveHead(state, 'w')).toBe(false);
  });

  it('NOT first turn + 6-6 → exception does not apply; headTaken=1 → cannot', () => {
    const state = stateWith({
      isFirstTurn: false,
      headTakenThisTurn: 1,
      dice: { values: [6, 6], remaining: [6, 6, 6] },
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    });
    expect(canLeaveHead(state, 'w')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isHeadPoint
// ---------------------------------------------------------------------------

describe('isHeadPoint', () => {
  it('white head is 23', () => {
    expect(isHeadPoint('w', 23)).toBe(true);
  });

  it('black head is 11', () => {
    expect(isHeadPoint('b', 11)).toBe(true);
  });

  it('white point 11 is not white head', () => {
    expect(isHeadPoint('w', 11)).toBe(false);
  });

  it('black point 23 is not black head', () => {
    expect(isHeadPoint('b', 23)).toBe(false);
  });
});
