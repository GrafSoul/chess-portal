/**
 * Persistent Zustand store of finished Go games.
 *
 * Per-game-type separation: chess, checkers, and Go each have an independent
 * stats store so aggregated counts (games played, wins, losses, draws) never
 * mix across different game types. Mirrors {@link useCheckersStatsStore} and
 * {@link useChessStatsStore} in shape.
 *
 * The history list is the single source of truth; UI derives summary counts
 * from it via {@link selectGoStatsSummary}. Records are capped at
 * {@link MAX_RECORDS} with the most recent game first.
 *
 * Persisted to `localStorage` under the key `'go-stats'`.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel } from '../config/aiLevels';
import type { ScoringRules } from '../config/scoringRules';
import type { BoardSize, GameStatus, Stone } from '../engine/types';
import type { GoGameMode } from './useGoStore';

/** Outcome of a game from the human player's perspective. `null` for local 2-player games. */
export type GoGameOutcome = 'win' | 'loss' | 'draw';

/** Why a Go game ended. */
export type GoGameEndReason = 'passed' | 'resigned' | 'timeout';

/** A persisted record of one finished Go game. */
export interface GoGameRecord {
  /** Unique id (`${finishedAt}-${random}`). */
  id: string;
  /** Time the game finished (ms since epoch). */
  finishedAt: number;
  /** Game mode used: AI or local 2-player. */
  mode: GoGameMode;
  /** AI difficulty (present only when `mode === 'ai'`). */
  aiLevel?: AILevel;
  /** Why the game ended. */
  endReason: GoGameEndReason;
  /** Outcome from the human's perspective. `null` for local mode. */
  outcome: GoGameOutcome | null;
  /** Winning stone color, or `null` for a draw. */
  winner: Stone | null;
  /** Stone color the human played. */
  playerColor: Stone;
  /** Board dimension used. */
  boardSize: BoardSize;
  /** Scoring ruleset that was applied. */
  scoringRules: ScoringRules;
  /** Absolute margin of victory in points (0 on draw / resign / timeout). */
  margin: number;
  /** Total number of moves played (including passes). */
  moveCount: number;
  /** Game duration in milliseconds. */
  durationMs: number;
}

/** Maximum number of game records kept in storage. */
const MAX_RECORDS = 200;

/** Shape of the observable Go stats state. */
interface GoStatsState {
  /** History of finished games, most recent first. */
  gameHistory: GoGameRecord[];
}

/** Mutator actions on the Go stats store. */
interface GoStatsActions {
  /** Append a finished game to history. Auto-assigns an id. */
  recordGame: (record: Omit<GoGameRecord, 'id'>) => void;
  /** Wipe all stored Go history. */
  clearStats: () => void;
}

/**
 * Persistent Zustand store of finished Go games.
 *
 * @example
 * ```ts
 * const recordGame = useGoStatsStore((s) => s.recordGame);
 * recordGame({
 *   finishedAt: Date.now(),
 *   mode: 'ai',
 *   aiLevel: 'medium',
 *   endReason: 'passed',
 *   outcome: 'win',
 *   winner: 'b',
 *   playerColor: 'b',
 *   boardSize: 19,
 *   scoringRules: 'chinese',
 *   margin: 4.5,
 *   moveCount: 112,
 *   durationMs: 942_000,
 * });
 * ```
 */
export const useGoStatsStore = create<GoStatsState & GoStatsActions>()(
  persist(
    (set, get) => ({
      gameHistory: [],

      recordGame(record) {
        const id = `${record.finishedAt}-${Math.random().toString(36).slice(2, 8)}`;
        const next = [{ id, ...record }, ...get().gameHistory].slice(0, MAX_RECORDS);
        set({ gameHistory: next });
      },

      clearStats() {
        set({ gameHistory: [] });
      },
    }),
    { name: 'go-stats', version: 1 },
  ),
);

/** Aggregated counts derived from a records list. */
export interface GoStatsSummary {
  /** Total games played (all modes). */
  played: number;
  /** Games won vs AI. */
  wins: number;
  /** Games lost vs AI. */
  losses: number;
  /** Games drawn vs AI. */
  draws: number;
}

/**
 * Compute aggregated counts for the human player from a list of records.
 *
 * Local-mode games count toward `played` but not toward win/loss/draw tallies
 * (both sides are human — outcome is `null`).
 *
 * @param records - Slice of {@link GoGameRecord} to aggregate over.
 * @returns Summary counts.
 */
export function selectGoStatsSummary(records: GoGameRecord[]): GoStatsSummary {
  const summary: GoStatsSummary = { played: 0, wins: 0, losses: 0, draws: 0 };
  for (const r of records) {
    summary.played += 1;
    if (r.outcome === 'win') summary.wins += 1;
    else if (r.outcome === 'loss') summary.losses += 1;
    else if (r.outcome === 'draw') summary.draws += 1;
  }
  return summary;
}

/** Whether a {@link GameStatus} value represents a terminal state worth recording. */
export function isGoTerminalStatus(status: GameStatus): boolean {
  return status === 'ended';
}

/**
 * Map a terminal Go game state to the human player's outcome.
 *
 * Returns `null` for `local` mode (outcome is not tracked when both sides
 * are human).
 *
 * @param winner - Winning color, `'draw'`, or `null` (unfinished).
 * @param playerColor - Color the human played.
 * @param mode - Game mode in effect.
 */
export function computeGoOutcome(
  winner: Stone | 'draw' | null,
  playerColor: Stone,
  mode: GoGameMode,
): GoGameOutcome | null {
  if (mode === 'local') return null;
  if (winner === null) return null;
  if (winner === 'draw') return 'draw';
  return winner === playerColor ? 'win' : 'loss';
}
