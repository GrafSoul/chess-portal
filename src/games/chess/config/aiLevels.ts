import type { AILevel, AILevelConfig } from '../engine/types';

/** Stockfish configuration per difficulty level */
export const AI_LEVELS: Record<AILevel, AILevelConfig> = {
  easy: { label: 'Beginner', depth: 2, skillLevel: 3, moveTimeMs: 500 },
  medium: { label: 'Amateur', depth: 8, skillLevel: 10, moveTimeMs: 1_000 },
  hard: { label: 'Master', depth: 14, skillLevel: 17, moveTimeMs: 2_000 },
  expert: { label: 'Grandmaster', depth: 20, skillLevel: 20, moveTimeMs: 3_000 },
} as const;

/** Default AI level */
export const DEFAULT_AI_LEVEL: AILevel = 'medium';
