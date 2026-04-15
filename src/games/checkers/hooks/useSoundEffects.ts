import { useEffect, useRef } from 'react';
import { useCheckersStore } from '../stores/useCheckersStore';
import { useCheckersSettingsStore } from '../stores/useCheckersSettingsStore';
import { CheckersSoundService } from '../audio/SoundService';
import type { GameStatus } from '../engine/types';

/**
 * Plays sound effects in response to checkers game events.
 *
 * Event mapping:
 * - New move with capture → "capture" sound
 * - New move (no capture) → "move" sound
 * - Chain continues → "chain" sound
 * - Piece crowned → "crown" sound
 * - Game ends → "gameOver" sound
 *
 * Mount once at the top of the checkers game.
 */
export function useSoundEffects() {
  const moveHistory = useCheckersStore((s) => s.moveHistory);
  const gameStatus = useCheckersStore((s) => s.gameStatus);
  const isChainActive = useCheckersStore((s) => s.isChainActive);
  const soundEnabled = useCheckersSettingsStore((s) => s.soundEnabled);

  const lastMoveCountRef = useRef(0);
  const lastStatusRef = useRef<GameStatus>(gameStatus);
  const wasChainRef = useRef(false);

  // Reset trackers when history clears (new game)
  useEffect(() => {
    if (moveHistory.length === 0) {
      lastMoveCountRef.current = 0;
      wasChainRef.current = false;
    }
  }, [moveHistory.length]);

  // Move / capture / chain / crown sounds
  useEffect(() => {
    if (!soundEnabled) {
      lastMoveCountRef.current = moveHistory.length;
      return;
    }
    if (moveHistory.length <= lastMoveCountRef.current) {
      lastMoveCountRef.current = moveHistory.length;
      return;
    }

    const lastMove = moveHistory[moveHistory.length - 1];
    if (lastMove) {
      if (lastMove.captured.length > 0) {
        CheckersSoundService.play('capture');
      } else {
        CheckersSoundService.play('move');
      }

      if (lastMove.crowned) {
        window.setTimeout(() => CheckersSoundService.play('crown'), 100);
      }
    }

    lastMoveCountRef.current = moveHistory.length;
  }, [moveHistory, soundEnabled]);

  // Chain-continue sound (fires on each chain step, not just at end)
  useEffect(() => {
    if (!soundEnabled) return;
    if (isChainActive && !wasChainRef.current) {
      // Chain just started — first capture sound already played above
    } else if (isChainActive && wasChainRef.current) {
      // Continuing chain — play chain sound for intermediate jumps
      CheckersSoundService.play('chain');
    }
    wasChainRef.current = isChainActive;
  }, [isChainActive, soundEnabled]);

  // Game over sound
  useEffect(() => {
    const wasFinished = lastStatusRef.current === 'won' || lastStatusRef.current === 'draw';
    const isFinished = gameStatus === 'won' || gameStatus === 'draw';
    if (!wasFinished && isFinished && soundEnabled) {
      CheckersSoundService.play('gameOver');
    }
    lastStatusRef.current = gameStatus;
  }, [gameStatus, soundEnabled]);
}
