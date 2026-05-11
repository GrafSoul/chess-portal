/**
 * Tests for rules/blockRule.ts — six-block detection and mode handling.
 */

import { describe, it, expect } from 'vitest';
import { wouldCreateIllegal6Block } from '../rules/blockRule';
import type { PointState } from '../types';
import type { BackgammonRules } from '../../config/variants';
import { RULE_PRESETS } from '../../config/variants';
import { BOARD_POINTS } from '../constants';

// ---------------------------------------------------------------------------
// Board helpers
// ---------------------------------------------------------------------------

function emptyBoard(): PointState[] {
  return Array.from({ length: BOARD_POINTS }, () => ({ color: null, count: 0 }));
}

/**
 * Builds a board with `count` white stones on each of the given `points`.
 */
function boardWith(
  stones: { point: number; color: 'w' | 'b'; count: number }[],
): PointState[] {
  const board = emptyBoard();
  for (const { point, color, count } of stones) {
    board[point] = { color, count };
  }
  return board;
}

function rulesFor(sixBlockRule: BackgammonRules['sixBlockRule']): BackgammonRules {
  return { ...RULE_PRESETS.classic, sixBlockRule };
}

// ---------------------------------------------------------------------------
// always-allowed
// ---------------------------------------------------------------------------

describe('wouldCreateIllegal6Block — always-allowed', () => {
  it('a 6-block is always legal when mode is always-allowed', () => {
    const board = boardWith([
      { point: 0, color: 'w', count: 2 },
      { point: 1, color: 'w', count: 2 },
      { point: 2, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 },
      { point: 4, color: 'w', count: 2 },
      { point: 5, color: 'w', count: 2 }, // 6 consecutive white points
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-allowed'))).toBe(false);
  });

  it('no 6-block: always-allowed still returns false', () => {
    const board = emptyBoard();
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-allowed'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// always-forbidden
// ---------------------------------------------------------------------------

describe('wouldCreateIllegal6Block — always-forbidden', () => {
  it('a 6-block is always illegal when mode is always-forbidden', () => {
    const board = boardWith([
      { point: 0, color: 'w', count: 2 },
      { point: 1, color: 'w', count: 2 },
      { point: 2, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 },
      { point: 4, color: 'w', count: 2 },
      { point: 5, color: 'w', count: 2 },
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-forbidden'))).toBe(true);
  });

  it('a 5-block is NOT illegal (less than 6 consecutive)', () => {
    const board = boardWith([
      { point: 0, color: 'w', count: 2 },
      { point: 1, color: 'w', count: 2 },
      { point: 2, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 },
      { point: 4, color: 'w', count: 2 },
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-forbidden'))).toBe(false);
  });

  it('a 7-block counts as illegal (≥6 consecutive)', () => {
    const board = boardWith([
      { point: 0, color: 'w', count: 2 },
      { point: 1, color: 'w', count: 2 },
      { point: 2, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 },
      { point: 4, color: 'w', count: 2 },
      { point: 5, color: 'w', count: 2 },
      { point: 6, color: 'w', count: 2 },
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-forbidden'))).toBe(true);
  });

  it('no 6-block → returns false', () => {
    const board = emptyBoard();
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-forbidden'))).toBe(false);
  });

  it('6-block by black does not affect white check', () => {
    const board = boardWith([
      { point: 12, color: 'b', count: 2 },
      { point: 13, color: 'b', count: 2 },
      { point: 14, color: 'b', count: 2 },
      { point: 15, color: 'b', count: 2 },
      { point: 16, color: 'b', count: 2 },
      { point: 17, color: 'b', count: 2 },
    ]);
    // Checking for white: no white 6-block → false
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-forbidden'))).toBe(false);
    // Checking for black: black has 6-block → true
    expect(wouldCreateIllegal6Block(board, 'b', rulesFor('always-forbidden'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// classical
// ---------------------------------------------------------------------------

describe('wouldCreateIllegal6Block — classical', () => {
  it('6-block formed AND no black stone has passed → illegal (false = opponent has NOT passed)', () => {
    // White 6-block on points 0-5.
    // Black opponent stones only on point 11 (their head) — not past the block.
    const board = boardWith([
      { point: 0, color: 'w', count: 2 },
      { point: 1, color: 'w', count: 2 },
      { point: 2, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 },
      { point: 4, color: 'w', count: 2 },
      { point: 5, color: 'w', count: 2 },
      { point: 11, color: 'b', count: 3 }, // Black stones still near head
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('classical'))).toBe(true);
  });

  it('6-block formed AND one black stone IS past the block → legal', () => {
    // White 6-block on points 18-23. Black path from 11: 10,9,...0,23,22...
    // A black stone on point 17 has path position > than any of 18-23 from black's perspective.
    // Black path positions: 11→0, 10→1, ... 18→17, ... Let's pick a point black has passed.
    // Points 18-23 in Black's path: 23→12, 22→13, 21→14, 20→15, 19→16, 18→17.
    // A black stone at point 17 (black path pos 18) is PAST points 18-23 (max path pos = 17).
    const board = boardWith([
      { point: 18, color: 'w', count: 2 },
      { point: 19, color: 'w', count: 2 },
      { point: 20, color: 'w', count: 2 },
      { point: 21, color: 'w', count: 2 },
      { point: 22, color: 'w', count: 2 },
      { point: 23, color: 'w', count: 2 },
      { point: 11, color: 'b', count: 12 }, // Most black stones on head
      { point: 17, color: 'b', count: 3 },  // One black stone HAS passed the block
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('classical'))).toBe(false);
  });

  it('5-block is always legal under classical rule (no 6-block)', () => {
    const board = boardWith([
      { point: 1, color: 'w', count: 2 },
      { point: 2, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 },
      { point: 4, color: 'w', count: 2 },
      { point: 5, color: 'w', count: 2 },
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('classical'))).toBe(false);
  });

  it('no block at all → always false under classical', () => {
    const board = boardWith([
      { point: 0, color: 'w', count: 2 },
      { point: 3, color: 'w', count: 2 }, // gap at 1, 2
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('classical'))).toBe(false);
  });

  it('6-block wrapping around board boundary (23-0) detected in always-forbidden', () => {
    // Points 21,22,23,0,1,2 → 6 consecutive with wrap.
    const board = boardWith([
      { point: 21, color: 'w', count: 2 },
      { point: 22, color: 'w', count: 2 },
      { point: 23, color: 'w', count: 2 },
      { point: 0,  color: 'w', count: 2 },
      { point: 1,  color: 'w', count: 2 },
      { point: 2,  color: 'w', count: 2 },
    ]);
    expect(wouldCreateIllegal6Block(board, 'w', rulesFor('always-forbidden'))).toBe(true);
  });

  it('classical: empty board → false', () => {
    expect(wouldCreateIllegal6Block(emptyBoard(), 'w', rulesFor('classical'))).toBe(false);
  });
});
