/**
 * Tests for pathUtils.ts — path traversal, pip counting, and home detection.
 */

import { describe, it, expect } from 'vitest';
import {
  nextPoint,
  pathPosition,
  distanceFromHome,
  pipCount,
  isInHome,
  allStonesInHome,
} from '../pathUtils';
import { WHITE_HEAD, BLACK_HEAD, STONES_PER_SIDE, BOARD_POINTS } from '../constants';
import type { PointState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyBoard(): PointState[] {
  return Array.from({ length: BOARD_POINTS }, () => ({ color: null, count: 0 }));
}

function initialBoard(): PointState[] {
  const board = emptyBoard();
  board[WHITE_HEAD] = { color: 'w', count: STONES_PER_SIDE };
  board[BLACK_HEAD] = { color: 'b', count: STONES_PER_SIDE };
  return board;
}

// ---------------------------------------------------------------------------
// nextPoint — White
// ---------------------------------------------------------------------------

describe('nextPoint — White path', () => {
  it('white moves from head (23) by 3 → lands on 20', () => {
    expect(nextPoint('w', 23, 3)).toBe(20);
  });

  it('white moves from head (23) by 6 → lands on 17', () => {
    expect(nextPoint('w', 23, 6)).toBe(17);
  });

  it('white at point 1 moves by 1 → lands on 0 (last home point)', () => {
    expect(nextPoint('w', 1, 1)).toBe(0);
  });

  it('white at point 0 moves by 1 → "off" (bears off)', () => {
    expect(nextPoint('w', 0, 1)).toBe('off');
  });

  it('white at point 2 moves by 3 → "off" (over-distance bear-off)', () => {
    expect(nextPoint('w', 2, 3)).toBe('off');
  });

  it('white at point 5 (home start) moves by 5 → lands on 0', () => {
    expect(nextPoint('w', 5, 5)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// nextPoint — Black
// ---------------------------------------------------------------------------

describe('nextPoint — Black path', () => {
  it('black moves from head (11) by 4 → lands on 7', () => {
    expect(nextPoint('b', 11, 4)).toBe(7);
  });

  it('black at point 0 moves by 1 → wraps to 23', () => {
    expect(nextPoint('b', 0, 1)).toBe(23);
  });

  it('black at point 13 moves by 1 → lands on 12 (last home point)', () => {
    expect(nextPoint('b', 13, 1)).toBe(12);
  });

  it('black at point 12 moves by 1 → "off"', () => {
    expect(nextPoint('b', 12, 1)).toBe('off');
  });

  it('black at point 14 moves by 3 → "off" (over-distance)', () => {
    expect(nextPoint('b', 14, 3)).toBe('off');
  });

  it('black at point 1 moves by 2 → wraps: position 10+2=12 → BLACK_PATH[12]=23 wait...', () => {
    // Black path position of 1 is 10 (BLACK_PATH[10]=1). Moving 2 → position 12 → board point 23.
    expect(nextPoint('b', 1, 2)).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// pathPosition
// ---------------------------------------------------------------------------

describe('pathPosition', () => {
  it('white head (23) is at path position 0', () => {
    expect(pathPosition('w', 23)).toBe(0);
  });

  it('white point 0 is at path position 23', () => {
    expect(pathPosition('w', 0)).toBe(23);
  });

  it('black head (11) is at path position 0', () => {
    expect(pathPosition('b', 11)).toBe(0);
  });

  it('black point 12 is at path position 23', () => {
    expect(pathPosition('b', 12)).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// distanceFromHome
// ---------------------------------------------------------------------------

describe('distanceFromHome', () => {
  it('white at head (23) has distance 23 (farthest from exit)', () => {
    expect(distanceFromHome('w', 23)).toBe(23);
  });

  it('white at point 0 has distance 0 (adjacent to exit)', () => {
    expect(distanceFromHome('w', 0)).toBe(0);
  });

  it('black at head (11) has distance 23', () => {
    expect(distanceFromHome('b', 11)).toBe(23);
  });

  it('black at point 12 has distance 0', () => {
    expect(distanceFromHome('b', 12)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// pipCount — initial position
// ---------------------------------------------------------------------------

describe('pipCount — initial position', () => {
  it('white pip count at start is 15 × 24 = 360', () => {
    // All 15 white stones on WHITE_HEAD (path position 0 → distance 23 → pips 24 each).
    const board = initialBoard();
    expect(pipCount(board, { w: 0, b: 0 }, 'w')).toBe(15 * 24);
  });

  it('black pip count at start is 15 × 24 = 360', () => {
    const board = initialBoard();
    expect(pipCount(board, { w: 0, b: 0 }, 'b')).toBe(15 * 24);
  });

  it('pip count decreases when a stone moves forward', () => {
    const board = initialBoard();
    // Move one white stone from 23 to 20 (3 pips forward).
    board[WHITE_HEAD] = { color: 'w', count: 14 };
    board[20] = { color: 'w', count: 1 };
    // White head pips: 14 × 24 = 336; point 20 path pos = 3 → distance 20 → pips 21.
    expect(pipCount(board, { w: 0, b: 0 }, 'w')).toBe(14 * 24 + 21);
  });
});

// ---------------------------------------------------------------------------
// isInHome
// ---------------------------------------------------------------------------

describe('isInHome', () => {
  it('white home: points 0..5 are in home', () => {
    for (let p = 0; p <= 5; p++) {
      expect(isInHome('w', p)).toBe(true);
    }
  });

  it('white point 6 is NOT in home', () => {
    expect(isInHome('w', 6)).toBe(false);
  });

  it('white head (23) is NOT in home', () => {
    expect(isInHome('w', WHITE_HEAD)).toBe(false);
  });

  it('black home: points 12..17 are in home', () => {
    for (let p = 12; p <= 17; p++) {
      expect(isInHome('b', p)).toBe(true);
    }
  });

  it('black head (11) is NOT in home', () => {
    expect(isInHome('b', BLACK_HEAD)).toBe(false);
  });

  it('black point 18 is NOT in home', () => {
    expect(isInHome('b', 18)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// allStonesInHome
// ---------------------------------------------------------------------------

describe('allStonesInHome', () => {
  it('initial position: white NOT all in home', () => {
    const board = initialBoard();
    expect(allStonesInHome(board, { w: 0, b: 0 }, 'w')).toBe(false);
  });

  it('all white stones on home points: returns true', () => {
    const board = emptyBoard();
    // Spread 15 white stones across points 0..4.
    board[0] = { color: 'w', count: 3 };
    board[1] = { color: 'w', count: 3 };
    board[2] = { color: 'w', count: 3 };
    board[3] = { color: 'w', count: 3 };
    board[4] = { color: 'w', count: 3 };
    expect(allStonesInHome(board, { w: 0, b: 0 }, 'w')).toBe(true);
  });

  it('all white stones already borne off: returns true', () => {
    const board = emptyBoard();
    expect(allStonesInHome(board, { w: 15, b: 0 }, 'w')).toBe(true);
  });

  it('one white stone outside home: returns false', () => {
    const board = emptyBoard();
    board[0] = { color: 'w', count: 14 };
    board[10] = { color: 'w', count: 1 }; // outside home
    expect(allStonesInHome(board, { w: 0, b: 0 }, 'w')).toBe(false);
  });
});
