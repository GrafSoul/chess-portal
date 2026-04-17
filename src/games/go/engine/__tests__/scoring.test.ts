import { describe, it, expect } from 'vitest';
import {
  findTerritories,
  scoreChinese,
  scoreJapanese,
  scoreGame,
} from '../scoring';
import type { Board, Intersection } from '../types';
import { pointKey } from '../../utils/groupUtils';

/** Build an empty board for tests. */
function empty(size: number): Board {
  return Array.from({ length: size }, () =>
    new Array<Intersection>(size).fill(null),
  );
}

describe('findTerritories', () => {
  it('empty board → all neutral', () => {
    const t = findTerritories(empty(9));
    expect(t.size).toBe(81);
    for (const owner of t.values()) expect(owner).toBe('neutral');
  });

  it("black wall gives black territory behind it", () => {
    const board = empty(5);
    // Vertical black wall on column 2, rows 0..4
    for (let y = 0; y < 5; y++) board[y][2] = 'b';
    const t = findTerritories(board);
    // Column 0 and 1 → black territory (5+5 = 10 points)
    let blackCount = 0;
    let whiteCount = 0;
    let neutralCount = 0;
    for (const owner of t.values()) {
      if (owner === 'b') blackCount++;
      else if (owner === 'w') whiteCount++;
      else neutralCount++;
    }
    // Both sides of the wall are bordered ONLY by black → 10+10 = 20 black territory.
    expect(blackCount).toBe(20);
    expect(whiteCount).toBe(0);
    expect(neutralCount).toBe(0);
  });

  it('region bordering both colors is neutral (dame)', () => {
    const board = empty(3);
    board[1][0] = 'b';
    board[1][2] = 'w';
    // Single empty middle cell borders both → neutral
    const t = findTerritories(board);
    expect(t.get(pointKey({ x: 1, y: 1 }))).toBe('neutral');
  });
});

describe('scoreChinese', () => {
  it('empty 9×9 board: all neutral, winner by komi', () => {
    const result = scoreChinese(empty(9), 7.5);
    expect(result.black.total).toBe(0);
    expect(result.white.total).toBe(7.5);
    expect(result.winner).toBe('w');
    expect(result.margin).toBe(7.5);
  });

  it('single black stone in corner: stone + its territory', () => {
    const board = empty(5);
    board[0][0] = 'b';
    const result = scoreChinese(board, 0);
    // Chinese: 1 stone + 24 territory = 25 for black, white has nothing
    expect(result.black.stones).toBe(1);
    expect(result.black.territory).toBe(24);
    expect(result.black.total).toBe(25);
    expect(result.winner).toBe('b');
  });
});

describe('scoreJapanese', () => {
  it('empty board: komi only', () => {
    const result = scoreJapanese(empty(9), 6.5);
    expect(result.black.total).toBe(0);
    expect(result.white.total).toBe(6.5);
    expect(result.winner).toBe('w');
  });

  it('counts prisoners into the holder score', () => {
    // No board stones; black captured 3 white earlier
    const result = scoreJapanese(empty(9), 6.5, [], { black: 3, white: 0 });
    expect(result.black.prisoners).toBe(3);
    expect(result.black.total).toBe(3);
    expect(result.white.total).toBe(6.5);
  });

  it('stones on board do NOT add to score (territory scoring)', () => {
    const board = empty(5);
    board[0][0] = 'b';
    // Under Japanese rules only territory + prisoners + komi count.
    const result = scoreJapanese(board, 0);
    // Black owns 24 territory points, 0 prisoners, stones don't count
    expect(result.black.total).toBe(24);
    expect(result.white.total).toBe(0);
  });
});

describe('scoreGame dispatcher', () => {
  it('routes to chinese when rules = chinese', () => {
    const board = empty(5);
    board[0][0] = 'b';
    const a = scoreGame(board, 'chinese', 0);
    const b = scoreChinese(board, 0);
    expect(a).toEqual(b);
  });

  it('routes to japanese when rules = japanese', () => {
    const board = empty(5);
    const a = scoreGame(board, 'japanese', 6.5, [], { black: 1, white: 2 });
    const b = scoreJapanese(board, 6.5, [], { black: 1, white: 2 });
    expect(a).toEqual(b);
  });
});

describe('chinese vs japanese differ on stones count', () => {
  it('same position: chinese > japanese for the player with more stones', () => {
    const board = empty(5);
    board[0][0] = 'b';
    board[2][2] = 'b';
    const ch = scoreChinese(board, 0);
    const jp = scoreJapanese(board, 0);
    // Chinese adds 2 stones to black's total that japanese does not.
    expect(ch.black.total).toBeGreaterThan(jp.black.total);
  });
});
