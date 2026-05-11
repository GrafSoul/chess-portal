/**
 * Persistent Zustand store for finished Backgammon games.
 *
 * Follows the same shape as `useGoStatsStore`, `useCheckersStatsStore`, and
 * `useChessStatsStore` so `StatsPage` can aggregate all four games under a
 * uniform tab interface.
 *
 * The game history list is the single source of truth. Summary counts
 * (wins / losses / draws) are derived at read time via
 * {@link selectBackgammonStatsSummary} so no derived state ever gets stale.
 *
 * Records are prepended (most recent first) and capped at
 * {@link MAX_RECORDS} to keep storage size bounded.
 *
 * Persisted to `localStorage` under the key `'backgammon-stats'`.
 *
 * @example
 * ```ts
 * const recordGame = useBackgammonStatsStore((s) => s.recordGame);
 * recordGame({
 *   finishedAt: Date.now(),
 *   mode: 'ai',
 *   aiLevel: 'medium',
 *   endReason: 'completed',
 *   outcome: 'win',
 *   winner: 'w',
 *   playerColor: 'w',
 *   winType: 'normal',
 *   moveCount: 42,
 *   durationMs: 180_000,
 *   rulesPreset: 'classic',
 * });
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel } from '../config/aiLevels';
import type { StoneColor, WinType } from '../engine/types';
import type { BackgammonGameMode } from './useBackgammonStore';
import type { RULE_PRESETS } from '../config/variants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Outcome of a Backgammon game from the human player's perspective. */
export type BackgammonGameOutcome = 'win' | 'loss';

/**
 * Why a Backgammon game ended.
 * - `'completed'` — a player bore off all 15 stones normally.
 * - `'resigned'`  — a player resigned before completing the game.
 */
export type BackgammonGameEndReason = 'completed' | 'resigned';

/** A persisted record of one finished Backgammon game. */
export interface BackgammonGameRecord {
  /** Unique identifier: `${finishedAt}-${Math.random().toString(36).slice(2)}`. */
  id: string;
  /** Unix timestamp (ms) when the game finished. */
  finishedAt: number;
  /** Whether the game was played against the AI or locally. */
  mode: BackgammonGameMode;
  /**
   * AI difficulty at the time the game was played.
   * Only present when `mode === 'ai'`.
   */
  aiLevel?: AILevel;
  /** How the game ended. */
  endReason: BackgammonGameEndReason;
  /**
   * Outcome from the human player's perspective.
   * `null` when `mode === 'local'` (no single "winner" from the player's view).
   */
  outcome: BackgammonGameOutcome | null;
  /** The color that won, or `null` if the game had no clear winner (should not occur in backgammon). */
  winner: StoneColor | null;
  /** The human player's color (white/black). */
  playerColor: StoneColor;
  /**
   * Win classification: `'normal'` (1 pt), `'mars'` (2 pts), or `'kokc'` (3 pts).
   * `null` only if the game record is incomplete.
   */
  winType: WinType | null;
  /** Number of completed turns in the game (one per side's roll-and-move sequence). */
  moveCount: number;
  /** Total wall-clock duration of the game in milliseconds. */
  durationMs: number;
  /** The rules preset used for this game (`'classic'`, `'strict'`, etc.). */
  rulesPreset: keyof typeof RULE_PRESETS;
}

/** Derived summary counts computed from a game history list. */
export interface BackgammonStatsSummary {
  /** Total games played. */
  played: number;
  /** Games where the human player won (AI mode only). */
  wins: number;
  /** Games where the human player lost (AI mode only). */
  losses: number;
  /** Always 0 — backgammon has no draws. */
  draws: number;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/**
 * Derives a {@link BackgammonStatsSummary} from a game history list.
 *
 * Called in `StatsPage` to compute tab counts without additional reactive state.
 *
 * @param history - Array of {@link BackgammonGameRecord} values (any order).
 * @returns Aggregated summary counts.
 *
 * @example
 * ```ts
 * const summary = selectBackgammonStatsSummary(useBackgammonStatsStore.getState().gameHistory);
 * console.log(summary.wins); // → 7
 * ```
 */
export function selectBackgammonStatsSummary(
  history: BackgammonGameRecord[],
): BackgammonStatsSummary {
  let wins = 0;
  let losses = 0;
  for (const r of history) {
    if (r.outcome === 'win') wins++;
    else if (r.outcome === 'loss') losses++;
  }
  return { played: history.length, wins, losses, draws: 0 };
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

/** Observable state slice for Backgammon stats. */
interface BackgammonStatsState {
  /** Completed game records, most recent first. Capped at {@link MAX_RECORDS}. */
  gameHistory: BackgammonGameRecord[];
}

/** Mutating actions on the Backgammon stats store. */
interface BackgammonStatsActions {
  /**
   * Append a finished game to the front of the history list.
   * Auto-generates a unique `id`.
   *
   * @param record - All fields of {@link BackgammonGameRecord} except `id`.
   */
  recordGame: (record: Omit<BackgammonGameRecord, 'id'>) => void;

  /** Erase all stored Backgammon history. */
  clearStats: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of game records retained in storage. */
const MAX_RECORDS = 200;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Persistent Zustand store for Backgammon game statistics.
 *
 * Uses `zustand/persist` with the `'backgammon-stats'` localStorage key.
 * Only plain serializable values are stored — no `Map`, `Set`, or class
 * instances.
 *
 * @example
 * ```ts
 * // Read summary counts for the StatsPage tab
 * const history = useBackgammonStatsStore((s) => s.gameHistory);
 * const { wins, losses } = selectBackgammonStatsSummary(history);
 * ```
 */
export const useBackgammonStatsStore = create<
  BackgammonStatsState & BackgammonStatsActions
>()(
  persist(
    (set) => ({
      gameHistory: [],

      recordGame(record) {
        const id = `${record.finishedAt}-${Math.random().toString(36).slice(2)}`;
        set((s) => ({
          gameHistory: [{ ...record, id }, ...s.gameHistory].slice(0, MAX_RECORDS),
        }));
      },

      clearStats() {
        set({ gameHistory: [] });
      },
    }),
    {
      name: 'backgammon-stats',
    },
  ),
);
