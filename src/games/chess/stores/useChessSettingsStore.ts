import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel, PieceColor } from '../engine/types';
import { DEFAULT_AI_LEVEL } from '../config/aiLevels';
import { DEFAULT_CLOCK_PRESET } from '../config/clockPresets';

interface ChessSettingsState {
  /** Selected AI difficulty level */
  aiLevel: AILevel;
  /** Selected clock preset key */
  clockPreset: string;
  /** Board theme identifier */
  boardTheme: string;
  /** Piece set identifier */
  pieceSet: string;
  /** Environment theme identifier */
  environmentTheme: string;
  /** Color the human plays as — also determines the default camera side */
  playerColor: PieceColor;
  /** Whether board auto-rotates on turn change */
  autoRotate: boolean;
  /** Whether sound effects are enabled */
  soundEnabled: boolean;
}

interface ChessSettingsActions {
  setAILevel: (level: AILevel) => void;
  setClockPreset: (preset: string) => void;
  setBoardTheme: (theme: string) => void;
  setPieceSet: (set: string) => void;
  setEnvironmentTheme: (theme: string) => void;
  setPlayerColor: (color: PieceColor) => void;
  setAutoRotate: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
}

/** Persistent chess settings store */
export const useChessSettingsStore = create<ChessSettingsState & ChessSettingsActions>()(
  persist(
    (set) => ({
      aiLevel: DEFAULT_AI_LEVEL,
      clockPreset: DEFAULT_CLOCK_PRESET,
      boardTheme: 'wood',
      pieceSet: 'classic',
      environmentTheme: 'library',
      playerColor: 'w',
      autoRotate: false,
      soundEnabled: true,

      setAILevel: (level) => set({ aiLevel: level }),
      setClockPreset: (preset) => set({ clockPreset: preset }),
      setBoardTheme: (theme) => set({ boardTheme: theme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setEnvironmentTheme: (theme) => set({ environmentTheme: theme }),
      setPlayerColor: (color) => set({ playerColor: color }),
      setAutoRotate: (value) => set({ autoRotate: value }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
    }),
    { name: 'chess-settings' },
  ),
);
