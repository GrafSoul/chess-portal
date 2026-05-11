/**
 * Tests for moveGenerator.ts — legal move generation.
 */

import { describe, it, expect } from 'vitest';
import { generateLegalSequences, generateSubMoves } from '../moveGenerator';
import { createInitialState } from '../BackgammonEngine';
import { RULE_PRESETS } from '../../config/variants';
import type { BackgammonState, PointState } from '../types';
import { BOARD_POINTS, WHITE_HEAD, BLACK_HEAD } from '../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyBoard(): PointState[] {
  return Array.from({ length: BOARD_POINTS }, () => ({ color: null, count: 0 }));
}

function stateWithDice(
  overrides: Partial<BackgammonState>,
  dice: [number, number],
): BackgammonState {
  const base = createInitialState(RULE_PRESETS.classic, 'w');
  return {
    ...base,
    ...overrides,
    dice: { values: dice, remaining: dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : [...dice] },
  };
}

// ---------------------------------------------------------------------------
// Starting position
// ---------------------------------------------------------------------------

describe('generateLegalSequences — starting position', () => {
  it('[3,5]: produces multiple valid sequences, all sub-moves are white', () => {
    const state = stateWithDice({}, [3, 5]);
    const seqs = generateLegalSequences(state, [3, 5]);
    // Should produce multiple sequences (at least one), each using 2 sub-moves.
    expect(seqs.length).toBeGreaterThan(0);
    for (const seq of seqs) {
      expect(seq.length).toBe(2);
      for (const sm of seq) {
        expect(sm.color).toBe('w');
      }
    }
    // The first move of every sequence must be from the head (the only stone source at start).
    for (const seq of seqs) {
      expect(seq[0].from).toBe(WHITE_HEAD);
    }
  });

  it('[1,2]: white can use both dice on first turn', () => {
    const state = stateWithDice({}, [1, 2]);
    const seqs = generateLegalSequences(state, [1, 2]);
    expect(seqs.length).toBeGreaterThan(0);
    for (const seq of seqs) {
      expect(seq.length).toBe(2);
    }
  });

  it('doubles [6,6]: all sub-moves use pips=6', () => {
    // In initial position with 6-6, head exception allows 2 stones off head.
    // After 2 from head at point 17, the next moves go 17→11 (blocked by black head).
    // So 6-6 may only allow 2 sub-moves in starting position due to black blocking.
    const state = stateWithDice({ isFirstTurn: true }, [6, 6]);
    const seqs = generateLegalSequences(state, [6, 6]);
    expect(seqs.length).toBeGreaterThan(0);
    for (const seq of seqs) {
      // Every die used must be 6.
      for (const sm of seq) {
        expect(sm.pips).toBe(6);
      }
    }
  });

  it('head rule: in starting position only 1 stone can leave head per turn', () => {
    // With dice [3,3] first turn + headExceptionOnFirstDoubles=true → 2 allowed.
    // But with [2,4] → only 1 off head, second move must come from a different point
    // (but there's only the head) → force partial or no second move from head.
    const state = stateWithDice({
      isFirstTurn: true,
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: false },
    }, [2, 4]);
    const seqs = generateLegalSequences(state, [2, 4]);
    for (const seq of seqs) {
      // At most 1 sub-move from the head in any sequence.
      const headMoves = seq.filter((sm) => sm.from === WHITE_HEAD);
      expect(headMoves.length).toBeLessThanOrEqual(1);
    }
  });

  it('doubles [3,3] first turn with headException: allows 2 stones off head', () => {
    const state = stateWithDice({
      isFirstTurn: true,
      rules: { ...RULE_PRESETS.classic, headExceptionOnFirstDoubles: true },
    }, [3, 3]);
    const seqs = generateLegalSequences(state, [3, 3]);
    // Some sequences should have 2+ stones from head.
    const hasDoubleHead = seqs.some(
      (seq) => seq.filter((sm) => sm.from === WHITE_HEAD).length >= 2,
    );
    expect(hasDoubleHead).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Max-die rule
// ---------------------------------------------------------------------------

describe('generateLegalSequences — max-die rule', () => {
  it('if only one die playable, prefer the larger die', () => {
    // Set up a board where only one die can be used.
    // Put white on point 23 (head), with a black stone blocking point 20 (die-3 destination)
    // but not point 17 (die-6 from head). Only die-6 usable.
    const board = emptyBoard();
    board[WHITE_HEAD] = { color: 'w', count: 15 };
    board[20] = { color: 'b', count: 2 }; // blocks die-3
    board[17] = { color: 'w', count: 0 }; // open (die-6 from 23)

    // With [3,6]: die-3 → 23-3=20 blocked, die-6 → 23-6=17 open.
    // After moving die-6 from 23 → 17, die-3 from either 23 or 17.
    // But since only 14 remain on head and 1 on 17, and 20 is blocked,
    // 17-3=14 is open → can use die-3 too.
    // Let's use a scenario where ONLY die-6 is playable.
    board[17] = { color: 'b', count: 2 }; // block 17 too (die-6 from 23 → 17 also blocked)
    board[22] = { color: 'b', count: 2 }; // block 22 (die-1 from 23)
    // Now only die that could work would need careful setup.
    // Instead, test a simpler case: stone at point 1, dice [2, 6].
    // die-2: 1 → 'off' (distance=0, pipsRequired=1, die=2 → over-distance, check if no farther stones).
    // die-6: 1 → 'off' similarly.
    // Both work but the max-die filter for only-one-usable isn't triggered here.

    // Actually test: a board where die-6 alone is playable but die-3 is not.
    const board2 = emptyBoard();
    board2[WHITE_HEAD] = { color: 'w', count: 15 };
    // Block all destinations reachable by die-3 from head (23-3=20) and all points reachable by die-3 after die-6.
    // 23 -die-6→ 17. 17 -die-3→ 14. Block 14 and 20.
    board2[20] = { color: 'b', count: 2 };
    board2[14] = { color: 'b', count: 2 };
    // Also block 16 (from head with die-3? No... head is 23, die-3=20. Only 20).
    // After moving die-6 from 23→17, die-3 from 23→20 (blocked) or from 17→14 (blocked).
    // So only die-6 sequences are possible.
    const state2 = {
      ...createInitialState(RULE_PRESETS.classic, 'w'),
      board: board2,
      dice: { values: [3, 6] as [number, number], remaining: [3, 6] },
      isFirstTurn: true,
    };
    const seqs2 = generateLegalSequences(state2, [3, 6]);
    // All sequences should use die-6 (the larger) since die-3 is blocked.
    for (const seq of seqs2) {
      expect(seq.every((sm) => sm.pips === 6)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Bear-off sequences
// ---------------------------------------------------------------------------

describe('generateLegalSequences — bear-off', () => {
  it('all stones in home: bear-off moves appear', () => {
    const board = emptyBoard();
    board[0] = { color: 'w', count: 3 };
    board[1] = { color: 'w', count: 3 };
    board[2] = { color: 'w', count: 3 };
    board[3] = { color: 'w', count: 3 };
    board[4] = { color: 'w', count: 3 };
    const state = stateWithDice({ board, bornOff: { w: 0, b: 0 } }, [1, 2]);
    const seqs = generateLegalSequences(state, [1, 2]);
    expect(seqs.length).toBeGreaterThan(0);
    const hasBearOff = seqs.some((seq) => seq.some((sm) => sm.to === 'off'));
    expect(hasBearOff).toBe(true);
  });

  it('bear-off NOT available when stone outside home', () => {
    const board = emptyBoard();
    board[0] = { color: 'w', count: 14 };
    board[10] = { color: 'w', count: 1 }; // outside home
    const state = stateWithDice({ board, bornOff: { w: 0, b: 0 } }, [1, 2]);
    const seqs = generateLegalSequences(state, [1, 2]);
    const hasBearOff = seqs.some((seq) => seq.some((sm) => sm.to === 'off'));
    expect(hasBearOff).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6-block rule in generation
// ---------------------------------------------------------------------------

describe('generateLegalSequences — 6-block rule', () => {
  it('always-forbidden: move creating 6-block is excluded', () => {
    // White has 5 consecutive blocks at 1-5. Moving from point 6 to point 5 (die=1)
    // would complete a 6-block (1,2,3,4,5,6 → no, actually 0,1,2,3,4,5 if from 6 to 5).
    // Setup: white stones at 0,1,2,3,4 (5-block) + a stone at 6.
    // Moving 6→5 (die=1) would create 0,1,2,3,4,5 = 6-block.
    const board = emptyBoard();
    board[0] = { color: 'w', count: 2 };
    board[1] = { color: 'w', count: 2 };
    board[2] = { color: 'w', count: 2 };
    board[3] = { color: 'w', count: 2 };
    board[4] = { color: 'w', count: 2 };
    board[6] = { color: 'w', count: 2 };  // source stone
    // Die=1: from 6, nextPoint('w', 6, 1) = ?
    // White path: 23,22,21,...,6 is at path pos 17. Move 1 → pos 18 → board point 5.
    // So 6 → 5. This creates 6-block at 0,1,2,3,4,5. Should be forbidden.
    const state: BackgammonState = {
      ...createInitialState(
        { ...RULE_PRESETS.classic, sixBlockRule: 'always-forbidden' },
        'w',
      ),
      board,
      isFirstTurn: false,
      headTakenThisTurn: 0,
      dice: { values: [1, 3], remaining: [1, 3] },
    };
    const seqs = generateLegalSequences(state, [1, 3]);
    // No sequence should create a 6-block by moving to point 5 from point 6.
    // (Moving 6 → 5 with die=1 is the only die=1 sub-move available).
    const creates6Block = seqs.some((seq) => seq.some((sm) => sm.from === 6 && sm.to === 5));
    expect(creates6Block).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

describe('generateLegalSequences — deduplication', () => {
  it('multiple stones on same point do not produce duplicate sequences', () => {
    const state = stateWithDice({}, [3, 5]);
    const seqs = generateLegalSequences(state, [3, 5]);
    // Deduplicate by canonical key.
    const keys = seqs.map((seq) =>
      seq.map((sm) => `${sm.from}:${String(sm.to)}`).sort().join('|'),
    );
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(seqs.length);
  });
});

// ---------------------------------------------------------------------------
// generateSubMoves
// ---------------------------------------------------------------------------

describe('generateSubMoves', () => {
  it('initial white state + die=3: returns one move (from head to 20)', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'w');
    const stateWithDiceVal = {
      ...state,
      dice: { values: [3, 5] as [number, number], remaining: [3, 5] },
    };
    const moves = generateSubMoves(stateWithDiceVal, 3, state.board, 0);
    expect(moves.length).toBe(1);
    expect(moves[0].from).toBe(WHITE_HEAD);
    expect(moves[0].to).toBe(20);
    expect(moves[0].pips).toBe(3);
  });

  it('generates no moves when all destinations blocked by opponent', () => {
    const board = emptyBoard();
    board[WHITE_HEAD] = { color: 'w', count: 15 };
    // Block all reachable points from head with black stones.
    for (let die = 1; die <= 6; die++) {
      const dest = 23 - die;
      if (dest >= 0) board[dest] = { color: 'b', count: 2 };
    }
    const state = {
      ...createInitialState(RULE_PRESETS.classic, 'w'),
      board,
      dice: { values: [3, 5] as [number, number], remaining: [3, 5] },
    };
    const moves = generateSubMoves(state, 3, board, 0);
    // 23-3=20, blocked by black.
    expect(moves.length).toBe(0);
  });

  it('black initial: generates moves from black head (11)', () => {
    const state = createInitialState(RULE_PRESETS.classic, 'b');
    const stateWithDiceVal = {
      ...state,
      dice: { values: [4, 2] as [number, number], remaining: [4, 2] },
    };
    const moves = generateSubMoves(stateWithDiceVal, 4, state.board, 0);
    expect(moves.length).toBe(1);
    expect(moves[0].from).toBe(BLACK_HEAD);
    expect(moves[0].to).toBe(7);
    expect(moves[0].pips).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// No legal moves → empty sequence
// ---------------------------------------------------------------------------

describe('generateLegalSequences — no moves', () => {
  it('returns [[]] when no moves are possible (all blocked)', () => {
    const board = emptyBoard();
    board[WHITE_HEAD] = { color: 'w', count: 15 };
    // Block every reachable destination.
    for (let die = 1; die <= 6; die++) {
      const dest = 23 - die;
      if (dest >= 0) board[dest] = { color: 'b', count: 2 };
    }
    const state: BackgammonState = {
      ...createInitialState(RULE_PRESETS.classic, 'w'),
      board,
      dice: { values: [2, 4], remaining: [2, 4] },
    };
    const seqs = generateLegalSequences(state, [2, 4]);
    expect(seqs).toHaveLength(1);
    expect(seqs[0]).toHaveLength(0);
  });
});
