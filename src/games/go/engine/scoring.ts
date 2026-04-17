/**
 * Go scoring algorithms.
 *
 * Two rulesets are supported:
 * - **Chinese (area):** score = own stones on board + territory + (komi for White).
 * - **Japanese (territory):** score = territory + prisoners + (komi for White).
 *
 * Territory is computed by flood-filling empty regions: a region whose border
 * stones are all one color counts as that color's territory; a region bordered
 * by both colors (or by none — a fully-empty board) is neutral (dame).
 *
 * Dead stones (marked by the player after two passes) are treated as empty
 * intersections of the opponent's territory — and, for Japanese scoring, also
 * added as additional prisoners to the opposing player's count.
 */

import type { Board, Point, ScoreBreakdown, Stone } from './types';
import { getNeighbors, pointKey } from '../utils/groupUtils';
import type { ScoringRules } from '../config/scoringRules';

/**
 * Classify every empty intersection on the board as belonging to Black,
 * White, or neutral territory.
 *
 * Dead stones are treated as empty intersections for the purpose of
 * territory classification (their squares flood-fill with adjacent empties).
 *
 * @param board - Current board (may still contain dead stones).
 * @param deadStones - Points marked as dead by the players.
 * @returns Map keyed by `"x,y"` point string → owning color or `'neutral'`.
 */
export function findTerritories(
  board: Board,
  deadStones: Point[] = [],
): Map<string, Stone | 'neutral'> {
  const size = board.length;
  const deadSet = new Set(deadStones.map(pointKey));

  /** Effective cell: null if the cell is empty OR holds a dead stone. */
  const cellAt = (x: number, y: number): Stone | null => {
    if (deadSet.has(`${x},${y}`)) return null;
    return board[y][x];
  };

  const result = new Map<string, Stone | 'neutral'>();
  const visited = new Set<string>();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cellAt(x, y) !== null) continue;
      const startKey = `${x},${y}`;
      if (visited.has(startKey)) continue;

      // BFS flood-fill across empty + dead cells. Only empty cells are
      // added to the GLOBAL visited set — border stones must remain
      // re-encounterable so adjacent regions can still see them.
      const region: Point[] = [];
      const bordersBlack = { value: false };
      const bordersWhite = { value: false };
      const localSeen = new Set<string>();
      const stack: Point[] = [{ x, y }];
      while (stack.length > 0) {
        const p = stack.pop() as Point;
        const pk = pointKey(p);
        if (localSeen.has(pk)) continue;
        localSeen.add(pk);

        if (cellAt(p.x, p.y) !== null) {
          // A live stone on the border — record its color and stop expanding from here
          if (board[p.y][p.x] === 'b') bordersBlack.value = true;
          else bordersWhite.value = true;
          continue;
        }
        // Only mark empties globally — stones are fair game for other regions.
        visited.add(pk);
        region.push(p);

        for (const n of getNeighbors(p, size)) {
          if (!localSeen.has(pointKey(n))) stack.push(n);
        }
      }

      // Classify region
      let owner: Stone | 'neutral';
      if (bordersBlack.value && !bordersWhite.value) owner = 'b';
      else if (bordersWhite.value && !bordersBlack.value) owner = 'w';
      else owner = 'neutral';

      for (const p of region) result.set(pointKey(p), owner);
    }
  }

  return result;
}

/** Per-color live-stone count (excluding dead stones). */
function countLiveStones(
  board: Board,
  deadStones: Point[],
): { black: number; white: number } {
  const deadSet = new Set(deadStones.map(pointKey));
  let black = 0;
  let white = 0;
  const size = board.length;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (deadSet.has(`${x},${y}`)) continue;
      const cell = board[y][x];
      if (cell === 'b') black++;
      else if (cell === 'w') white++;
    }
  }
  return { black, white };
}

/** Territory cell counts per color. */
function countTerritory(
  territories: Map<string, Stone | 'neutral'>,
): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (const owner of territories.values()) {
    if (owner === 'b') black++;
    else if (owner === 'w') white++;
  }
  return { black, white };
}

/** Count dead stones per color — these become prisoners for the opposite side. */
function countDeadStonesByColor(
  board: Board,
  deadStones: Point[],
): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (const p of deadStones) {
    const c = board[p.y]?.[p.x];
    if (c === 'b') black++;
    else if (c === 'w') white++;
  }
  return { black, white };
}

/**
 * Score a game under **Chinese (area)** rules.
 *
 * Each side's total = live stones on board + territory, plus komi for White.
 * Prisoners are not counted separately (the exchange of stones is already
 * reflected in board presence).
 *
 * @param board - Final board.
 * @param komi - Komi compensation for White.
 * @param deadStones - Points marked as dead.
 * @returns Full score breakdown.
 */
export function scoreChinese(
  board: Board,
  komi: number,
  deadStones: Point[] = [],
): ScoreBreakdown {
  const territories = findTerritories(board, deadStones);
  const terr = countTerritory(territories);
  const live = countLiveStones(board, deadStones);

  const blackTotal = live.black + terr.black;
  const whiteTotal = live.white + terr.white + komi;

  return {
    black: {
      territory: terr.black,
      stones: live.black,
      prisoners: 0,
      total: blackTotal,
    },
    white: {
      territory: terr.white,
      stones: live.white,
      prisoners: 0,
      komi,
      total: whiteTotal,
    },
    winner: computeWinner(blackTotal, whiteTotal),
    margin: Math.abs(blackTotal - whiteTotal),
  };
}

/**
 * Score a game under **Japanese (territory)** rules.
 *
 * Each side's total = territory + prisoners, plus komi for White. Stones on
 * the board are not counted.
 *
 * Dead stones are added to the opponent's prisoner count.
 *
 * @param board - Final board.
 * @param komi - Komi compensation for White.
 * @param deadStones - Points marked as dead.
 * @param prisoners - Running prisoner counts accumulated during the game.
 * @returns Full score breakdown.
 */
export function scoreJapanese(
  board: Board,
  komi: number,
  deadStones: Point[] = [],
  prisoners: { black: number; white: number } = { black: 0, white: 0 },
): ScoreBreakdown {
  const territories = findTerritories(board, deadStones);
  const terr = countTerritory(territories);
  const dead = countDeadStonesByColor(board, deadStones);

  // Black's prisoners = stones captured during play + dead white stones at end.
  const blackPrisoners = prisoners.black + dead.white;
  const whitePrisoners = prisoners.white + dead.black;

  const blackTotal = terr.black + blackPrisoners;
  const whiteTotal = terr.white + whitePrisoners + komi;

  const live = countLiveStones(board, deadStones);

  return {
    black: {
      territory: terr.black,
      stones: live.black,
      prisoners: blackPrisoners,
      total: blackTotal,
    },
    white: {
      territory: terr.white,
      stones: live.white,
      prisoners: whitePrisoners,
      komi,
      total: whiteTotal,
    },
    winner: computeWinner(blackTotal, whiteTotal),
    margin: Math.abs(blackTotal - whiteTotal),
  };
}

/**
 * Dispatcher: score a game by the given ruleset.
 *
 * @param board - Final board.
 * @param rules - `'chinese'` or `'japanese'`.
 * @param komi - Komi compensation for White.
 * @param deadStones - Points marked as dead.
 * @param prisoners - Running prisoner counts (used only for Japanese scoring).
 * @returns Full score breakdown.
 */
export function scoreGame(
  board: Board,
  rules: ScoringRules,
  komi: number,
  deadStones: Point[] = [],
  prisoners: { black: number; white: number } = { black: 0, white: 0 },
): ScoreBreakdown {
  return rules === 'chinese'
    ? scoreChinese(board, komi, deadStones)
    : scoreJapanese(board, komi, deadStones, prisoners);
}

/**
 * Determine the winner given two totals.
 *
 * @param blackTotal - Black's total score.
 * @param whiteTotal - White's total score.
 * @returns `'b'`, `'w'`, or `'draw'`.
 */
function computeWinner(blackTotal: number, whiteTotal: number): Stone | 'draw' {
  if (blackTotal > whiteTotal) return 'b';
  if (whiteTotal > blackTotal) return 'w';
  return 'draw';
}
