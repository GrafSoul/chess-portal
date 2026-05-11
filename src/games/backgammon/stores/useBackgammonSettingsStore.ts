/**
 * Persisted settings store for Long Backgammon.
 *
 * Stores player preferences (color, AI level, rules preset, game mode) in
 * localStorage under the key `'backgammon-settings'`. The store is read by
 * `BackgammonPage` at mount time so that preferences survive page reloads.
 *
 * Pattern mirrors `useGoSettingsStore`.
 *
 * @example
 * ```ts
 * const playerColor = useBackgammonSettingsStore((s) => s.playerColor);
 * const rules = useBackgammonSettingsStore((s) => s.getActiveRules());
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RULE_PRESETS } from '../config/variants';
import type { BackgammonRules } from '../config/variants';
import type { AILevel } from '../config/aiLevels';
import type { StoneColor } from '../engine/types';
import type { BackgammonGameMode } from './useBackgammonStore';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

/** All user-configurable settings for Backgammon, persisted across sessions. */
interface BackgammonSettingsState {
  /**
   * Active rules preset key.
   * Determines which `BackgammonRules` object governs the next game.
   */
  rulesPreset: keyof typeof RULE_PRESETS;

  /**
   * Full custom rule object used when `rulesPreset === 'custom'`.
   * `null` when no custom rules have been set.
   */
  customRules: BackgammonRules | null;

  /** The color the local player controls in AI mode. */
  playerColor: StoneColor;

  /** AI search strength. */
  aiLevel: AILevel;

  /** Whether to play against AI or a local human opponent. */
  gameMode: BackgammonGameMode;
}

/** Actions for `BackgammonSettingsState`. */
interface BackgammonSettingsActions {
  /**
   * Switch to a named rules preset.
   * Does NOT reset the game; the caller must call `resetGame()` if needed.
   *
   * @param preset - Key from `RULE_PRESETS`.
   */
  setRulesPreset: (preset: keyof typeof RULE_PRESETS) => void;

  /**
   * Save fully-custom rules. Automatically switches `rulesPreset` to
   * `'custom'` so `getActiveRules()` returns these rules.
   *
   * @param rules - The fully-specified custom `BackgammonRules` object.
   */
  setCustomRules: (rules: BackgammonRules) => void;

  /**
   * Change the human player's color (white/black).
   *
   * @param color - The new player color.
   */
  setPlayerColor: (color: StoneColor) => void;

  /**
   * Change the AI difficulty level.
   *
   * @param level - New AI level (`'easy'` | `'medium'` | `'hard'`).
   */
  setAILevel: (level: AILevel) => void;

  /**
   * Switch between AI and local two-player modes.
   *
   * @param mode - New game mode.
   */
  setGameMode: (mode: BackgammonGameMode) => void;

  /**
   * Returns the `BackgammonRules` object that should be used for the next game.
   *
   * Logic:
   * - If `rulesPreset === 'custom'` and `customRules` is non-null, returns `customRules`.
   * - Otherwise returns `RULE_PRESETS[rulesPreset]`.
   *
   * @returns The active `BackgammonRules` configuration.
   */
  getActiveRules: () => BackgammonRules;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Persisted Backgammon settings store.
 *
 * Uses `zustand/persist` with the `'backgammon-settings'` localStorage key.
 * All fields are plain serializable values — no `Map`, `Set`, or class instances.
 *
 * @returns Combined settings state + actions store instance.
 *
 * @example
 * ```ts
 * // Read the active rule set for starting a new game
 * const rules = useBackgammonSettingsStore.getState().getActiveRules();
 * resetGame(rules);
 * ```
 */
export const useBackgammonSettingsStore = create<
  BackgammonSettingsState & BackgammonSettingsActions
>()(
  persist(
    (set, get) => ({
      // Defaults
      rulesPreset: 'classic',
      customRules: null,
      playerColor: 'w',
      aiLevel: 'medium',
      gameMode: 'ai',

      // Actions
      setRulesPreset(preset) {
        set({ rulesPreset: preset });
      },

      setCustomRules(rules) {
        set({ rulesPreset: 'custom', customRules: rules });
      },

      setPlayerColor(color) {
        set({ playerColor: color });
      },

      setAILevel(level) {
        set({ aiLevel: level });
      },

      setGameMode(mode) {
        set({ gameMode: mode });
      },

      getActiveRules() {
        const { rulesPreset, customRules } = get();
        if (rulesPreset === 'custom' && customRules !== null) {
          return customRules;
        }
        return RULE_PRESETS[rulesPreset];
      },
    }),
    {
      name: 'backgammon-settings',
    },
  ),
);
