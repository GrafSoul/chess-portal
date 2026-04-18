/**
 * React integration for the Go clock.
 *
 * Responsibilities:
 * 1. Construct a {@link GoClockManager} sized to the currently selected preset.
 * 2. Stream tick updates into {@link useGoStore} (`updateClockState`,
 *    `setClockRunning`) so UI components can subscribe via selectors.
 * 3. Start / stop the clock based on `gameStatus` and `turn`.
 * 4. Call {@link GoClockManager.switchTurn} after each accepted move.
 * 5. Resign on behalf of the side that flagged on time.
 *
 * Mounted once from {@link useGoGame}.
 */

import { useEffect, useRef } from 'react';
import { useGoStore } from '../stores/useGoStore';
import { useGoSettingsStore } from '../stores/useGoSettingsStore';
import { GoClockManager } from '../engine/GoClockManager';
import { GO_CLOCK_PRESETS } from '../config/clockPresets';
import type { Stone } from '../engine/types';

/**
 * Hook that owns the {@link GoClockManager} lifecycle and syncs it with the
 * Go store. Has no return value — subscribers read clock state directly from
 * `useGoStore` via `state.clockState` / `state.clockRunning`.
 */
export function useGoClock(): void {
  const clockRef = useRef<GoClockManager | null>(null);

  const clockPreset = useGoSettingsStore((s) => s.clockPreset);

  const turn = useGoStore((s) => s.turn);
  const gameStatus = useGoStore((s) => s.gameStatus);
  const moveHistory = useGoStore((s) => s.moveHistory);
  const updateClockState = useGoStore((s) => s.updateClockState);
  const setClockRunning = useGoStore((s) => s.setClockRunning);
  const resign = useGoStore((s) => s.resign);

  // (Re)build the clock whenever the user picks a different preset.
  useEffect(() => {
    const config = GO_CLOCK_PRESETS[clockPreset] ?? GO_CLOCK_PRESETS.unlimited;
    const clock = new GoClockManager(config);

    clock.setOnTick((state) => {
      updateClockState(clock.isEnabled ? state : null);
    });
    clock.setOnTimeout((loser: Stone) => {
      // The side that ran out loses — resign on their behalf so the game
      // transitions cleanly into `ended` with the opposite color as winner.
      setClockRunning(false);
      resign(loser);
    });

    clockRef.current = clock;
    // Prime the store with the fresh snapshot (so UI updates immediately).
    updateClockState(clock.isEnabled ? clock.state : null);

    return () => {
      clock.destroy();
      clockRef.current = null;
    };
  }, [clockPreset, updateClockState, setClockRunning, resign]);

  // Start / stop the clock according to game status.
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock) return;
    if (!clock.isEnabled) return;

    const isActive = gameStatus === 'playing';
    const isTerminal = gameStatus === 'ended' || gameStatus === 'scoring';

    // We intentionally wait for the first move before starting the clock
    // (consistent with chess/checkers — the player "presses the clock" by moving).
    if (isActive && moveHistory.length > 0 && clock.activeSide === null) {
      clock.start(turn);
      setClockRunning(true);
    } else if (isTerminal) {
      clock.stop();
      setClockRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, moveHistory.length]);

  // Flip the active side's clock after every accepted move.
  useEffect(() => {
    const clock = clockRef.current;
    if (!clock || !clock.isEnabled) return;
    if (moveHistory.length < 2) return; // first move just started the clock
    if (gameStatus !== 'playing') return;
    clock.switchTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveHistory.length]);
}
