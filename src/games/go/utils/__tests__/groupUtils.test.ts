import { describe, it, expect } from 'vitest';
import {
  cloneBoard,
  getGroup,
  getLiberties,
  getNeighbors,
  pointEquals,
  pointKey,
} from '../groupUtils';
import type { Board, Intersection } from '../../engine/types';

/** Build an empty board for tests. */
function empty(size: number): Board {
  return Array.from({ length: size }, () =>
    new Array<Intersection>(size).fill(null),
  );
}

describe('groupUtils', () => {
  it('getNeighbors: corner has 2, edge has 3, center has 4', () => {
    expect(getNeighbors({ x: 0, y: 0 }, 9)).toHaveLength(2);
    expect(getNeighbors({ x: 0, y: 4 }, 9)).toHaveLength(3);
    expect(getNeighbors({ x: 4, y: 4 }, 9)).toHaveLength(4);
  });

  it('getGroup: returns empty on empty point', () => {
    const board = empty(9);
    expect(getGroup(board, { x: 4, y: 4 })).toEqual([]);
  });

  it('getGroup: single stone returns single-point group', () => {
    const board = empty(9);
    board[4][4] = 'b';
    const group = getGroup(board, { x: 4, y: 4 });
    expect(group).toHaveLength(1);
    expect(group[0]).toEqual({ x: 4, y: 4 });
  });

  it('getGroup: connected chain is detected orthogonally', () => {
    const board = empty(9);
    board[4][3] = 'b';
    board[4][4] = 'b';
    board[4][5] = 'b';
    const group = getGroup(board, { x: 4, y: 4 });
    expect(group).toHaveLength(3);
  });

  it('getGroup: diagonal stones are NOT connected', () => {
    const board = empty(9);
    board[4][4] = 'b';
    board[3][3] = 'b';
    const group = getGroup(board, { x: 4, y: 4 });
    expect(group).toHaveLength(1);
  });

  it('getLiberties: corner stone has 2 liberties', () => {
    const board = empty(9);
    board[0][0] = 'b';
    const libs = getLiberties(board, [{ x: 0, y: 0 }]);
    expect(libs).toHaveLength(2);
  });

  it('getLiberties: center stone has 4 liberties', () => {
    const board = empty(9);
    board[4][4] = 'b';
    const libs = getLiberties(board, [{ x: 4, y: 4 }]);
    expect(libs).toHaveLength(4);
  });

  it('getLiberties: fully surrounded stone has 0 liberties', () => {
    const board = empty(9);
    board[4][4] = 'b';
    board[3][4] = 'w';
    board[5][4] = 'w';
    board[4][3] = 'w';
    board[4][5] = 'w';
    const libs = getLiberties(board, [{ x: 4, y: 4 }]);
    expect(libs).toHaveLength(0);
  });

  it('cloneBoard produces an independent copy', () => {
    const board = empty(9);
    board[0][0] = 'b';
    const copy = cloneBoard(board);
    copy[0][0] = 'w';
    expect(board[0][0]).toBe('b');
  });

  it('pointEquals and pointKey behave consistently', () => {
    expect(pointEquals({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    expect(pointEquals({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false);
    expect(pointKey({ x: 3, y: 4 })).toBe('3,4');
  });
});
