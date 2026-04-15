import type { Square } from '../engine/types';
import type { CheckersTutorialArrow } from '../stores/useCheckersTutorialStore';
import type { CheckersMoveOptions } from '../utils/fenUtils';

/**
 * A single move step used by looped demonstrations.
 * Each step animates from -> to; pieces are animated via the normal
 * board transition (see CheckerPiece.tsx MOVE_DURATION).
 */
export interface CheckersTutorialMoveStep {
  /** Origin square */
  from: Square;
  /** Destination square */
  to: Square;
  /** Squares of captured pieces to remove */
  captures?: Square[];
  /** Whether the piece should be crowned on landing */
  crown?: boolean;
  /** Optional delay AFTER the move completes, before the next step */
  pauseAfterMs?: number;
}

/** Config for a looped piece-movement demonstration inside a chapter. */
export interface CheckersTutorialLoop {
  /** FEN that the board is reset to at the start of each loop iteration */
  fen: string;
  /** Sequence of moves to play once per iteration */
  moves: CheckersTutorialMoveStep[];
  /** Pause (ms) between the end of one iteration and the next */
  intervalMs: number;
}

/** A single tutorial chapter for checkers. */
export interface CheckersTutorialChapter {
  /** Stable chapter id */
  id: string;
  /** i18n key for chapter title */
  titleKey: string;
  /** i18n key for chapter body text */
  bodyKey: string;
  /** Position to display when chapter opens */
  fen: string;
  /** Squares to highlight (soft outline) */
  highlights?: Square[];
  /** Arrows to draw on the board */
  arrows?: CheckersTutorialArrow[];
  /** Looped piece-movement demo (optional) */
  loop?: CheckersTutorialLoop;
}

/** Initial checkers FEN (standard starting position) */
const INITIAL_FEN = 'b1b1b1b1/1b1b1b1b/b1b1b1b1/8/8/1w1w1w1w/w1w1w1w1/1w1w1w1w w';

/** Helper: build a loop config with standard default pauses */
function makeLoop(
  fen: string,
  moves: CheckersTutorialMoveStep[],
  intervalMs = 800,
): CheckersTutorialLoop {
  return { fen, moves, intervalMs };
}

/**
 * Convert a CheckersTutorialMoveStep to CheckersMoveOptions for the store.
 *
 * @param step Tutorial move step
 * @returns Options for applyCheckersMoveToFen
 */
export function stepToMoveOptions(step: CheckersTutorialMoveStep): CheckersMoveOptions {
  return {
    captures: step.captures,
    crown: step.crown,
  };
}

/**
 * Ten chapters covering Russian Draughts rules for beginners.
 *
 * 1. Board & Setup — initial position, dark squares
 * 2. The Man — forward diagonal movement
 * 3. Capturing — diagonal jump over opponent
 * 4. Chain Captures — multi-jump sequences
 * 5. Forced Capture — mandatory capture rule
 * 6. Promotion — man becomes king on back rank
 * 7. King Movement — flying king, any distance diagonally
 * 8. King Capture — long-range capture
 * 9. Winning — no pieces or no moves
 * 10. Strategy — center control, advancement, king activation
 */
export const CHECKERS_TUTORIAL_CHAPTERS: CheckersTutorialChapter[] = [
  // 1. Board & Setup
  {
    id: 'board',
    titleKey: 'checkersRules.ch.board.title',
    bodyKey: 'checkersRules.ch.board.body',
    fen: INITIAL_FEN,
    highlights: ['a1', 'c1', 'e1', 'g1', 'b2', 'd2', 'f2', 'h2', 'a3', 'c3', 'e3', 'g3'],
  },

  // 2. The Man (Шашка)
  {
    id: 'man',
    titleKey: 'checkersRules.ch.man.title',
    bodyKey: 'checkersRules.ch.man.body',
    fen: '8/8/8/8/3w4/8/8/8 w',
    highlights: ['c5', 'e5'],
    loop: makeLoop('8/8/8/8/3w4/8/8/8 w', [
      { from: 'd4', to: 'c5', pauseAfterMs: 600 },
    ]),
  },

  // 3. Capturing
  {
    id: 'capture',
    titleKey: 'checkersRules.ch.capture.title',
    bodyKey: 'checkersRules.ch.capture.body',
    fen: '8/8/8/4b3/3w4/8/8/8 w',
    highlights: ['f6'],
    arrows: [{ from: 'd4', to: 'f6', color: '#ef4444' }],
    loop: makeLoop('8/8/8/4b3/3w4/8/8/8 w', [
      { from: 'd4', to: 'f6', captures: ['e5'], pauseAfterMs: 800 },
    ]),
  },

  // 4. Chain Captures (Multi-Jump)
  {
    id: 'chain',
    titleKey: 'checkersRules.ch.chain.title',
    bodyKey: 'checkersRules.ch.chain.body',
    fen: '8/8/5b2/8/3b4/2w5/8/8 w',
    arrows: [
      { from: 'c3', to: 'e5', color: '#ef4444' },
      { from: 'e5', to: 'g7', color: '#ef4444' },
    ],
    loop: makeLoop('8/8/5b2/8/3b4/2w5/8/8 w', [
      { from: 'c3', to: 'e5', captures: ['d4'], pauseAfterMs: 400 },
      { from: 'e5', to: 'g7', captures: ['f6'], pauseAfterMs: 800 },
    ]),
  },

  // 5. Forced Capture Rule
  {
    id: 'forced',
    titleKey: 'checkersRules.ch.forced.title',
    bodyKey: 'checkersRules.ch.forced.body',
    fen: '8/8/8/4b3/3w4/8/8/8 w',
    highlights: ['f6'],
    arrows: [
      { from: 'd4', to: 'f6', color: '#ef4444' },
      { from: 'd4', to: 'c5', color: '#666666' },
      { from: 'd4', to: 'e5', color: '#666666' },
    ],
  },

  // 6. Promotion (Дамка)
  {
    id: 'promotion',
    titleKey: 'checkersRules.ch.promotion.title',
    bodyKey: 'checkersRules.ch.promotion.body',
    fen: '8/2w5/8/8/8/8/8/8 w',
    highlights: ['b8', 'd8'],
    loop: makeLoop('8/2w5/8/8/8/8/8/8 w', [
      { from: 'c7', to: 'd8', crown: true, pauseAfterMs: 1200 },
    ]),
  },

  // 7. King Movement (Дамка ходит)
  {
    id: 'kingMove',
    titleKey: 'checkersRules.ch.kingMove.title',
    bodyKey: 'checkersRules.ch.kingMove.body',
    fen: '8/8/8/8/3W4/8/8/8 w',
    highlights: [
      'a1', 'b2', 'c3', 'e5', 'f6', 'g7', 'h8',
      'a7', 'b6', 'c5', 'e3', 'f2', 'g1',
    ],
    loop: makeLoop('8/8/8/8/3W4/8/8/8 w', [
      { from: 'd4', to: 'g7', pauseAfterMs: 500 },
      { from: 'g7', to: 'e5', pauseAfterMs: 500 },
      { from: 'e5', to: 'b2', pauseAfterMs: 500 },
      { from: 'b2', to: 'd4', pauseAfterMs: 500 },
    ]),
  },

  // 8. King Capture
  {
    id: 'kingCapture',
    titleKey: 'checkersRules.ch.kingCapture.title',
    bodyKey: 'checkersRules.ch.kingCapture.body',
    fen: '8/8/5b2/8/8/2W5/8/8 w',
    arrows: [{ from: 'c3', to: 'g7', color: '#ef4444' }],
    loop: makeLoop('8/8/5b2/8/8/2W5/8/8 w', [
      { from: 'c3', to: 'g7', captures: ['f6'], pauseAfterMs: 1000 },
    ]),
  },

  // 9. Winning the Game
  {
    id: 'winning',
    titleKey: 'checkersRules.ch.winning.title',
    bodyKey: 'checkersRules.ch.winning.body',
    fen: '8/8/8/8/3W4/8/5b2/8 w',
    arrows: [{ from: 'd4', to: 'g1', color: '#ef4444' }],
    loop: makeLoop('8/8/8/8/3W4/8/5b2/8 w', [
      { from: 'd4', to: 'g1', captures: ['f2'], pauseAfterMs: 1200 },
    ]),
  },

  // 10. Strategy Tips
  {
    id: 'strategy',
    titleKey: 'checkersRules.ch.strategy.title',
    bodyKey: 'checkersRules.ch.strategy.body',
    fen: INITIAL_FEN,
    arrows: [
      { from: 'c3', to: 'd4', color: '#7c5cff' },
      { from: 'e3', to: 'd4', color: '#7c5cff' },
      { from: 'e3', to: 'f4', color: '#7c5cff' },
    ],
  },
];

/**
 * Get chapter by id (returns first chapter if id is unknown).
 *
 * @param id Chapter identifier
 * @returns Matching tutorial chapter
 */
export function getCheckersChapterById(id: string | null): CheckersTutorialChapter {
  if (!id) return CHECKERS_TUTORIAL_CHAPTERS[0];
  return CHECKERS_TUTORIAL_CHAPTERS.find((c) => c.id === id) ?? CHECKERS_TUTORIAL_CHAPTERS[0];
}
