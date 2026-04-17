import { describe, it, expect } from 'vitest';
import { BOARD_CONFIGS } from '../boardSizes';

describe('BOARD_CONFIGS', () => {
  it('9×9 has 5 star points (4 corners + tengen)', () => {
    expect(BOARD_CONFIGS[9].size).toBe(9);
    expect(BOARD_CONFIGS[9].starPoints).toHaveLength(5);
  });

  it('19×19 has 9 standard hoshi', () => {
    expect(BOARD_CONFIGS[19].size).toBe(19);
    expect(BOARD_CONFIGS[19].starPoints).toHaveLength(9);
  });

  it('both sizes expose a default komi', () => {
    expect(BOARD_CONFIGS[9].defaultKomi).toBeGreaterThan(0);
    expect(BOARD_CONFIGS[19].defaultKomi).toBeGreaterThan(0);
  });

  it('9×9 tengen is at (4, 4)', () => {
    expect(BOARD_CONFIGS[9].starPoints).toContainEqual({ x: 4, y: 4 });
  });

  it('19×19 tengen is at (9, 9)', () => {
    expect(BOARD_CONFIGS[19].starPoints).toContainEqual({ x: 9, y: 9 });
  });
});
