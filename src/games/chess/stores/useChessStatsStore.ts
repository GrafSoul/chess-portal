import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel, GameMode, PieceColor } from '../engine/types';

/** A single game record */
interface GameRecord {
  date: string;
  mode: GameMode;
  aiLevel?: AILevel;
  result: 'win' | 'loss' | 'draw';
  playerColor: PieceColor;
  moveCount: number;
  durationMs: number;
}

interface ChessStatsState {
  wins: number;
  losses: number;
  draws: number;
  gameHistory: GameRecord[];
}

interface ChessStatsActions {
  /** Record a completed game */
  recordGame: (record: GameRecord) => void;
  /** Clear all statistics */
  clearStats: () => void;
}

/** Persistent game statistics store */
export const useChessStatsStore = create<ChessStatsState & ChessStatsActions>()(
  persist(
    (set) => ({
      wins: 0,
      losses: 0,
      draws: 0,
      gameHistory: [],

      recordGame(record) {
        set((state) => ({
          wins: state.wins + (record.result === 'win' ? 1 : 0),
          losses: state.losses + (record.result === 'loss' ? 1 : 0),
          draws: state.draws + (record.result === 'draw' ? 1 : 0),
          gameHistory: [record, ...state.gameHistory].slice(0, 100),
        }));
      },

      clearStats() {
        set({ wins: 0, losses: 0, draws: 0, gameHistory: [] });
      },
    }),
    { name: 'chess-stats' },
  ),
);
