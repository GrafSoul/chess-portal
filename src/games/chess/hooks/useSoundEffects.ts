import { useEffect, useRef } from 'react';
import { useChessStore } from '../stores/useChessStore';
import { useChessSettingsStore } from '../stores/useChessSettingsStore';
import { SoundService } from '../audio/SoundService';

/**
 * Plays sound effects in response to chess game events.
 *
 * Listens to move history and game status changes from the store and plays
 * an appropriate synthesized tone via SoundService. Sounds are gated on the
 * `soundEnabled` setting from {@link useChessSettingsStore}.
 *
 * Event mapping:
 * - New move with capture → "capture" sound
 * - New move (no capture) → "move" sound
 * - Resulting check → additional "check" sound
 * - Game ends (checkmate/stalemate/draw/timeout/resigned) → "gameOver" sound
 *
 * Mount once at the top of the chess game (alongside useChessGame).
 */
export function useSoundEffects() {
  const moveHistory = useChessStore((s) => s.moveHistory);
  const gameStatus = useChessStore((s) => s.gameStatus);
  const isCheck = useChessStore((s) => s.isCheck);
  const soundEnabled = useChessSettingsStore((s) => s.soundEnabled);

  // Track last seen move count to detect *new* moves only
  const lastMoveCountRef = useRef(0);
  const lastStatusRef = useRef(gameStatus);

  // Reset trackers when history clears (new game)
  useEffect(() => {
    if (moveHistory.length === 0) {
      lastMoveCountRef.current = 0;
    }
  }, [moveHistory.length]);

  // Move / capture / check sounds
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
      SoundService.play(lastMove.captured ? 'capture' : 'move');
      if (isCheck) {
        // Slight delay so check tone is distinguishable from move tone
        window.setTimeout(() => SoundService.play('check'), 90);
      }
    }
    lastMoveCountRef.current = moveHistory.length;
  }, [moveHistory, isCheck, soundEnabled]);

  // Game over sound
  useEffect(() => {
    const finished = ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout'];
    const wasFinished = finished.includes(lastStatusRef.current);
    const isFinished = finished.includes(gameStatus);
    if (!wasFinished && isFinished && soundEnabled) {
      SoundService.play('gameOver');
    }
    lastStatusRef.current = gameStatus;
  }, [gameStatus, soundEnabled]);
}
