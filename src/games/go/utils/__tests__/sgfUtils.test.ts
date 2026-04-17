import { describe, it, expect } from 'vitest';
import { moveToSgf, sgfToMove, movesToSgf, parseSgf } from '../sgfUtils';
import type { Move } from '../../engine/types';

describe('sgfUtils', () => {
  it('moveToSgf encodes plays and passes', () => {
    expect(moveToSgf({ kind: 'play', point: { x: 3, y: 3 }, color: 'b' })).toBe(
      ';B[dd]',
    );
    expect(moveToSgf({ kind: 'pass', color: 'w' })).toBe(';W[]');
    expect(moveToSgf({ kind: 'resign', color: 'b' })).toBe(';B[]');
  });

  it('sgfToMove decodes plays and passes', () => {
    expect(sgfToMove(';B[dd]')).toEqual({
      kind: 'play',
      point: { x: 3, y: 3 },
      color: 'b',
    });
    expect(sgfToMove('W[]')).toEqual({ kind: 'pass', color: 'w' });
    expect(sgfToMove(';X[??]')).toBeNull();
  });

  it('movesToSgf produces a parseable record', () => {
    const moves: Move[] = [
      { kind: 'play', point: { x: 4, y: 4 }, color: 'b' },
      { kind: 'play', point: { x: 3, y: 3 }, color: 'w' },
      { kind: 'pass', color: 'b' },
      { kind: 'pass', color: 'w' },
    ];
    const sgf = movesToSgf(moves, {
      boardSize: 9,
      komi: 7.5,
      scoringRules: 'chinese',
    });
    expect(sgf).toContain('SZ[9]');
    expect(sgf).toContain('KM[7.5]');
    expect(sgf).toContain('RU[Chinese]');
    expect(sgf).toContain(';B[ee]');
    expect(sgf).toContain(';W[dd]');
  });

  it('round-trips moves through movesToSgf + parseSgf', () => {
    const moves: Move[] = [
      { kind: 'play', point: { x: 0, y: 0 }, color: 'b' },
      { kind: 'play', point: { x: 18, y: 18 }, color: 'w' },
      { kind: 'play', point: { x: 9, y: 9 }, color: 'b' },
      { kind: 'pass', color: 'w' },
    ];
    const sgf = movesToSgf(moves, {
      boardSize: 19,
      komi: 6.5,
      scoringRules: 'japanese',
    });
    const parsed = parseSgf(sgf);
    expect(parsed.boardSize).toBe(19);
    expect(parsed.komi).toBe(6.5);
    expect(parsed.scoringRules).toBe('japanese');
    expect(parsed.moves).toEqual(moves);
  });

  it('parseSgf extracts handicap stones from AB property', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[0.5]RU[Japanese]HA[2]AB[pd][dp];W[dd])';
    const parsed = parseSgf(sgf);
    expect(parsed.handicapStones).toHaveLength(2);
    expect(parsed.handicapStones).toContainEqual({ x: 15, y: 3 });
    expect(parsed.handicapStones).toContainEqual({ x: 3, y: 15 });
  });
});
