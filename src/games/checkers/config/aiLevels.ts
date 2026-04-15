import type { AILevel } from '../engine/types';

/** Minimax configuration per difficulty level */
export interface CheckersAIConfig {
  /** Human-readable label */
  label: string;
  /** Minimax search depth */
  depth: number;
  /** Artificial delay before playing (ms) — makes easy AI feel less instant */
  delayMs: number;
}

/** AI difficulty configurations for checkers */
export const AI_LEVELS: Record<AILevel, CheckersAIConfig> = {
  easy: { label: 'Beginner', depth: 2, delayMs: 300 },
  medium: { label: 'Amateur', depth: 4, delayMs: 200 },
  hard: { label: 'Master', depth: 6, delayMs: 100 },
  expert: { label: 'Grandmaster', depth: 8, delayMs: 0 },
} as const;

/** Default AI level */
export const DEFAULT_AI_LEVEL: AILevel = 'medium';
