import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel, PieceColor } from '../engine/types';
import { DEFAULT_AI_LEVEL } from '../config/aiLevels';
import { DEFAULT_CLOCK_PRESET } from '../config/clockPresets';
import { DARK_SQUARE_DEFAULT_LIGHTNESS } from '../../../core/utils/grayscale';

interface CheckersSettingsState {
  /** Selected AI difficulty level */
  aiLevel: AILevel;
  /** Selected clock preset key */
  clockPreset: string;
  /** Color the human plays as — also determines the default camera side */
  playerColor: PieceColor;
  /** Whether board auto-rotates on turn change */
  autoRotate: boolean;
  /** Whether sound effects are enabled */
  soundEnabled: boolean;
  /** Grayscale lightness (0–50) for dark squares — 0 = pure black, 50 = medium gray */
  darkSquareLightness: number;
}

interface CheckersSettingsActions {
  setAILevel: (level: AILevel) => void;
  setClockPreset: (preset: string) => void;
  setPlayerColor: (color: PieceColor) => void;
  setAutoRotate: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setDarkSquareLightness: (value: number) => void;
}

/** Persistent checkers settings store */
export const useCheckersSettingsStore = create<
  CheckersSettingsState & CheckersSettingsActions
>()(
  persist(
    (set) => ({
      aiLevel: DEFAULT_AI_LEVEL,
      clockPreset: DEFAULT_CLOCK_PRESET,
      playerColor: 'w',
      autoRotate: false,
      soundEnabled: true,
      darkSquareLightness: DARK_SQUARE_DEFAULT_LIGHTNESS,

      setAILevel: (level) => set({ aiLevel: level }),
      setClockPreset: (preset) => set({ clockPreset: preset }),
      setPlayerColor: (color) => set({ playerColor: color }),
      setAutoRotate: (value) => set({ autoRotate: value }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setDarkSquareLightness: (value) => set({ darkSquareLightness: value }),
    }),
    { name: 'checkers-settings' },
  ),
);
