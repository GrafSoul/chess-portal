/**
 * Web Worker for checkers AI.
 *
 * Receives: { type: 'search', fen: string, depth: number }
 * Responds: { type: 'bestmove', from: string, to: string } | { type: 'error', message: string }
 *
 * Contains a self-contained minimax engine — workers can't import from the
 * main bundle, so the engine logic is duplicated here in a minimal form
 * (board parsing, move generation, evaluation, search).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

type PieceColor = 'w' | 'b';
interface Cell { color: PieceColor; king: boolean }
type Board = (Cell | null)[][];

interface CaptureOption {
  lr: number; lc: number; cr: number; cc: number;
}

interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
  crowned: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DIAGS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

// ─── Board utilities ─────────────────────────────────────────────────────────

function inB(r: number, c: number): boolean { return r >= 0 && r <= 7 && c >= 0 && c <= 7; }

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(cell => cell ? { ...cell } : null));
}

function parseFen(fen: string): { board: Board; turn: PieceColor } {
  const [boardStr, turnStr] = fen.trim().split(/\s+/);
  const grid: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const ranks = boardStr.split('/');
  for (let i = 0; i < ranks.length; i++) {
    const r = 7 - i;
    let c = 0;
    for (const ch of ranks[i]) {
      if (ch >= '1' && ch <= '8') { c += parseInt(ch, 10); }
      else {
        const color: PieceColor = (ch === 'w' || ch === 'W') ? 'w' : 'b';
        const king = ch === ch.toUpperCase();
        grid[r][c] = { color, king };
        c++;
      }
    }
  }
  return { board: grid, turn: (turnStr === 'b' ? 'b' : 'w') };
}

// ─── Move generation ─────────────────────────────────────────────────────────

function findCaptures(b: Board, r: number, c: number, chainCaptured: Set<string>): CaptureOption[] {
  const cell = b[r][c];
  if (!cell) return [];
  const opp = cell.color === 'w' ? 'b' : 'w';
  const opts: CaptureOption[] = [];

  if (cell.king) {
    for (const [dr, dc] of DIAGS) {
      let nr = r + dr, nc = c + dc;
      while (inB(nr, nc)) {
        const t = b[nr][nc];
        if (t) {
          if (t.color === opp && !chainCaptured.has(`${nr},${nc}`)) {
            let lr = nr + dr, lc = nc + dc;
            while (inB(lr, lc)) {
              const land = b[lr][lc];
              if (land) {
                if (lr === r && lc === c) opts.push({ lr, lc, cr: nr, cc: nc });
                break;
              }
              opts.push({ lr, lc, cr: nr, cc: nc });
              lr += dr; lc += dc;
            }
          }
          break;
        }
        nr += dr; nc += dc;
      }
    }
  } else {
    for (const [dr, dc] of DIAGS) {
      const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (!inB(lr, lc)) continue;
      const mid = b[mr][mc], land = b[lr][lc];
      if (mid && mid.color === opp && !chainCaptured.has(`${mr},${mc}`) && !land) {
        opts.push({ lr, lc, cr: mr, cc: mc });
      }
    }
  }
  return opts;
}

function findSimpleMoves(b: Board, r: number, c: number): [number, number][] {
  const cell = b[r][c];
  if (!cell) return [];
  const moves: [number, number][] = [];

  if (cell.king) {
    for (const [dr, dc] of DIAGS) {
      let nr = r + dr, nc = c + dc;
      while (inB(nr, nc) && !b[nr][nc]) { moves.push([nr, nc]); nr += dr; nc += dc; }
    }
  } else {
    const fwd = cell.color === 'w' ? 1 : -1;
    for (const dc of [-1, 1]) {
      const nr = r + fwd, nc = c + dc;
      if (inB(nr, nc) && !b[nr][nc]) moves.push([nr, nc]);
    }
  }
  return moves;
}

function piecesOf(b: Board, color: PieceColor): [number, number][] {
  const result: [number, number][] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (b[r][c]?.color === color) result.push([r, c]);
  return result;
}

/**
 * Generate all complete moves for a color (including full capture chains).
 * Each Move contains the full from → to path with all captures.
 */
function generateMoves(b: Board, color: PieceColor): Move[] {
  const pieces = piecesOf(b, color);
  const captureMoves: Move[] = [];

  // First check captures — build full chains via DFS
  for (const [r, c] of pieces) {
    buildCaptureChains(b, r, c, r, c, new Set(), [], false, captureMoves);
  }

  if (captureMoves.length > 0) return captureMoves;

  // No captures — simple moves
  const moves: Move[] = [];
  for (const [r, c] of pieces) {
    for (const [tr, tc] of findSimpleMoves(b, r, c)) {
      const cell = b[r][c]!;
      const promoRank = cell.color === 'w' ? 7 : 0;
      moves.push({
        from: [r, c],
        to: [tr, tc],
        captures: [],
        crowned: !cell.king && tr === promoRank,
      });
    }
  }
  return moves;
}

/** DFS to build all complete capture chains from a position */
function buildCaptureChains(
  b: Board,
  origR: number, origC: number,
  r: number, c: number,
  captured: Set<string>,
  path: [number, number][],
  wasCrowned: boolean,
  result: Move[],
): void {
  const caps = findCaptures(b, r, c, captured);
  if (caps.length === 0) {
    // End of chain — record complete move
    if (path.length > 0) {
      const capturedList = [...captured].map(k => {
        const [cr, cc] = k.split(',').map(Number);
        return [cr, cc] as [number, number];
      });
      result.push({
        from: [origR, origC],
        to: path[path.length - 1],
        captures: capturedList,
        crowned: wasCrowned,
      });
    }
    return;
  }

  for (const cap of caps) {
    // Apply capture
    const cell = b[r][c]!;
    const savedLanding = b[cap.lr][cap.lc];
    const savedOrigin = b[r][c];

    b[cap.lr][cap.lc] = cell;
    b[r][c] = null;

    const capKey = `${cap.cr},${cap.cc}`;
    captured.add(capKey);
    path.push([cap.lr, cap.lc]);

    // Check promotion
    const promoRank = cell.color === 'w' ? 7 : 0;
    let crowned = wasCrowned;
    if (!cell.king && cap.lr === promoRank) {
      cell.king = true;
      crowned = true;
    }

    buildCaptureChains(b, origR, origC, cap.lr, cap.lc, captured, path, crowned, result);

    // Undo
    path.pop();
    captured.delete(capKey);
    b[r][c] = savedOrigin;
    b[cap.lr][cap.lc] = savedLanding;

    // Undo promotion
    if (crowned && !wasCrowned) {
      cell.king = false;
    }
  }
}

/** Apply a complete move to a board (mutates), returns new turn */
function applyMove(b: Board, move: Move, color: PieceColor): PieceColor {
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const cell = b[fr][fc]!;

  b[tr][tc] = cell;
  b[fr][fc] = null;

  // Remove captured pieces
  for (const [cr, cc] of move.captures) {
    b[cr][cc] = null;
  }

  // Crown
  if (move.crowned) {
    cell.king = true;
  }

  return color === 'w' ? 'b' : 'w';
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

/** Material + positional evaluation from white's perspective */
function evaluate(b: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = b[r][c];
      if (!cell) continue;
      const sign = cell.color === 'w' ? 1 : -1;

      // Material: man=100, king=300
      let val = cell.king ? 300 : 100;

      // Positional: advance bonus for men (center rows more valuable)
      if (!cell.king) {
        const advance = cell.color === 'w' ? r : (7 - r);
        val += advance * 5;

        // Center control bonus
        if (c >= 2 && c <= 5 && r >= 2 && r <= 5) {
          val += 8;
        }

        // Back rank defense (men on home row protect against enemy kings)
        if (advance === 0) {
          val += 3;
        }
      } else {
        // King center bonus
        if (c >= 2 && c <= 5 && r >= 2 && r <= 5) {
          val += 10;
        }
      }

      score += sign * val;
    }
  }
  return score;
}

// ─── Minimax with alpha-beta ─────────────────────────────────────────────────

function minimax(
  b: Board,
  depth: number,
  alpha: number,
  beta: number,
  color: PieceColor,
): number {
  const moves = generateMoves(b, color);

  // Terminal node or depth limit
  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      // Current player lost (no moves)
      return color === 'w' ? -10000 + (8 - depth) : 10000 - (8 - depth);
    }
    return evaluate(b);
  }

  const isMaximizing = color === 'w';

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const clone = cloneBoard(b);
      const nextColor = applyMove(clone, move, color);
      const val = minimax(clone, depth - 1, alpha, beta, nextColor);
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const clone = cloneBoard(b);
      const nextColor = applyMove(clone, move, color);
      const val = minimax(clone, depth - 1, alpha, beta, nextColor);
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/** Find the best move for the given position */
function findBestMove(fen: string, depth: number): { from: string; to: string } | null {
  const { board, turn } = parseFen(fen);
  const moves = generateMoves(board, turn);

  if (moves.length === 0) return null;
  if (moves.length === 1) {
    // Only one legal move — play it instantly
    const m = moves[0];
    return {
      from: String.fromCharCode(97 + m.from[1]) + (m.from[0] + 1),
      to: String.fromCharCode(97 + m.to[1]) + (m.to[0] + 1),
    };
  }

  let bestMove = moves[0];
  const isMaximizing = turn === 'w';
  let bestVal = isMaximizing ? -Infinity : Infinity;

  // Move ordering: prioritize captures, then crowned moves
  moves.sort((a, b) => {
    const aScore = a.captures.length * 10 + (a.crowned ? 5 : 0);
    const bScore = b.captures.length * 10 + (b.crowned ? 5 : 0);
    return bScore - aScore;
  });

  // Propagate alpha/beta across root moves for better pruning
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    const clone = cloneBoard(board);
    const nextColor = applyMove(clone, move, turn);
    const val = minimax(clone, depth - 1, alpha, beta, nextColor);

    if (isMaximizing) {
      if (val > bestVal) { bestVal = val; bestMove = move; }
      alpha = Math.max(alpha, val);
    } else {
      if (val < bestVal) { bestVal = val; bestMove = move; }
      beta = Math.min(beta, val);
    }
  }

  return {
    from: String.fromCharCode(97 + bestMove.from[1]) + (bestMove.from[0] + 1),
    to: String.fromCharCode(97 + bestMove.to[1]) + (bestMove.to[0] + 1),
  };
}

// ─── Worker message handler ──────────────────────────────────────────────────

self.onmessage = (e: MessageEvent) => {
  const { type, fen, depth } = e.data;
  if (type === 'search') {
    try {
      const result = findBestMove(fen, depth);
      if (result) {
        self.postMessage({ type: 'bestmove', from: result.from, to: result.to });
      } else {
        self.postMessage({ type: 'error', message: 'No legal moves' });
      }
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) });
    }
  }
};
