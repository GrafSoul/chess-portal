import { describe, it, expect } from 'vitest';
import { getHandicapPositions } from '../handicapPositions';
import { BOARD_CONFIGS } from '../boardSizes';
import { pointKey } from '../../utils/groupUtils';

describe('getHandicapPositions', () => {
  it('returns empty for count 0 or 1', () => {
    expect(getHandicapPositions(19, 0)).toEqual([]);
    expect(getHandicapPositions(19, 1)).toEqual([]);
  });

  it('returns empty on 9×9 for any positive count (unsupported)', () => {
    expect(getHandicapPositions(9, 4)).toEqual([]);
  });

  it('handicap 4 on 19×19 returns 4 unique star points', () => {
    const pts = getHandicapPositions(19, 4);
    expect(pts).toHaveLength(4);
    const keys = new Set(pts.map(pointKey));
    expect(keys.size).toBe(4);
    const starKeys = new Set(BOARD_CONFIGS[19].starPoints.map(pointKey));
    for (const p of pts) {
      expect(starKeys.has(pointKey(p))).toBe(true);
    }
  });

  it('handicap 9 returns 9 unique points', () => {
    const pts = getHandicapPositions(19, 9);
    expect(pts).toHaveLength(9);
    const keys = new Set(pts.map(pointKey));
    expect(keys.size).toBe(9);
  });
});
