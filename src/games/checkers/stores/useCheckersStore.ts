import { create } from 'zustand';
import { CheckersEngine } from '../engine/CheckersEngine';
import { getPieceAt } from '../utils/fenUtils';
import type {
  Square,
  CheckersMove,
  GameStatus,
  GameMode,
  PieceColor,
  PieceType,
} from '../engine/types';

/** Delay before captured pieces fade out (matches piece flight duration) */
const CAPTURE_FADE_DELAY_MS = 1200;

/** Counter for unique fading-piece IDs */
let fadingPieceCounter = 0;

/**
 * A piece that has been captured but is still being rendered visually
 * while the capturing piece completes its arc animation. Not part of the FEN
 * — rendered as a separate static layer in the 3D scene.
 */
export interface FadingPiece {
  /** Unique id for React keying */
  id: string;
  /** Square where the captured piece sits */
  square: Square;
  /** Color of the captured piece */
  color: PieceColor;
  /** Type of the captured piece */
  type: PieceType;
}

/** A captured piece record (for the captured-pieces display) */
export interface CapturedCheckerPiece {
  color: PieceColor;
  wasKing: boolean;
  index: number;
}

interface CheckersState {
  /** Current board FEN */
  fen: string;
  /** Whose turn */
  turn: PieceColor;
  /** Currently selected square */
  selectedSquare: Square | null;
  /** Legal target squares for the selected piece */
  legalMoves: Square[];
  /** Full move history (one entry per complete turn) */
  moveHistory: CheckersMove[];
  /** Current game lifecycle status */
  gameStatus: GameStatus;
  /** Winner color or null */
  winner: PieceColor | null;
  /** Captured pieces list */
  capturedPieces: CapturedCheckerPiece[];
  /** Whether AI is computing a move */
  isAIThinking: boolean;
  /** Game mode */
  gameMode: GameMode;
  /** Clock times */
  whiteTimeMs: number;
  blackTimeMs: number;
  clockRunning: boolean;
  /** Last completed move (for board highlighting) */
  lastMove: { from: Square; to: Square } | null;
  /** Whether a multi-jump chain is in progress */
  isChainActive: boolean;
  /** Square of the piece mid-chain (only valid during a chain) */
  chainPiece: Square | null;
  /** Pieces that were captured but are still rendered visually during the jump animation */
  fadingPieces: FadingPiece[];
}

interface CheckersActions {
  /** Select a square — pick a piece or attempt a move */
  selectSquare: (square: Square) => void;
  /** Execute a move (used internally and by AI) */
  makeMove: (from: Square, to: Square) => boolean;
  /** Undo last complete turn (in AI mode undoes AI + player) */
  undoMove: () => void;
  /** Reset to starting position */
  resetGame: () => void;
  /** Set game mode */
  setGameMode: (mode: GameMode) => void;
  /** Update clock times (called from ClockManager tick) */
  updateClock: (whiteMs: number, blackMs: number) => void;
  /** Set clock running state */
  setClockRunning: (running: boolean) => void;
  /** Set AI thinking flag */
  setAIThinking: (thinking: boolean) => void;
  /** Set game status (for resign / timeout) */
  setGameStatus: (status: GameStatus, winner?: PieceColor | null) => void;
  /** Get the engine instance (for external use like AI) */
  getEngine: () => CheckersEngine;
  /** Remove fading pieces by id (called by scheduled timeout after capture) */
  removeFadingPieces: (ids: string[]) => void;
}

const engine = new CheckersEngine();

const INITIAL_STATE: CheckersState = {
  fen: engine.fen,
  turn: 'w',
  selectedSquare: null,
  legalMoves: [],
  moveHistory: [],
  gameStatus: 'idle',
  winner: null,
  capturedPieces: [],
  isAIThinking: false,
  gameMode: 'ai',
  whiteTimeMs: 600_000,
  blackTimeMs: 600_000,
  clockRunning: false,
  lastMove: null,
  isChainActive: false,
  chainPiece: null,
  fadingPieces: [],
};

/**
 * Sync observable state from the engine into the store.
 * Called after every successful move or chain step.
 */
function syncFromEngine(
  _get: () => CheckersState & CheckersActions,
  capturedPieces: CapturedCheckerPiece[],
  lastMove: { from: Square; to: Square } | null,
): Partial<CheckersState> {
  const status = engine.status;
  return {
    fen: engine.fen,
    turn: engine.turn,
    moveHistory: [...engine.moveHistory],
    gameStatus: status === 'idle' ? 'playing' : status,
    winner: engine.winner,
    capturedPieces,
    lastMove,
    isChainActive: engine.isChainActive,
    chainPiece: engine.chainPiece,
  };
}

/** Central checkers game store */
export const useCheckersStore = create<CheckersState & CheckersActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    selectSquare(square: Square) {
      const state = get();

      // Game must be active
      if (state.gameStatus !== 'idle' && state.gameStatus !== 'playing') return;
      // Block during AI thinking
      if (state.isAIThinking) return;

      // -- During a chain: only the chain piece can continue --
      if (state.isChainActive) {
        if (square === state.chainPiece) {
          // Re-clicking the chain piece — show its legal moves
          const moves = engine.getLegalMoves(square);
          set({ selectedSquare: square, legalMoves: moves });
          return;
        }
        // Clicking a destination during chain
        if (state.selectedSquare && state.legalMoves.includes(square)) {
          get().makeMove(state.selectedSquare, square);
          return;
        }
        // Ignore any other click during chain
        return;
      }

      // -- Normal turn (no chain) --
      const movablePieces = engine.getMovablePieces();

      // If a piece is already selected
      if (state.selectedSquare) {
        // Same square → deselect
        if (square === state.selectedSquare) {
          set({ selectedSquare: null, legalMoves: [] });
          return;
        }
        // Legal destination → move
        if (state.legalMoves.includes(square)) {
          get().makeMove(state.selectedSquare, square);
          return;
        }
        // Own movable piece → reselect
        if (movablePieces.includes(square)) {
          const moves = engine.getLegalMoves(square);
          set({ selectedSquare: square, legalMoves: moves });
          return;
        }
        // Otherwise deselect
        set({ selectedSquare: null, legalMoves: [] });
        return;
      }

      // No piece selected → select a movable piece
      if (movablePieces.includes(square)) {
        const moves = engine.getLegalMoves(square);
        set({ selectedSquare: square, legalMoves: moves });
      }
    },

    makeMove(from: Square, to: Square): boolean {
      // Snapshot piece info at captured squares BEFORE calling engine.makeMove,
      // so we can render them as "fading" ghosts during the jump animation.
      const oldFen = engine.fen;

      const result = engine.makeMove(from, to);
      if (!result.success) return false;

      const state = get();
      const capturedPieces = [...state.capturedPieces];

      // Append any captured pieces from this step
      result.captured.forEach(() => {
        capturedPieces.push({
          color: state.turn === 'w' ? 'b' : 'w',
          wasKing: false,
          index: capturedPieces.length,
        });
      });

      // Build fading pieces from pre-move FEN (piece info still there)
      const newFadingPieces: FadingPiece[] = result.captured
        .map((sq) => {
          const info = getPieceAt(oldFen, sq);
          if (!info) return null;
          return {
            id: `fading-${++fadingPieceCounter}`,
            square: sq,
            color: info.color,
            type: info.type,
          } as FadingPiece;
        })
        .filter((p): p is FadingPiece => p !== null);

      if (result.chainContinues) {
        // Chain in progress — keep the same turn, auto-select the chain piece
        const chainSq = engine.chainPiece!;
        const chainMoves = engine.getLegalMoves(chainSq);
        set({
          ...syncFromEngine(get, capturedPieces, { from, to }),
          selectedSquare: chainSq,
          legalMoves: chainMoves,
          fadingPieces:
            newFadingPieces.length > 0
              ? [...state.fadingPieces, ...newFadingPieces]
              : state.fadingPieces,
        });
      } else {
        // Turn completed — clear selection, switch turn
        set({
          ...syncFromEngine(get, capturedPieces, { from, to }),
          selectedSquare: null,
          legalMoves: [],
          fadingPieces:
            newFadingPieces.length > 0
              ? [...state.fadingPieces, ...newFadingPieces]
              : state.fadingPieces,
        });
      }

      // Schedule fade-out removal after piece lands (independent of future moves)
      if (newFadingPieces.length > 0) {
        const idsToRemove = newFadingPieces.map((p) => p.id);
        setTimeout(() => {
          get().removeFadingPieces(idsToRemove);
        }, CAPTURE_FADE_DELAY_MS);
      }

      return true;
    },

    removeFadingPieces(ids: string[]) {
      const idSet = new Set(ids);
      set((s) => ({
        fadingPieces: s.fadingPieces.filter((p) => !idSet.has(p.id)),
      }));
    },

    undoMove() {
      const state = get();
      if (state.moveHistory.length === 0) return;
      if (state.isChainActive) return; // can't undo mid-chain

      const undone = engine.undoMove();
      if (!undone) return;

      // Remove captured pieces from the display
      const capturedPieces = [...state.capturedPieces];
      for (let i = 0; i < undone.captured.length; i++) {
        capturedPieces.pop();
      }

      // In AI mode, undo two turns (player + AI)
      if (state.gameMode === 'ai' && engine.moveHistory.length > 0) {
        const secondUndone = engine.undoMove();
        if (secondUndone) {
          for (let i = 0; i < secondUndone.captured.length; i++) {
            capturedPieces.pop();
          }
        }
      }

      const history = engine.moveHistory;
      const lastMove =
        history.length > 0
          ? { from: history[history.length - 1].from, to: history[history.length - 1].to }
          : null;

      set({
        fen: engine.fen,
        turn: engine.turn,
        selectedSquare: null,
        legalMoves: [],
        moveHistory: [...engine.moveHistory],
        gameStatus: engine.moveHistory.length === 0 ? 'idle' : 'playing',
        winner: null,
        capturedPieces,
        lastMove,
        isChainActive: false,
        chainPiece: null,
        fadingPieces: [],
      });
    },

    resetGame() {
      engine.reset();
      set({
        ...INITIAL_STATE,
        gameMode: get().gameMode,
      });
    },

    setGameMode(mode: GameMode) {
      set({ gameMode: mode });
    },

    updateClock(whiteMs: number, blackMs: number) {
      set({ whiteTimeMs: whiteMs, blackTimeMs: blackMs });
    },

    setClockRunning(running: boolean) {
      set({ clockRunning: running });
    },

    setAIThinking(thinking: boolean) {
      set({ isAIThinking: thinking });
    },

    setGameStatus(status: GameStatus, winner: PieceColor | null = null) {
      set({ gameStatus: status, winner });
    },

    getEngine() {
      return engine;
    },
  }),
);
