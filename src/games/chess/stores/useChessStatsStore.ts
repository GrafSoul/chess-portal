import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel, GameMode, GameStatus, PieceColor } from '../engine/types';

/** Outcome from the human player's perspective. `null` for `local` mode. */
export type GameOutcome = 'win' | 'loss' | 'draw';

/** Why the game ended. */
export type GameEndReason = 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout';

/** A persisted record of one finished game. */
export interface GameRecord {
  /** Unique id (timestamp + random suffix). */
  id: string;
  /** Time the game finished (ms since epoch). */
  finishedAt: number;
  /** Game mode used. */
  mode: GameMode;
  /** AI difficulty (only for `ai` mode). */
  aiLevel?: AILevel;
  /** Why the game ended. */
  endReason: GameEndReason;
  /** Outcome from the human's perspective. `null` for `local` mode. */
  outcome: GameOutcome | null;
  /** Winning color, or `null` for a draw. */
  winner: PieceColor | null;
  /** Color the human played. */
  playerColor: PieceColor;
  /** Total half-moves played. */
  moveCount: number;
  /** Game length in milliseconds. */
  durationMs: number;
}

/** Maximum number of records kept in storage (older ones drop off). */
const MAX_RECORDS = 200;

interface ChessStatsState {
  /** Most recent finished game first. */
  gameHistory: GameRecord[];
}

interface ChessStatsActions {
  /** Append a finished game to history. */
  recordGame: (record: Omit<GameRecord, 'id'>) => void;
  /** Wipe all stored history. */
  clearStats: () => void;
}

/**
 * Persistent store of finished chess games.
 *
 * The history list is the source of truth — aggregated counts (wins, losses,
 * draws) are derived via `selectStatsSummary` so the two can never drift apart.
 *
 * Persisted to localStorage under `chess-stats`. Records beyond `MAX_RECORDS`
 * are dropped to keep storage bounded.
 */
export const useChessStatsStore = create<ChessStatsState & ChessStatsActions>()(
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
    { name: 'chess-stats', version: 2 },
  ),
);

/** Aggregated counts derived from a records list. */
export interface ChessStatsSummary {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

/**
 * Compute aggregated counts (played / wins / losses / draws) for the human.
 * Local-mode games count toward `played` but not toward win/loss tallies.
 */
export function selectStatsSummary(records: GameRecord[]): ChessStatsSummary {
  const summary: ChessStatsSummary = { played: 0, wins: 0, losses: 0, draws: 0 };
  for (const r of records) {
    summary.played += 1;
    if (r.outcome === 'win') summary.wins += 1;
    else if (r.outcome === 'loss') summary.losses += 1;
    else if (r.outcome === 'draw') summary.draws += 1;
  }
  return summary;
}

/** Whether a `GameStatus` represents a terminal state worth recording. */
export function isTerminalStatus(status: GameStatus): boolean {
  return (
    status === 'checkmate' ||
    status === 'stalemate' ||
    status === 'draw' ||
    status === 'resigned' ||
    status === 'timeout'
  );
}

/**
 * Map terminal `(status, winner, playerColor, mode)` into the human's outcome.
 * Returns `null` for `local` mode (no human perspective).
 */
export function computeOutcome(
  status: GameStatus,
  winner: PieceColor | null,
  playerColor: PieceColor,
  mode: GameMode,
): GameOutcome | null {
  if (mode === 'local') return null;
  if (status === 'stalemate' || status === 'draw') return 'draw';
  if (winner === null) return 'draw';
  return winner === playerColor ? 'win' : 'loss';
}
