/**
 * Backgammon tutorial chapter definitions.
 *
 * Each chapter specifies a static board position (`PointState[]`), optional
 * highlight rings on points, directional arrows between points, and an optional
 * looped animation that cycles through a sequence of board states.
 *
 * Ten chapters cover Long Backgammon rules for complete beginners:
 *  1. The Board       — 24-point ring, home quadrants
 *  2. Starting Setup  — 15w@pt23, 15b@pt11
 *  3. Movement Dir.   — both colors move counter-clockwise
 *  4. The Dice        — 2 sub-moves per roll, 4 for doubles
 *  5. One Color/Point — no hitting, one color per point
 *  6. Head Rule       — 1 stone from head per turn (first-turn exception)
 *  7. Blocking Rule   — 6-block forbidden if it traps all opponent stones
 *  8. Bearing Off     — all 15 in home → start bearing off
 *  9. Winning         — first to 15 borne off; mars; kokc
 * 10. Strategy        — racing, primes, timing
 *
 * @module
 */

import type { PointState, StoneColor, PointIndex } from '../engine/types';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * An arrow drawn between two board points during a tutorial chapter.
 *
 * @example
 * ```ts
 * const arrow: TutorialArrow = { from: 23, to: 19, color: '#7c5cff' };
 * ```
 */
export interface TutorialArrow {
  /** Source point index (0..23). */
  from: PointIndex;
  /** Destination point index (0..23). */
  to: PointIndex;
  /** CSS/hex color; defaults to accent violet when omitted. */
  color?: string;
}

/**
 * A single board state snapshot used inside a looped demo.
 *
 * @example
 * ```ts
 * const step: BackgammonTutorialStep = {
 *   board: board([23, 'w', 14], [19, 'w', 1]),
 *   bornOff: { w: 0, b: 0 },
 *   pauseMs: 1200,
 * };
 * ```
 */
export interface BackgammonTutorialStep {
  /** Board position to snap to. */
  board: PointState[];
  /** Born-off counts to display; defaults to `{w:0, b:0}` when omitted. */
  bornOff?: { w: number; b: number };
  /** Milliseconds to wait on this snapshot before advancing. */
  pauseMs: number;
}

/**
 * A looped sequence of board state snapshots for an animated demonstration.
 *
 * @example
 * ```ts
 * const loop: BackgammonTutorialLoop = {
 *   steps: [
 *     { board: initial, pauseMs: 1000 },
 *     { board: afterMove, pauseMs: 1000 },
 *   ],
 *   intervalMs: 600,
 * };
 * ```
 */
export interface BackgammonTutorialLoop {
  /** Ordered list of board states to cycle through. */
  steps: BackgammonTutorialStep[];
  /** Pause in ms between the last step and the restart of the cycle. */
  intervalMs: number;
}

/**
 * A single tutorial chapter for Long Backgammon.
 *
 * @example
 * ```ts
 * const ch: BackgammonTutorialChapter = {
 *   id: 'head',
 *   titleKey: 'backgammonRules.ch.head.title',
 *   bodyKey: 'backgammonRules.ch.head.body',
 *   board: INITIAL_BOARD,
 *   highlights: [23, 11],
 * };
 * ```
 */
export interface BackgammonTutorialChapter {
  /** Stable identifier. */
  id: string;
  /** i18n key for the chapter title. */
  titleKey: string;
  /** i18n key for the chapter body text. */
  bodyKey: string;
  /** Board position displayed when the chapter opens. */
  board: PointState[];
  /** Born-off stone counts (displayed in the bear-off tray). */
  bornOff?: { w: number; b: number };
  /** Point indices to highlight with a glowing ring. */
  highlights?: PointIndex[];
  /** Arrows to draw between points. */
  arrows?: TutorialArrow[];
  /** Optional looped board-state animation. */
  loop?: BackgammonTutorialLoop;
}

// ─── Board helpers ────────────────────────────────────────────────────────────

/** Build an empty 24-point board (all points vacant). */
function emptyBoard(): PointState[] {
  return Array.from({ length: 24 }, () => ({
    color: null as StoneColor | null,
    count: 0,
  }));
}

/**
 * Build a board from a variadic list of `[pointIndex, color, count]` triples.
 *
 * @param entries - Each entry sets one point's occupancy.
 * @returns A fresh `PointState[]` with those points set.
 *
 * @example
 * ```ts
 * const b = board([23, 'w', 15], [11, 'b', 15]);
 * // b[23] === { color: 'w', count: 15 }
 * ```
 */
function board(...entries: [PointIndex, StoneColor, number][]): PointState[] {
  const b = emptyBoard();
  for (const [pt, color, count] of entries) {
    b[pt] = { color, count };
  }
  return b;
}

// ─── Shared positions ─────────────────────────────────────────────────────────

/**
 * Standard Long Backgammon starting position.
 * White (15) on point 23 (White Head), Black (15) on point 11 (Black Head).
 */
const INITIAL_BOARD = board([23, 'w', 15], [11, 'b', 15]);

/** Born-off counts at game start (both zero). */
const BORN_OFF_ZERO = { w: 0, b: 0 };

// ─── Chapter definitions ──────────────────────────────────────────────────────

/**
 * Ten chapters covering Long Backgammon rules for beginners.
 *
 * @example
 * ```ts
 * BACKGAMMON_TUTORIAL_CHAPTERS.forEach((ch) => console.log(ch.titleKey));
 * ```
 */
export const BACKGAMMON_TUTORIAL_CHAPTERS: BackgammonTutorialChapter[] = [
  // 1. The Board
  {
    id: 'board',
    titleKey: 'backgammonRules.ch.board.title',
    bodyKey: 'backgammonRules.ch.board.body',
    board: emptyBoard(),
    // Highlight home quadrants: White 0-5 (bottom-right), Black 12-17 (left)
    highlights: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17],
  },

  // 2. Starting Setup
  {
    id: 'setup',
    titleKey: 'backgammonRules.ch.setup.title',
    bodyKey: 'backgammonRules.ch.setup.body',
    board: INITIAL_BOARD,
    bornOff: BORN_OFF_ZERO,
    // Highlight the two heads
    highlights: [23, 11],
  },

  // 3. Movement Direction
  {
    id: 'movement',
    titleKey: 'backgammonRules.ch.movement.title',
    bodyKey: 'backgammonRules.ch.movement.body',
    board: board([23, 'w', 12], [19, 'w', 3], [11, 'b', 12], [7, 'b', 3]),
    // Arrows showing the ring direction (counter-clockwise for both)
    arrows: [
      { from: 23, to: 20, color: '#e0d9c8' }, // white travels toward lower indices
      { from: 19, to: 16, color: '#e0d9c8' },
      { from: 11, to: 8, color: '#4a4a52' },  // black travels toward lower indices
      { from: 7, to: 4, color: '#4a4a52' },
    ],
    loop: {
      steps: [
        {
          board: board([23, 'w', 15], [11, 'b', 15]),
          pauseMs: 1000,
        },
        {
          board: board([23, 'w', 14], [19, 'w', 1], [11, 'b', 14], [7, 'b', 1]),
          pauseMs: 1000,
        },
        {
          board: board([23, 'w', 13], [19, 'w', 2], [11, 'b', 13], [7, 'b', 2]),
          pauseMs: 1000,
        },
      ],
      intervalMs: 700,
    },
  },

  // 4. The Dice
  {
    id: 'dice',
    titleKey: 'backgammonRules.ch.dice.title',
    bodyKey: 'backgammonRules.ch.dice.body',
    board: board([23, 'w', 14], [20, 'w', 1], [11, 'b', 15]),
    highlights: [23, 20, 16],
    // Arrow: stone moved 3 from head, then can move 4 more pips
    arrows: [
      { from: 23, to: 20, color: '#7c5cff' },
      { from: 20, to: 16, color: '#7c5cff' },
    ],
    loop: {
      steps: [
        {
          board: board([23, 'w', 14], [20, 'w', 1], [11, 'b', 15]),
          pauseMs: 1400,
        },
        {
          board: board([23, 'w', 14], [16, 'w', 1], [11, 'b', 15]),
          pauseMs: 1400,
        },
      ],
      intervalMs: 700,
    },
  },

  // 5. One Color Per Point
  {
    id: 'nohit',
    titleKey: 'backgammonRules.ch.nohit.title',
    bodyKey: 'backgammonRules.ch.nohit.body',
    // White at 23 and 18; Black at 16 (blocking white from entering there)
    board: board([23, 'w', 12], [18, 'w', 3], [11, 'b', 12], [16, 'b', 3]),
    // Highlight blocked point
    highlights: [16],
    arrows: [
      { from: 18, to: 16, color: '#ef4444' }, // white cannot enter 16 — blocked by black
    ],
  },

  // 6. Head Rule
  {
    id: 'head',
    titleKey: 'backgammonRules.ch.head.title',
    bodyKey: 'backgammonRules.ch.head.body',
    board: INITIAL_BOARD,
    bornOff: BORN_OFF_ZERO,
    highlights: [23, 11],
    // One stone leaves each head
    arrows: [
      { from: 23, to: 19, color: '#e0d9c8' },
      { from: 11, to: 7, color: '#4a4a52' },
    ],
  },

  // 7. Blocking Rule
  {
    id: 'blocking',
    titleKey: 'backgammonRules.ch.blocking.title',
    bodyKey: 'backgammonRules.ch.blocking.body',
    // White has 5 consecutive occupied points (1-5). Point 0 is open — legal.
    // A 6-block closing point 0 would trap all of Black's stones.
    board: board(
      [23, 'w', 7],
      [5, 'w', 2],
      [4, 'w', 2],
      [3, 'w', 2],
      [2, 'w', 2],
      [1, 'w', 2],
      [11, 'b', 15],
    ),
    // Highlight the 5-block prime
    highlights: [1, 2, 3, 4, 5],
  },

  // 8. Bearing Off
  {
    id: 'bearoff',
    titleKey: 'backgammonRules.ch.bearoff.title',
    bodyKey: 'backgammonRules.ch.bearoff.body',
    // All white stones in home (0-5), 1 already borne off
    board: board(
      [5, 'w', 3],
      [4, 'w', 3],
      [3, 'w', 2],
      [2, 'w', 2],
      [1, 'w', 2],
      [0, 'w', 2],
      [11, 'b', 15],
    ),
    bornOff: { w: 1, b: 0 },
    highlights: [0, 1, 2, 3, 4, 5],
    loop: {
      steps: [
        {
          board: board(
            [5, 'w', 3], [4, 'w', 3], [3, 'w', 2],
            [2, 'w', 2], [1, 'w', 2], [0, 'w', 2],
            [11, 'b', 15],
          ),
          bornOff: { w: 1, b: 0 },
          pauseMs: 1600,
        },
        {
          board: board(
            [5, 'w', 3], [4, 'w', 3], [3, 'w', 2],
            [2, 'w', 2], [1, 'w', 2],
            [11, 'b', 15],
          ),
          bornOff: { w: 2, b: 0 },
          pauseMs: 1600,
        },
        {
          board: board(
            [5, 'w', 3], [4, 'w', 3], [3, 'w', 2],
            [2, 'w', 2],
            [11, 'b', 15],
          ),
          bornOff: { w: 3, b: 0 },
          pauseMs: 1600,
        },
      ],
      intervalMs: 700,
    },
  },

  // 9. Winning / Scoring
  {
    id: 'winning',
    titleKey: 'backgammonRules.ch.winning.title',
    bodyKey: 'backgammonRules.ch.winning.body',
    // White has borne off all 15. Black still on head → Mars condition!
    board: board([11, 'b', 15]),
    bornOff: { w: 15, b: 0 },
    highlights: [11],
  },

  // 10. Strategy
  {
    id: 'strategy',
    titleKey: 'backgammonRules.ch.strategy.title',
    bodyKey: 'backgammonRules.ch.strategy.body',
    // Mid-game position: some stones advanced, some still back
    board: board(
      [23, 'w', 8],
      [18, 'w', 3],
      [14, 'w', 2],
      [6, 'w', 2],
      [11, 'b', 8],
      [5, 'b', 4],
      [1, 'b', 3],
    ),
    // Arrows suggesting key moves: advance the runners toward home
    arrows: [
      { from: 18, to: 12, color: '#7c5cff' },
      { from: 14, to: 8, color: '#7c5cff' },
    ],
  },
];

/**
 * Look up a chapter by its id.
 *
 * Falls back to the first chapter when `id` is `null` or unknown.
 *
 * @param id - Chapter identifier, or `null` for the first chapter.
 * @returns The matching chapter, or the first chapter as a fallback.
 *
 * @example
 * ```ts
 * const ch = getBackgammonChapterById('head');
 * // ch.id === 'head'
 *
 * const first = getBackgammonChapterById(null);
 * // first.id === 'board'
 * ```
 */
export function getBackgammonChapterById(id: string | null): BackgammonTutorialChapter {
  if (!id) return BACKGAMMON_TUTORIAL_CHAPTERS[0];
  return (
    BACKGAMMON_TUTORIAL_CHAPTERS.find((c) => c.id === id) ?? BACKGAMMON_TUTORIAL_CHAPTERS[0]
  );
}
