import { useEffect, useRef } from 'react';
import { useCheckersStore } from '../stores/useCheckersStore';
import { useCheckersSettingsStore } from '../stores/useCheckersSettingsStore';
import { CheckersAIService } from '../ai/CheckersAIService';
import { AI_LEVELS } from '../config/aiLevels';

/**
 * Wires the minimax AI into the checkers game.
 *
 * - Initializes a Web Worker on mount, terminates on unmount.
 * - When game mode is 'ai' and it's the AI's turn (and no chain is active
 *   for the human), requests a move and plays it.
 * - Respects difficulty level changes.
 *
 * Should be mounted once (used inside useCheckersGame).
 */
export function useCheckersAI() {
  const serviceRef = useRef<CheckersAIService | null>(null);

  const fen = useCheckersStore((s) => s.fen);
  const turn = useCheckersStore((s) => s.turn);
  const gameMode = useCheckersStore((s) => s.gameMode);
  const gameStatus = useCheckersStore((s) => s.gameStatus);
  const isChainActive = useCheckersStore((s) => s.isChainActive);
  const setAIThinking = useCheckersStore((s) => s.setAIThinking);
  const selectSquare = useCheckersStore((s) => s.selectSquare);
  const makeMove = useCheckersStore((s) => s.makeMove);
  const getEngine = useCheckersStore((s) => s.getEngine);

  const aiLevel = useCheckersSettingsStore((s) => s.aiLevel);
  const playerColor = useCheckersSettingsStore((s) => s.playerColor);
  const aiColor = playerColor === 'w' ? 'b' : 'w';

  // Initialize worker
  useEffect(() => {
    const service = new CheckersAIService();
    service.init();
    service.setLevel(AI_LEVELS[aiLevel]);
    serviceRef.current = service;

    return () => {
      service.dispose();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update difficulty when changed
  useEffect(() => {
    serviceRef.current?.setLevel(AI_LEVELS[aiLevel]);
  }, [aiLevel]);

  // Trigger AI move
  useEffect(() => {
    const service = serviceRef.current;
    if (!service) return;
    if (gameMode !== 'ai') return;
    if (turn !== aiColor) return;
    if (gameStatus !== 'idle' && gameStatus !== 'playing') return;

    // If a chain is active, the AI needs to continue the chain
    // by selecting and moving the chain piece
    const engine = getEngine();

    let cancelled = false;
    setAIThinking(true);

    if (engine.isChainActive) {
      // Chain in progress — AI must continue capturing with the chain piece
      const chainSq = engine.chainPiece;
      if (chainSq) {
        const legalMoves = engine.getLegalMoves(chainSq);
        if (legalMoves.length > 0) {
          // Small delay for chain continuations
          const timer = window.setTimeout(() => {
            if (cancelled) return;
            makeMove(chainSq, legalMoves[0]);
            setAIThinking(false);
          }, 150);
          return () => { cancelled = true; window.clearTimeout(timer); setAIThinking(false); };
        }
      }
      setAIThinking(false);
      return;
    }

    // Normal turn — use the worker for full search
    const POST_MOVE_DELAY = 400;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      service
        .getBestMove(fen)
        .then((move) => {
          if (cancelled) return;
          // Select the piece first, then make the move
          selectSquare(move.from);
          // Small delay between select and move for visual feedback
          window.setTimeout(() => {
            if (cancelled) return;
            makeMove(move.from, move.to);
            setAIThinking(false);
          }, 100);
        })
        .catch((err: Error) => {
          if (err.message === 'Search aborted' || err.message === 'Search stopped') return;
          console.error('Checkers AI error:', err);
          setAIThinking(false);
        });
    }, POST_MOVE_DELAY);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      service.stop();
      setAIThinking(false);
    };
  }, [fen, turn, gameMode, gameStatus, isChainActive, aiColor, setAIThinking, selectSquare, makeMove, getEngine]);
}
