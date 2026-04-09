import type { Square } from '../engine/types';
import type { TutorialArrow } from '../stores/useTutorialStore';

/**
 * A single move step used by looped demonstrations.
 * Each step animates from → to; pieces are animated via the normal board
 * transition (see Piece.tsx MOVE_DURATION).
 */
export interface TutorialMoveStep {
  from: Square;
  to: Square;
  /** Optional delay AFTER the move completes, before the next step. */
  pauseAfterMs?: number;
}

/** Config for a looped piece-movement demonstration inside a chapter. */
export interface TutorialLoop {
  /** FEN that the board is reset to at the start of each loop iteration */
  fen: string;
  /** Sequence of moves to play once per iteration */
  moves: TutorialMoveStep[];
  /** Pause (ms) between the end of one iteration and the next */
  intervalMs: number;
}

/** Sample game played back automatically (SAN moves). */
export interface TutorialSampleGame {
  /** Starting FEN (usually the initial position) */
  fen: string;
  /** Sequence of SAN moves */
  sanMoves: string[];
  /** Pause between moves (should be ≥ MOVE_DURATION = 1500ms) */
  stepPauseMs: number;
  /** Pause after the final move before restarting */
  loopPauseMs: number;
}

/** A single tutorial chapter. */
export interface TutorialChapter {
  /** Stable chapter id (used in state + URL-like identifiers) */
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
  arrows?: TutorialArrow[];
  /** Looped piece-movement demo (optional) */
  loop?: TutorialLoop;
  /** Auto-played sample game (optional, used for the final chapter) */
  sampleGame?: TutorialSampleGame;
}

/** Starting position FEN */
const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Helper: build a loop config with standard default pauses */
function makeLoop(
  fen: string,
  moves: TutorialMoveStep[],
  intervalMs = 600,
): TutorialLoop {
  return { fen, moves, intervalMs };
}

/**
 * Twelve chapters covering the essentials of chess for a beginner.
 *
 * Chapters 1 & 10 are static illustrations (board layout, check/mate).
 * Chapters 2–9 each feature a single piece with a looped movement demo.
 * Chapter 11 shows opening principles with annotated arrows.
 * Chapter 12 auto-plays Scholar's Mate as a sample game.
 */
export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  // 1. Board layout & setup
  {
    id: 'board',
    titleKey: 'rules.ch.board.title',
    bodyKey: 'rules.ch.board.body',
    fen: INITIAL_FEN,
    highlights: ['e1', 'e8', 'd1', 'd8'],
  },

  // 2. King
  {
    id: 'king',
    titleKey: 'rules.ch.king.title',
    bodyKey: 'rules.ch.king.body',
    fen: '8/8/8/8/4K3/8/8/8 w - - 0 1',
    highlights: ['d3', 'e3', 'f3', 'd4', 'f4', 'd5', 'e5', 'f5'],
    loop: makeLoop('8/8/8/8/4K3/8/8/8 w - - 0 1', [
      { from: 'e4', to: 'e5', pauseAfterMs: 400 },
      { from: 'e5', to: 'f5', pauseAfterMs: 400 },
      { from: 'f5', to: 'f4', pauseAfterMs: 400 },
      { from: 'f4', to: 'e4', pauseAfterMs: 400 },
    ]),
  },

  // 3. Queen
  {
    id: 'queen',
    titleKey: 'rules.ch.queen.title',
    bodyKey: 'rules.ch.queen.body',
    fen: '8/8/8/8/4Q3/8/8/8 w - - 0 1',
    highlights: [
      'e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8',
      'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4',
      'a8', 'b7', 'c6', 'd5', 'f3', 'g2', 'h1',
      'b1', 'c2', 'd3', 'f5', 'g6', 'h7',
    ],
    loop: makeLoop('8/8/8/8/4Q3/8/8/8 w - - 0 1', [
      { from: 'e4', to: 'e8', pauseAfterMs: 400 },
      { from: 'e8', to: 'a8', pauseAfterMs: 400 },
      { from: 'a8', to: 'a4', pauseAfterMs: 400 },
      { from: 'a4', to: 'e4', pauseAfterMs: 400 },
    ]),
  },

  // 4. Rook
  {
    id: 'rook',
    titleKey: 'rules.ch.rook.title',
    bodyKey: 'rules.ch.rook.body',
    fen: '8/8/8/8/4R3/8/8/8 w - - 0 1',
    highlights: [
      'e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8',
      'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4',
    ],
    loop: makeLoop('8/8/8/8/4R3/8/8/8 w - - 0 1', [
      { from: 'e4', to: 'e8', pauseAfterMs: 400 },
      { from: 'e8', to: 'a8', pauseAfterMs: 400 },
      { from: 'a8', to: 'a4', pauseAfterMs: 400 },
      { from: 'a4', to: 'e4', pauseAfterMs: 400 },
    ]),
  },

  // 5. Bishop
  {
    id: 'bishop',
    titleKey: 'rules.ch.bishop.title',
    bodyKey: 'rules.ch.bishop.body',
    fen: '8/8/8/8/4B3/8/8/8 w - - 0 1',
    highlights: [
      'a8', 'b7', 'c6', 'd5', 'f3', 'g2', 'h1',
      'b1', 'c2', 'd3', 'f5', 'g6', 'h7',
    ],
    loop: makeLoop('8/8/8/8/4B3/8/8/8 w - - 0 1', [
      { from: 'e4', to: 'h7', pauseAfterMs: 400 },
      { from: 'h7', to: 'b1', pauseAfterMs: 400 },
      { from: 'b1', to: 'a2', pauseAfterMs: 400 },
      { from: 'a2', to: 'e6', pauseAfterMs: 400 },
      { from: 'e6', to: 'e4', pauseAfterMs: 0 }, // illegal diag, fallback: won't play. Reset handled by loop
    ]),
  },

  // 6. Knight
  {
    id: 'knight',
    titleKey: 'rules.ch.knight.title',
    bodyKey: 'rules.ch.knight.body',
    fen: '8/8/8/8/4N3/8/8/8 w - - 0 1',
    highlights: ['d2', 'f2', 'c3', 'g3', 'c5', 'g5', 'd6', 'f6'],
    loop: makeLoop('8/8/8/8/4N3/8/8/8 w - - 0 1', [
      { from: 'e4', to: 'f6', pauseAfterMs: 400 },
      { from: 'f6', to: 'g4', pauseAfterMs: 400 },
      { from: 'g4', to: 'e3', pauseAfterMs: 400 },
      { from: 'e3', to: 'c4', pauseAfterMs: 400 },
      { from: 'c4', to: 'e5', pauseAfterMs: 400 },
      { from: 'e5', to: 'e4', pauseAfterMs: 0 }, // illegal: ignored, reset
    ]),
  },

  // 7. Pawn
  {
    id: 'pawn',
    titleKey: 'rules.ch.pawn.title',
    bodyKey: 'rules.ch.pawn.body',
    fen: '8/8/8/8/8/8/4P3/8 w - - 0 1',
    highlights: ['e3', 'e4'],
    loop: makeLoop('8/8/8/8/8/8/4P3/8 w - - 0 1', [
      { from: 'e2', to: 'e4', pauseAfterMs: 600 },
    ]),
  },

  // 8. Castling
  {
    id: 'castling',
    titleKey: 'rules.ch.castling.title',
    bodyKey: 'rules.ch.castling.body',
    fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    highlights: ['g1', 'c1', 'g8', 'c8'],
    loop: makeLoop('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', [
      { from: 'e1', to: 'g1', pauseAfterMs: 600 }, // short castle (engine handles rook)
    ]),
  },

  // 9. En passant & promotion
  {
    id: 'special',
    titleKey: 'rules.ch.special.title',
    bodyKey: 'rules.ch.special.body',
    fen: '8/4P3/8/8/8/8/8/8 w - - 0 1',
    highlights: ['e8'],
    loop: makeLoop('8/4P3/8/8/8/8/8/8 w - - 0 1', [
      { from: 'e7', to: 'e8', pauseAfterMs: 800 },
    ]),
  },

  // 10. Check, checkmate, stalemate
  {
    id: 'check',
    titleKey: 'rules.ch.check.title',
    bodyKey: 'rules.ch.check.body',
    fen: '4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1',
    highlights: ['e8', 'e7'],
  },

  // 11. Opening principles
  {
    id: 'principles',
    titleKey: 'rules.ch.principles.title',
    bodyKey: 'rules.ch.principles.body',
    fen: INITIAL_FEN,
    arrows: [
      { from: 'e2', to: 'e4', color: '#7c5cff' },
      { from: 'g1', to: 'f3', color: '#7c5cff' },
      { from: 'f1', to: 'c4', color: '#7c5cff' },
    ],
  },

  // 12. Sample game: Scholar's mate
  {
    id: 'sampleGame',
    titleKey: 'rules.ch.sampleGame.title',
    bodyKey: 'rules.ch.sampleGame.body',
    fen: INITIAL_FEN,
    sampleGame: {
      fen: INITIAL_FEN,
      sanMoves: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'],
      stepPauseMs: 1800,
      loopPauseMs: 2500,
    },
  },
];

/** Get chapter by id (returns first chapter if id is unknown). */
export function getChapterById(id: string | null): TutorialChapter {
  if (!id) return TUTORIAL_CHAPTERS[0];
  return TUTORIAL_CHAPTERS.find((c) => c.id === id) ?? TUTORIAL_CHAPTERS[0];
}

