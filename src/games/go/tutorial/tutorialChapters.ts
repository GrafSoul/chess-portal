/**
 * Go tutorial chapter definitions.
 *
 * Each chapter defines a static board position, highlight points, arrows,
 * and an optional looped placement demonstration. All positions use a
 * compact notation parsed by {@link parseGoBoard}.
 *
 * Chapters are designed for 9x9 boards to keep demonstrations clear and
 * the board readable at any screen size.
 *
 * @module
 */

import type { Point, Stone } from '../engine/types';

/**
 * Arrow drawn on the 3D board during a tutorial chapter.
 * Points from one intersection to another with an optional color.
 *
 * @example
 * ```ts
 * const arrow: GoTutorialArrow = {
 *   from: { x: 4, y: 4 },
 *   to:   { x: 4, y: 3 },
 *   color: '#22c55e',
 * };
 * ```
 */
export interface GoTutorialArrow {
  /** Start intersection. */
  from: Point;
  /** End intersection. */
  to: Point;
  /** CSS/hex color. Defaults to accent violet. */
  color?: string;
}

/**
 * A single stone placement in a looped demonstration.
 * Each step places a stone, optionally removes captured stones, and pauses.
 *
 * @example
 * ```ts
 * const step: GoTutorialPlacementStep = {
 *   point: { x: 4, y: 2 },
 *   color: 'b',
 *   captures: [{ x: 4, y: 4 }],
 *   pauseAfterMs: 1200,
 * };
 * ```
 */
export interface GoTutorialPlacementStep {
  /** Where to place the stone. */
  point: Point;
  /** Color of the stone to place. */
  color: Stone;
  /** Points of stones to remove after placement (captures). */
  captures?: Point[];
  /** Delay in ms after placement before the next step. */
  pauseAfterMs?: number;
}

/**
 * Configuration for a looped board demonstration within a chapter.
 * The board resets to `boardNotation` at the start of each cycle.
 *
 * @example
 * ```ts
 * const loop: GoTutorialLoop = {
 *   boardNotation: '9/9/9/9/9/9/9/9/9',
 *   steps: [
 *     { point: { x: 4, y: 4 }, color: 'b', pauseAfterMs: 800 },
 *     { point: { x: 4, y: 2 }, color: 'w', pauseAfterMs: 800 },
 *   ],
 *   intervalMs: 1200,
 * };
 * ```
 */
export interface GoTutorialLoop {
  /** Board position to reset to at the start of each loop iteration. */
  boardNotation: string;
  /** Sequence of stone placements to animate per iteration. */
  steps: GoTutorialPlacementStep[];
  /** Pause in ms between the end of one cycle and the start of the next. */
  intervalMs: number;
}

/**
 * A single tutorial chapter for Go.
 *
 * @example
 * ```ts
 * const chapter: GoTutorialChapter = {
 *   id: 'liberties',
 *   titleKey: 'goRules.ch.liberties.title',
 *   bodyKey:  'goRules.ch.liberties.body',
 *   boardNotation: '9/9/9/9/4b4/9/9/9/9',
 *   highlights: [{ x: 3, y: 4 }, { x: 5, y: 4 }],
 *   arrows: [{ from: { x: 4, y: 4 }, to: { x: 3, y: 4 }, color: '#22c55e' }],
 * };
 * ```
 */
export interface GoTutorialChapter {
  /** Stable chapter identifier. */
  id: string;
  /** i18n key for the chapter title. */
  titleKey: string;
  /** i18n key for the chapter body text. */
  bodyKey: string;
  /** Compact board notation for the initial display position. */
  boardNotation: string;
  /** Points to highlight on the board (soft glow). */
  highlights?: Point[];
  /** Arrows to draw on the board. */
  arrows?: GoTutorialArrow[];
  /** Optional looped placement demonstration. */
  loop?: GoTutorialLoop;
}

/** Shorthand point constructor. */
const p = (x: number, y: number): Point => ({ x, y });

/** Empty 9x9 board notation. */
const EMPTY_9 = '9/9/9/9/9/9/9/9/9';

/**
 * Ten chapters covering Go rules for complete beginners.
 *
 * 1. The Board — grid of intersections, stones go on crossings
 * 2. Placing Stones — stones don't move after placement
 * 3. Liberties — each stone needs empty adjacent points
 * 4. Capturing — surround all liberties to capture
 * 5. Groups — connected stones share liberties
 * 6. Ko Rule — can't immediately recapture a single stone
 * 7. Suicide — can't play where you'd have zero liberties
 * 8. Territory — empty areas surrounded by your color
 * 9. Scoring — Chinese/Japanese rules, komi compensation
 * 10. Strategy — corners, edges, center; protect your eyes
 *
 * @example
 * ```ts
 * // Iterate all chapter titles
 * GO_TUTORIAL_CHAPTERS.forEach((ch) => console.log(ch.titleKey));
 *
 * // Look up a chapter by id
 * const ch = getGoChapterById('ko');
 * ```
 */
export const GO_TUTORIAL_CHAPTERS: GoTutorialChapter[] = [
  // 1. The Board
  {
    id: 'board',
    titleKey: 'goRules.ch.board.title',
    bodyKey: 'goRules.ch.board.body',
    boardNotation: EMPTY_9,
    // Highlight the 4 star points on 9x9
    highlights: [p(2, 2), p(6, 2), p(2, 6), p(6, 6), p(4, 4)],
  },

  // 2. Placing Stones
  {
    id: 'placing',
    titleKey: 'goRules.ch.placing.title',
    bodyKey: 'goRules.ch.placing.body',
    boardNotation: '9/9/9/9/4b4/9/9/9/9',
    highlights: [p(4, 4)],
    loop: {
      boardNotation: EMPTY_9,
      steps: [
        { point: p(4, 4), color: 'b', pauseAfterMs: 800 },
        { point: p(4, 2), color: 'w', pauseAfterMs: 800 },
        { point: p(2, 6), color: 'b', pauseAfterMs: 800 },
        { point: p(6, 4), color: 'w', pauseAfterMs: 800 },
      ],
      intervalMs: 1200,
    },
  },

  // 3. Liberties
  {
    id: 'liberties',
    titleKey: 'goRules.ch.liberties.title',
    bodyKey: 'goRules.ch.liberties.body',
    // Single black stone in center with 4 liberties highlighted
    boardNotation: '9/9/9/9/4b4/9/9/9/9',
    highlights: [p(3, 4), p(5, 4), p(4, 3), p(4, 5)],
    arrows: [
      { from: p(4, 4), to: p(3, 4), color: '#22c55e' },
      { from: p(4, 4), to: p(5, 4), color: '#22c55e' },
      { from: p(4, 4), to: p(4, 3), color: '#22c55e' },
      { from: p(4, 4), to: p(4, 5), color: '#22c55e' },
    ],
  },

  // 4. Capturing
  {
    id: 'capture',
    titleKey: 'goRules.ch.capture.title',
    bodyKey: 'goRules.ch.capture.body',
    // White at (4,4) surrounded on 3 sides (left/right/bottom) by black.
    // Sole remaining liberty is (4,3) directly above — highlighted in red.
    // Black plays there to capture white.
    boardNotation: '9/9/9/9/3bwb3/4b4/9/9/9',
    highlights: [p(4, 3)],
    arrows: [
      { from: p(4, 3), to: p(4, 4), color: '#ef4444' },
    ],
    loop: {
      boardNotation: '9/9/9/9/3bwb3/4b4/9/9/9',
      steps: [
        // Black fills white's last liberty, capturing the white stone.
        { point: p(4, 3), color: 'b', captures: [p(4, 4)], pauseAfterMs: 1200 },
      ],
      intervalMs: 1500,
    },
  },

  // 5. Groups
  {
    id: 'groups',
    titleKey: 'goRules.ch.groups.title',
    bodyKey: 'goRules.ch.groups.body',
    // Two connected black stones at (3,4) and (4,4) sharing their liberties.
    // Each stone's inner neighbor is the other stone — not a liberty.
    boardNotation: '9/9/9/9/3bb4/9/9/9/9',
    highlights: [p(2, 4), p(5, 4), p(3, 3), p(4, 3), p(3, 5), p(4, 5)],
    arrows: [
      { from: p(3, 4), to: p(2, 4), color: '#22c55e' },
      { from: p(3, 4), to: p(3, 3), color: '#22c55e' },
      { from: p(3, 4), to: p(3, 5), color: '#22c55e' },
      { from: p(4, 4), to: p(5, 4), color: '#22c55e' },
      { from: p(4, 4), to: p(4, 3), color: '#22c55e' },
      { from: p(4, 4), to: p(4, 5), color: '#22c55e' },
    ],
  },

  // 6. Ko Rule
  {
    id: 'ko',
    titleKey: 'goRules.ch.ko.title',
    bodyKey: 'goRules.ch.ko.body',
    // Ko position: White at (5,4) is in atari — its only liberty is (4,4).
    // Three black stones surround white: (5,3), (6,4), (5,5).
    // Three white stones surround the ko point: (4,3), (3,4), (4,5).
    //
    // If black plays at (4,4), white is captured. Afterwards black at (4,4)
    // has only 1 liberty: (5,4). White cannot immediately recapture there
    // because that would restore the previous board position — ko rule.
    //
    // Board: '9/9/9/4wb3/3w1wb2/4wb3/9/9/9'
    //   y=3: w@(4,3), b@(5,3)
    //   y=4: w@(3,4), empty@(4,4)=ko point, w@(5,4) in atari, b@(6,4)
    //   y=5: w@(4,5), b@(5,5)
    boardNotation: '9/9/9/4wb3/3w1wb2/4wb3/9/9/9',
    highlights: [p(4, 4)],
    arrows: [
      { from: p(4, 4), to: p(5, 4), color: '#ef4444' },
    ],
  },

  // 7. Suicide rule
  {
    id: 'suicide',
    titleKey: 'goRules.ch.suicide.title',
    bodyKey: 'goRules.ch.suicide.body',
    // White surrounded on 3 sides, placing black at the 4th would be suicide... unless it captures
    boardNotation: '9/9/9/4b4/3b.b3/4b4/9/9/9',
    highlights: [p(4, 4)],
    arrows: [
      { from: p(4, 4), to: p(3, 4), color: '#ef4444' },
      { from: p(4, 4), to: p(5, 4), color: '#ef4444' },
      { from: p(4, 4), to: p(4, 3), color: '#ef4444' },
      { from: p(4, 4), to: p(4, 5), color: '#ef4444' },
    ],
  },

  // 8. Territory
  {
    id: 'territory',
    titleKey: 'goRules.ch.territory.title',
    bodyKey: 'goRules.ch.territory.body',
    // Black controls left side, white controls right side
    boardNotation: '9/9/2b3w2/2b3w2/2b3w2/2b3w2/2b3w2/9/9',
    highlights: [
      p(0, 2), p(1, 2), p(0, 3), p(1, 3), p(0, 4), p(1, 4),
      p(0, 5), p(1, 5), p(0, 6), p(1, 6),
      p(7, 2), p(8, 2), p(7, 3), p(8, 3), p(7, 4), p(8, 4),
      p(7, 5), p(8, 5), p(7, 6), p(8, 6),
    ],
  },

  // 9. Scoring
  {
    id: 'scoring',
    titleKey: 'goRules.ch.scoring.title',
    bodyKey: 'goRules.ch.scoring.body',
    boardNotation: '9/9/2b3w2/2b3w2/2b3w2/2b3w2/2b3w2/9/9',
  },

  // 10. Strategy
  {
    id: 'strategy',
    titleKey: 'goRules.ch.strategy.title',
    bodyKey: 'goRules.ch.strategy.body',
    boardNotation: EMPTY_9,
    // Highlight corners as priority areas
    highlights: [p(2, 2), p(6, 2), p(2, 6), p(6, 6)],
    arrows: [
      { from: p(2, 2), to: p(4, 2), color: '#7c5cff' },
      { from: p(6, 2), to: p(4, 2), color: '#7c5cff' },
      { from: p(2, 6), to: p(4, 6), color: '#7c5cff' },
      { from: p(6, 6), to: p(4, 6), color: '#7c5cff' },
    ],
  },
];

/**
 * Look up a chapter by its id.
 *
 * Falls back to the first chapter when `id` is `null` or does not match any
 * defined chapter — so callers never receive `undefined`.
 *
 * @param id - Chapter identifier, or `null` for the first chapter.
 * @returns The matching chapter, or the first chapter if not found.
 *
 * @example
 * ```ts
 * const chapter = getGoChapterById('ko');
 * // chapter.id === 'ko'
 *
 * const first = getGoChapterById(null);
 * // first.id === 'board'
 *
 * const fallback = getGoChapterById('nonexistent');
 * // fallback.id === 'board'  (first chapter)
 * ```
 */
export function getGoChapterById(id: string | null): GoTutorialChapter {
  if (!id) return GO_TUTORIAL_CHAPTERS[0];
  return GO_TUTORIAL_CHAPTERS.find((c) => c.id === id) ?? GO_TUTORIAL_CHAPTERS[0];
}
