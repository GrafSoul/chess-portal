import { create } from 'zustand';
import { ChessEngine } from '../engine/ChessEngine';
import type {
  Square,
  ChessMove,
  CapturedPiece,
  GameStatus,
  GameMode,
  PieceColor,
  PromotionPiece,
} from '../engine/types';

interface ChessState {
  /** Current FEN position */
  fen: string;
  /** Whose turn */
  turn: PieceColor;
  /** Currently selected square */
  selectedSquare: Square | null;
  /** Legal target squares for selected piece */
  legalMoves: Square[];
  /** Full move history */
  moveHistory: ChessMove[];
  /** Current game status */
  gameStatus: GameStatus;
  /** Winner color or null */
  winner: PieceColor | null;
  /** Whether current side is in check */
  isCheck: boolean;
  /** Captured pieces list */
  capturedPieces: CapturedPiece[];
  /** AI thinking flag */
  isAIThinking: boolean;
  /** Game mode */
  gameMode: GameMode;
  /** Pending promotion move (from/to stored while waiting for piece choice) */
  pendingPromotion: { from: Square; to: Square } | null;

  /** Clock times */
  whiteTimeMs: number;
  blackTimeMs: number;
  clockRunning: boolean;

  /** Last move (for highlighting) */
  lastMove: { from: Square; to: Square } | null;
}

interface ChessActions {
  /** Select a square — either pick a piece or attempt a move */
  selectSquare: (square: Square) => void;
  /** Execute a move */
  makeMove: (from: Square, to: Square, promotion?: PromotionPiece) => boolean;
  /** Complete a pending promotion */
  completePromotion: (piece: PromotionPiece) => void;
  /** Cancel a pending promotion */
  cancelPromotion: () => void;
  /** Undo last move */
  undoMove: () => void;
  /** Reset game */
  resetGame: () => void;
  /** Set game mode */
  setGameMode: (mode: GameMode) => void;
  /** Update clock times (called from ClockManager tick) */
  updateClock: (whiteMs: number, blackMs: number) => void;
  /** Set clock running state */
  setClockRunning: (running: boolean) => void;
  /** Set AI thinking state */
  setAIThinking: (thinking: boolean) => void;
  /** Set game status (for resign/timeout) */
  setGameStatus: (status: GameStatus, winner?: PieceColor | null) => void;
  /** Get the engine instance (for external use like AI) */
  getEngine: () => ChessEngine;
}

const engine = new ChessEngine();

const INITIAL_STATE: ChessState = {
  fen: engine.fen,
  turn: 'w',
  selectedSquare: null,
  legalMoves: [],
  moveHistory: [],
  gameStatus: 'idle',
  winner: null,
  isCheck: false,
  capturedPieces: [],
  isAIThinking: false,
  gameMode: 'ai',
  pendingPromotion: null,
  whiteTimeMs: 600_000,
  blackTimeMs: 600_000,
  clockRunning: false,
  lastMove: null,
};

/** Central chess game store */
export const useChessStore = create<ChessState & ChessActions>((set, get) => ({
  ...INITIAL_STATE,

  selectSquare(square: Square) {
    const state = get();

    // Game must be active
    if (state.gameStatus !== 'idle' && state.gameStatus !== 'playing') return;
    // Don't allow moves while AI is thinking
    if (state.isAIThinking) return;
    // Don't allow moves during pending promotion
    if (state.pendingPromotion) return;

    const piece = engine.getPiece(square);

    // If a piece is already selected, try to move to the clicked square
    if (state.selectedSquare) {
      // Clicking the same square — deselect
      if (square === state.selectedSquare) {
        set({ selectedSquare: null, legalMoves: [] });
        return;
      }

      // If clicking a legal move target — attempt the move
      if (state.legalMoves.includes(square)) {
        // Check if this is a promotion
        if (engine.isPromotion(state.selectedSquare, square)) {
          set({ pendingPromotion: { from: state.selectedSquare, to: square } });
          return;
        }

        get().makeMove(state.selectedSquare, square);
        return;
      }

      // If clicking own piece — reselect
      if (piece && piece.color === state.turn) {
        const moves = engine.getLegalMoves(square);
        set({ selectedSquare: square, legalMoves: moves });
        return;
      }

      // Otherwise deselect
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    // No piece selected — select own piece
    if (piece && piece.color === state.turn) {
      const moves = engine.getLegalMoves(square);
      set({ selectedSquare: square, legalMoves: moves });
    }
  },

  makeMove(from: Square, to: Square, promotion?: PromotionPiece): boolean {
    const result = engine.makeMove(from, to, promotion);
    if (!result.success || !result.move) return false;

    const state = get();
    const capturedPieces = [...state.capturedPieces];

    if (result.captured) {
      capturedPieces.push({
        type: result.captured.type,
        color: result.captured.color,
        index: capturedPieces.length,
      });
    }

    const status = engine.getStatus();
    const winner = engine.getWinner();

    set({
      fen: engine.fen,
      turn: engine.turn,
      selectedSquare: null,
      legalMoves: [],
      moveHistory: engine.moveHistory,
      gameStatus: status === 'idle' ? 'playing' : status,
      winner,
      isCheck: engine.isCheck,
      capturedPieces,
      lastMove: { from, to },
      pendingPromotion: null,
    });

    return true;
  },

  completePromotion(piece: PromotionPiece) {
    const state = get();
    if (!state.pendingPromotion) return;
    const { from, to } = state.pendingPromotion;
    get().makeMove(from, to, piece);
  },

  cancelPromotion() {
    set({ pendingPromotion: null, selectedSquare: null, legalMoves: [] });
  },

  undoMove() {
    const state = get();
    if (state.moveHistory.length === 0) return;

    const undone = engine.undoMove();
    if (!undone) return;

    // Remove last captured piece if the undone move was a capture
    const capturedPieces = [...state.capturedPieces];
    if (undone.captured) {
      capturedPieces.pop();
    }

    // In AI mode undo two moves (player + AI)
    if (state.gameMode === 'ai' && engine.moveHistory.length > 0) {
      const secondUndone = engine.undoMove();
      if (secondUndone?.captured) {
        capturedPieces.pop();
      }
    }

    const history = engine.moveHistory;
    const lastMove = history.length > 0
      ? { from: history[history.length - 1].from, to: history[history.length - 1].to }
      : null;

    set({
      fen: engine.fen,
      turn: engine.turn,
      selectedSquare: null,
      legalMoves: [],
      moveHistory: engine.moveHistory,
      gameStatus: engine.moveHistory.length === 0 ? 'idle' : 'playing',
      winner: null,
      isCheck: engine.isCheck,
      capturedPieces,
      lastMove,
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
}));
