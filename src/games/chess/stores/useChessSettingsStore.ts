import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AILevel, GameMode, PieceColor } from '../engine/types';
import { DEFAULT_AI_LEVEL } from '../config/aiLevels';
import { DEFAULT_CLOCK_PRESET } from '../config/clockPresets';
import { DARK_SQUARE_DEFAULT_LIGHTNESS } from '../../../core/utils/grayscale';

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
  /** Grayscale lightness (0–50) for dark squares — 0 = pure black, 50 = medium gray */
  darkSquareLightness: number;
  /** Current game mode — persisted so it survives page reloads. */
  gameMode: GameMode;
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
  setDarkSquareLightness: (value: number) => void;
  /** Switch between AI and local 2-player mode (persisted). */
  setGameMode: (mode: GameMode) => void;
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
      darkSquareLightness: DARK_SQUARE_DEFAULT_LIGHTNESS,
      gameMode: 'ai',

      setAILevel: (level) => set({ aiLevel: level }),
      setClockPreset: (preset) => set({ clockPreset: preset }),
      setBoardTheme: (theme) => set({ boardTheme: theme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setEnvironmentTheme: (theme) => set({ environmentTheme: theme }),
      setPlayerColor: (color) => set({ playerColor: color }),
      setAutoRotate: (value) => set({ autoRotate: value }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setDarkSquareLightness: (value) => set({ darkSquareLightness: value }),
      setGameMode: (mode) => set({ gameMode: mode }),
    }),
    { name: 'chess-settings' },
  ),
);
