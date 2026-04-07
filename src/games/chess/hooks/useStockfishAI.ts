import { useEffect, useRef } from 'react';
import { useChessStore } from '../stores/useChessStore';
import { useChessSettingsStore } from '../stores/useChessSettingsStore';
import { useCameraRotationStore } from '../stores/useCameraRotationStore';
import { StockfishService } from '../ai/StockfishService';
import { AI_LEVELS } from '../config/aiLevels';

/**
 * Wires Stockfish into the chess game.
 *
 * Behavior:
 * - Initializes a Stockfish service on mount, terminates on unmount.
 * - When game mode is `ai` and it's the AI's turn, asks Stockfish for a move
 *   and plays it after a small delay so the player's animation finishes.
 * - Reapplies skill level whenever the user changes difficulty.
 * - Sends `ucinewgame` whenever the move history clears (new game).
 *
 * Should be mounted once at the top of the chess page (used by useChessGame).
 */
export function useStockfishAI() {
  const serviceRef = useRef<StockfishService | null>(null);
  const initializedRef = useRef(false);

  const fen = useChessStore((s) => s.fen);
  const turn = useChessStore((s) => s.turn);
  const gameMode = useChessStore((s) => s.gameMode);
  const gameStatus = useChessStore((s) => s.gameStatus);
  const moveHistoryLength = useChessStore((s) => s.moveHistory.length);
  const pendingPromotion = useChessStore((s) => s.pendingPromotion);
  const setAIThinking = useChessStore((s) => s.setAIThinking);
  const makeMove = useChessStore((s) => s.makeMove);

  const aiLevel = useChessSettingsStore((s) => s.aiLevel);
  const playerColor = useChessSettingsStore((s) => s.playerColor);
  const aiColor = playerColor === 'w' ? 'b' : 'w';

  // Initialize Stockfish once
  useEffect(() => {
    const service = new StockfishService();
    serviceRef.current = service;

    service
      .init()
      .then(() => {
        service.setLevel(AI_LEVELS[aiLevel]);
        initializedRef.current = true;
      })
      .catch((err: Error) => {
        console.error('Failed to initialize Stockfish:', err);
      });

    return () => {
      service.dispose();
      serviceRef.current = null;
      initializedRef.current = false;
    };
    // aiLevel intentionally excluded — handled in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply skill level when user changes difficulty
  useEffect(() => {
    const service = serviceRef.current;
    if (!service || !initializedRef.current) return;
    service.setLevel(AI_LEVELS[aiLevel]);
  }, [aiLevel]);

  // Reset engine state on new game
  useEffect(() => {
    const service = serviceRef.current;
    if (!service || !initializedRef.current) return;
    if (moveHistoryLength === 0) {
      service.newGame();
    }
  }, [moveHistoryLength]);

  // Trigger AI move when it's AI's turn.
  // NOTE: `isAIThinking` is intentionally NOT in deps — including it would cause
  // an infinite render loop because the effect itself toggles it.
  useEffect(() => {
    const service = serviceRef.current;
    if (!service || !initializedRef.current) return;
    if (gameMode !== 'ai') return;
    if (turn !== aiColor) return;
    if (gameStatus !== 'idle' && gameStatus !== 'playing') return;
    if (pendingPromotion) return;

    let cancelled = false;
    let pauseTimer: number | null = null;
    let initialDeferTimer: number | null = null;
    let unsubscribeRotation: (() => void) | null = null;
    setAIThinking(true);

    /** Pause (ms) AFTER camera rotation finishes, before AI plays its move. */
    const POST_ROTATION_PAUSE_MS = 300;

    /** Compute and play the AI move. */
    const playMove = () => {
      if (cancelled) return;
      service
        .getBestMove(fen)
        .then((move) => {
          if (cancelled) return;
          makeMove(move.from, move.to, move.promotion);
        })
        .catch((err: Error) => {
          if (err.message === 'Search aborted' || err.message === 'Search stopped') {
            // Expected when canceling — swallow
            return;
          }
          console.error('Stockfish error:', err);
        })
        .finally(() => {
          if (!cancelled) setAIThinking(false);
        });
    };

    /** Wait one extra pause then play. */
    const scheduleMoveAfterPause = () => {
      pauseTimer = window.setTimeout(() => {
        pauseTimer = null;
        playMove();
      }, POST_ROTATION_PAUSE_MS);
    };

    // CameraRig lives in a separate React root (the R3F Canvas), so its effects
    // may commit AFTER ours. Defer the rotation check by one frame so the rig
    // has a chance to flip `isRotating` to true if a forced rotation is queued.
    initialDeferTimer = window.setTimeout(() => {
      initialDeferTimer = null;
      if (cancelled) return;

      if (useCameraRotationStore.getState().isRotating) {
        unsubscribeRotation = useCameraRotationStore.subscribe((state) => {
          if (!state.isRotating && !cancelled) {
            unsubscribeRotation?.();
            unsubscribeRotation = null;
            scheduleMoveAfterPause();
          }
        });
      } else {
        scheduleMoveAfterPause();
      }
    }, 32);

    return () => {
      cancelled = true;
      if (initialDeferTimer !== null) window.clearTimeout(initialDeferTimer);
      if (pauseTimer !== null) window.clearTimeout(pauseTimer);
      unsubscribeRotation?.();
      service.stop();
      setAIThinking(false);
    };
  }, [fen, turn, gameMode, gameStatus, pendingPromotion, aiColor, setAIThinking, makeMove]);
}
