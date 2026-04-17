import { useEffect, useRef } from 'react';
import { useGoStore } from '../stores/useGoStore';
import { GoSoundService } from '../audio/SoundService';
import type { GameStatus } from '../engine/types';

/**
 * Play Go sound effects in response to game events.
 *
 * Event → sound mapping:
 * - Successful play → `place`
 * - Capture occurred → `capture` (overrides `place` for that move)
 * - Pass accepted → `pass`
 * - Move rejected (ko / suicide / occupied) → `reject`
 * - Game transitions to `ended` → `gameOver`
 *
 * Mount once near the root of the Go page.
 */
export function useGoSoundEffects() {
  const successTick = useGoStore((s) => s.lastSuccessTick);
  const captureTick = useGoStore((s) => s.lastCaptureTick);
  const passTick = useGoStore((s) => s.lastPassTick);
  const rejectTick = useGoStore((s) => s.lastRejectTick);
  const gameStatus = useGoStore((s) => s.gameStatus);

  const prevSuccessRef = useRef(successTick);
  const prevCaptureRef = useRef(captureTick);
  const prevPassRef = useRef(passTick);
  const prevRejectRef = useRef(rejectTick);
  const prevStatusRef = useRef<GameStatus>(gameStatus);

  // Play / capture — capture takes precedence over a plain place for the same tick.
  useEffect(() => {
    const successAdvanced = successTick > prevSuccessRef.current;
    const captureAdvanced = captureTick > prevCaptureRef.current;
    if (successAdvanced) {
      GoSoundService.play(captureAdvanced ? 'capture' : 'place');
    }
    prevSuccessRef.current = successTick;
    prevCaptureRef.current = captureTick;
  }, [successTick, captureTick]);

  // Pass
  useEffect(() => {
    if (passTick > prevPassRef.current) {
      GoSoundService.play('pass');
    }
    prevPassRef.current = passTick;
  }, [passTick]);

  // Rejection
  useEffect(() => {
    if (rejectTick > prevRejectRef.current) {
      GoSoundService.play('reject');
    }
    prevRejectRef.current = rejectTick;
  }, [rejectTick]);

  // Game over
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;
    if (prev !== 'ended' && gameStatus === 'ended') {
      GoSoundService.play('gameOver');
    }
  }, [gameStatus]);
}
