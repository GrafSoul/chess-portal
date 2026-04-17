/**
 * Persistent Zustand store for Go game settings.
 *
 * Mirrors the shape of `useCheckersSettingsStore` — AI difficulty, player
 * color, clock preset, sound toggle — while adding Go-specific options
 * (board size, scoring rules).
 *
 * Persisted to `localStorage` under `'go-settings'` so preferences survive
 * page reloads.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel } from '../config/aiLevels';
import { DEFAULT_AI_LEVEL } from '../config/aiLevels';
import type { ScoringRules } from '../config/scoringRules';
import type { BoardSize, Stone } from '../engine/types';

/**
 * Observable slice of Go settings state managed by Zustand.
 * All fields are persisted to `localStorage` via the `'go-settings'` key.
 */
interface GoSettingsState {
  /** Selected AI difficulty level. Controls playout count and time budget. */
  aiLevel: AILevel;
  /**
   * Color the human plays as.
   * `'b'` = Black (moves first), `'w'` = White.
   * Also determines which side of the board the camera faces.
   */
  playerColor: Stone;
  /**
   * Clock preset key identifying the time control.
   * `'none'` means no clock (unlimited time).
   * Reserved for future clock feature.
   */
  clockPreset: string;
  /** Board dimension in lines. `9` for beginner boards, `19` for full-size. */
  boardSize: BoardSize;
  /**
   * Scoring ruleset applied at game end.
   * `'chinese'` = area scoring (stones + territory).
   * `'japanese'` = territory scoring (territory only, with prisoner subtraction).
   */
  scoringRules: ScoringRules;
  /** Whether in-game sound effects (stone placement, capture) are audible. */
  soundEnabled: boolean;
}

/**
 * Setter actions for `GoSettingsState`.
 * Each setter triggers a re-render only in subscribers that selected the
 * changed field.
 */
interface GoSettingsActions {
  /**
   * Change the AI difficulty level.
   * Takes effect on the next game or the next AI turn if a game is in progress.
   */
  setAILevel: (level: AILevel) => void;
  /**
   * Switch which color the human controls.
   * The AI will automatically take the opposite color.
   */
  setPlayerColor: (color: Stone) => void;
  /** Update the active clock preset. Pass `'none'` to disable the clock. */
  setClockPreset: (preset: string) => void;
  /**
   * Change the board size for the next game.
   * Does not resize a game already in progress.
   */
  setBoardSize: (size: BoardSize) => void;
  /** Switch the scoring ruleset for the next game's final score calculation. */
  setScoringRules: (rules: ScoringRules) => void;
  /** Enable or disable sound effects immediately. */
  setSoundEnabled: (enabled: boolean) => void;
}

/**
 * Persistent Zustand store for Go game settings.
 *
 * All settings survive page reloads via `localStorage` (`'go-settings'`).
 * Use granular selectors to prevent unnecessary re-renders — selecting the
 * entire store object will cause components to re-render on every setter call.
 *
 * @returns Zustand store hook combining `GoSettingsState` and `GoSettingsActions`.
 *
 * @example
 * ```tsx
 * // Read a single field — re-renders only when aiLevel changes
 * const aiLevel = useGoSettingsStore((s) => s.aiLevel);
 *
 * // Invoke an action — never causes a re-render by itself
 * const setAILevel = useGoSettingsStore((s) => s.setAILevel);
 * setAILevel('hard');
 *
 * // Multiple fields via shallow comparison
 * const { boardSize, scoringRules } = useGoSettingsStore(
 *   (s) => ({ boardSize: s.boardSize, scoringRules: s.scoringRules }),
 *   shallow,
 * );
 * ```
 */
export const useGoSettingsStore = create<GoSettingsState & GoSettingsActions>()(
  persist(
    (set) => ({
      aiLevel: DEFAULT_AI_LEVEL,
      playerColor: 'b',
      clockPreset: 'none',
      boardSize: 19,
      scoringRules: 'chinese',
      soundEnabled: true,

      setAILevel: (level) => set({ aiLevel: level }),
      setPlayerColor: (color) => set({ playerColor: color }),
      setClockPreset: (preset) => set({ clockPreset: preset }),
      setBoardSize: (size) => set({ boardSize: size }),
      setScoringRules: (rules) => set({ scoringRules: rules }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    { name: 'go-settings' },
  ),
);
