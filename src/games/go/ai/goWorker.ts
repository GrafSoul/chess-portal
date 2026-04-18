/**
 * Web Worker for Go AI — Monte Carlo Tree Search (MCTS) with UCT.
 *
 * Receives: { type: 'search', snapshot: GoEngineJSON, timeBudgetMs: number, maxPlayouts: number }
 * Responds: { type: 'move', point: { x, y } } | { type: 'pass' } | { type: 'error', message: string }
 *
 * Self-contained: workers cannot import from the main bundle, so all Go
 * engine logic needed for move simulation is duplicated here in minimal form.
 *
 * Algorithm overview:
 * 1. **Selection** — walk the tree, picking the child with the highest UCT score.
 * 2. **Expansion** — add one new node for an untried legal move.
 * 3. **Simulation** — random playout until the game finishes.
 * 4. **Backpropagation** — propagate the result up the tree.
 *
 * After the time/playout budget is exhausted, return the root child with the
 * most visits (robust child selection).
 */

// ─── Inline types (mirror engine/types.ts) ──────────────────────────────────

type Stone = 'b' | 'w';
type Intersection = Stone | null;
type Board = Intersection[][];
interface Point { x: number; y: number }
type BoardSize = 9 | 19;
type GameStatus = 'idle' | 'playing' | 'scoring' | 'ended';

interface GoEngineJSON {
  boardSize: BoardSize;
  board: Board;
  turn: Stone;
  koPoint: Point | null;
  passCount: number;
  status: GameStatus;
  captured: { black: number; white: number };
  komi: number;
}

interface SearchRequest {
  type: 'search';
  snapshot: GoEngineJSON;
  timeBudgetMs: number;
  maxPlayouts: number;
}

// ─── Board utilities ────────────────────────────────────────────────────────

function opposite(c: Stone): Stone { return c === 'b' ? 'w' : 'b'; }
function inBounds(x: number, y: number, size: number): boolean {
  return x >= 0 && x < size && y >= 0 && y < size;
}
function pointKey(x: number, y: number): number { return y * 64 + x; }

function cloneBoard(b: Board): Board {
  return b.map((row) => row.slice() as Intersection[]);
}

const DX = [1, -1, 0, 0];
const DY = [0, 0, 1, -1];

/** Flood-fill same-color group from (sx, sy). */
function getGroupAndLiberties(
  board: Board, sx: number, sy: number, size: number,
): { group: number[]; libertyCount: number } {
  const color = board[sy][sx];
  if (!color) return { group: [], libertyCount: 0 };
  const seen = new Set<number>();
  const libSet = new Set<number>();
  const stack = [pointKey(sx, sy)];
  const group: number[] = [];

  while (stack.length > 0) {
    const key = stack.pop()!;
    if (seen.has(key)) continue;
    seen.add(key);
    const px = key % 64;
    const py = (key - px) / 64;
    if (board[py][px] !== color) continue;
    group.push(key);

    for (let d = 0; d < 4; d++) {
      const nx = px + DX[d];
      const ny = py + DY[d];
      if (!inBounds(nx, ny, size)) continue;
      const nk = pointKey(nx, ny);
      if (seen.has(nk)) continue;
      const cell = board[ny][nx];
      if (cell === null) libSet.add(nk);
      else if (cell === color) stack.push(nk);
    }
  }
  return { group, libertyCount: libSet.size };
}

// ─── Lightweight game state for simulations ─────────────────────────────────

/** Minimal mutable game state used inside MCTS simulations. */
interface SimState {
  board: Board;
  size: number;
  turn: Stone;
  koKey: number; // pointKey of ko point, or -1
  passCount: number;
  ended: boolean;
  capturedBlack: number;
  capturedWhite: number;
}

/**
 * Build a mutable `SimState` from the engine's immutable JSON snapshot.
 * The board is deep-cloned so simulations don't mutate the original.
 * `koPoint` is normalised to a numeric key (-1 when absent) for fast equality.
 */
function createSimState(snap: GoEngineJSON): SimState {
  return {
    board: cloneBoard(snap.board),
    size: snap.boardSize,
    turn: snap.turn,
    koKey: snap.koPoint ? pointKey(snap.koPoint.x, snap.koPoint.y) : -1,
    passCount: snap.passCount,
    ended: snap.status === 'ended' || snap.status === 'scoring',
    capturedBlack: snap.captured.black,
    capturedWhite: snap.captured.white,
  };
}

/**
 * Deep-clone a `SimState` for use in a new MCTS iteration.
 * Each iteration of the main loop starts from an independent copy of the root
 * state so that selection/expansion/simulation steps do not interfere.
 */
function cloneSimState(s: SimState): SimState {
  return {
    board: cloneBoard(s.board),
    size: s.size,
    turn: s.turn,
    koKey: s.koKey,
    passCount: s.passCount,
    ended: s.ended,
    capturedBlack: s.capturedBlack,
    capturedWhite: s.capturedWhite,
  };
}

/**
 * Try to play at (x, y). Returns true on success, false on illegal.
 * Mutates the SimState in place.
 */
function simPlay(s: SimState, x: number, y: number): boolean {
  if (s.ended) return false;
  if (!inBounds(x, y, s.size)) return false;
  if (s.board[y][x] !== null) return false;
  const key = pointKey(x, y);
  if (key === s.koKey) return false;

  const color = s.turn;
  const opp = opposite(color);
  s.board[y][x] = color;

  // Capture adjacent opponent groups with zero liberties
  let totalCaptured = 0;
  const capturedKeys: number[] = [];
  const checkedGroups = new Set<number>();

  for (let d = 0; d < 4; d++) {
    const nx = x + DX[d];
    const ny = y + DY[d];
    if (!inBounds(nx, ny, s.size)) continue;
    if (s.board[ny][nx] !== opp) continue;
    const nk = pointKey(nx, ny);
    if (checkedGroups.has(nk)) continue;

    const { group, libertyCount } = getGroupAndLiberties(s.board, nx, ny, s.size);
    for (const gk of group) checkedGroups.add(gk);
    if (libertyCount === 0) {
      for (const gk of group) {
        const gx = gk % 64;
        const gy = (gk - gx) / 64;
        s.board[gy][gx] = null;
        capturedKeys.push(gk);
      }
      totalCaptured += group.length;
    }
  }

  // Suicide check
  const { libertyCount: ownLibs, group: ownGroup } =
    getGroupAndLiberties(s.board, x, y, s.size);
  if (ownLibs === 0) {
    // Undo placement and captures
    s.board[y][x] = null;
    for (const ck of capturedKeys) {
      const cx = ck % 64;
      const cy = (ck - cx) / 64;
      s.board[cy][cx] = opp;
    }
    return false;
  }

  // Update captures
  if (color === 'b') s.capturedBlack += totalCaptured;
  else s.capturedWhite += totalCaptured;

  // Ko detection
  if (totalCaptured === 1 && ownGroup.length === 1 && ownLibs === 1) {
    s.koKey = capturedKeys[0];
  } else {
    s.koKey = -1;
  }

  s.turn = opp;
  s.passCount = 0;
  s.ended = false;
  return true;
}

/** Pass. Returns true. Two consecutive passes end the game. */
function simPass(s: SimState): void {
  s.passCount += 1;
  s.turn = opposite(s.turn);
  s.koKey = -1;
  if (s.passCount >= 2) s.ended = true;
}

/**
 * Get all legal play-moves for the current turn.
 * Returns array of pointKeys. Excludes ko and suicide.
 */
function getLegalMoveKeys(s: SimState): number[] {
  if (s.ended) return [];
  const moves: number[] = [];
  const size = s.size;
  const board = s.board;
  const color = s.turn;
  const opp = opposite(color);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== null) continue;
      const key = pointKey(x, y);
      if (key === s.koKey) continue;

      // Quick liberty check: if any neighbor is empty, it's certainly legal
      let hasEmptyNeighbor = false;
      let hasFriendlyWithExtraLib = false;
      let capturesOpponent = false;

      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d];
        const ny = y + DY[d];
        if (!inBounds(nx, ny, size)) continue;
        const cell = board[ny][nx];
        if (cell === null) { hasEmptyNeighbor = true; break; }
        if (cell === color) {
          // Check if the friendly group has > 1 liberty (i.e. won't be in atari after we place)
          const { libertyCount } = getGroupAndLiberties(board, nx, ny, size);
          if (libertyCount > 1) { hasFriendlyWithExtraLib = true; }
        } else if (cell === opp) {
          const { libertyCount } = getGroupAndLiberties(board, nx, ny, size);
          if (libertyCount === 1) { capturesOpponent = true; }
        }
      }

      if (hasEmptyNeighbor || hasFriendlyWithExtraLib || capturesOpponent) {
        moves.push(key);
      } else {
        // Slow path: the fast heuristic misses cases like connecting
        // multiple friendly groups that individually have <=1 liberty
        // but together form a living group. Trial-play on a clone.
        const trial: SimState = {
          board: cloneBoard(board),
          size,
          turn: color,
          koKey: s.koKey,
          passCount: s.passCount,
          ended: false,
          capturedBlack: s.capturedBlack,
          capturedWhite: s.capturedWhite,
        };
        if (simPlay(trial, x, y)) {
          moves.push(key);
        }
      }
    }
  }
  return moves;
}

/**
 * Return the subset of `moves` that immediately capture at least one opponent
 * group (i.e. an adjacent opponent group currently has exactly 1 liberty).
 *
 * Used in rollout to give the AI a strong preference for filling the last
 * liberty of an opponent group — the most impactful tactical awareness a
 * Go rollout can have without full look-ahead.
 *
 * @param board - Current board state.
 * @param size  - Board dimension.
 * @param moves - Candidate move keys.
 * @param mover - Color of the player about to move.
 * @returns Subset of `moves` that are capture moves (may be empty).
 */
function filterCaptureMoves(
  board: Board,
  size: number,
  moves: number[],
  mover: Stone,
): number[] {
  const opp = opposite(mover);
  const result: number[] = [];
  for (const mk of moves) {
    const mx = mk % 64;
    const my = (mk - mx) / 64;
    for (let d = 0; d < 4; d++) {
      const nx = mx + DX[d];
      const ny = my + DY[d];
      if (!inBounds(nx, ny, size)) continue;
      if (board[ny][nx] !== opp) continue;
      const { libertyCount } = getGroupAndLiberties(board, nx, ny, size);
      if (libertyCount === 1) {
        result.push(mk);
        break; // one capturing neighbor is enough
      }
    }
  }
  return result;
}

/**
 * Return the subset of `moves` that rescue a friendly group currently in
 * atari (exactly 1 liberty) by extending it (adding a liberty) or capturing
 * the attacker.
 *
 * @param board - Current board state.
 * @param size  - Board dimension.
 * @param moves - Candidate move keys.
 * @param mover - Color of the player about to move.
 * @returns Subset of `moves` that save at least one friendly group (may be empty).
 */
function filterSaveMoves(
  board: Board,
  size: number,
  moves: number[],
  mover: Stone,
): number[] {
  const result: number[] = [];
  for (const mk of moves) {
    const mx = mk % 64;
    const my = (mk - mx) / 64;
    for (let d = 0; d < 4; d++) {
      const nx = mx + DX[d];
      const ny = my + DY[d];
      if (!inBounds(nx, ny, size)) continue;
      if (board[ny][nx] !== mover) continue;
      const { libertyCount } = getGroupAndLiberties(board, nx, ny, size);
      if (libertyCount === 1) {
        result.push(mk);
        break;
      }
    }
  }
  return result;
}

/**
 * Check if placing at (x, y) would fill a single-point eye for `color`.
 * An eye is an empty point where all 4 orthogonal neighbors (or board edges)
 * are friendly, and at most 1 diagonal is enemy/empty on a non-edge point
 * (0 allowed on edge/corner).
 */
function isSinglePointEye(board: Board, size: number, x: number, y: number, color: Stone): boolean {
  const opp = opposite(color);

  // All orthogonal neighbors must be friendly or off-board
  for (let d = 0; d < 4; d++) {
    const nx = x + DX[d];
    const ny = y + DY[d];
    if (!inBounds(nx, ny, size)) continue;
    if (board[ny][nx] !== color) return false;
  }

  // Check diagonals: count enemy/empty diagonals
  const DIAG_DX = [1, 1, -1, -1];
  const DIAG_DY = [1, -1, 1, -1];
  let badDiags = 0;
  let totalDiags = 0;

  for (let d = 0; d < 4; d++) {
    const nx = x + DIAG_DX[d];
    const ny = y + DIAG_DY[d];
    if (!inBounds(nx, ny, size)) continue;
    totalDiags++;
    if (board[ny][nx] === opp) badDiags++;
  }

  // On edge/corner (fewer diagonals), no bad diagonals allowed.
  // In center (4 diagonals), at most 1 bad diagonal allowed.
  const maxBad = totalDiags < 4 ? 0 : 1;
  return badDiags <= maxBad;
}

/**
 * Simple Chinese-style area score: territory + stones on board.
 * Returns score from Black's perspective (positive = Black leads).
 */
function chineseScore(s: SimState, komi: number): number {
  const size = s.size;
  const board = s.board;
  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;

  const visited = new Set<number>();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = board[y][x];
      if (cell === 'b') { blackStones++; continue; }
      if (cell === 'w') { whiteStones++; continue; }

      const key = pointKey(x, y);
      if (visited.has(key)) continue;

      // BFS flood-fill empty region
      const region: number[] = [];
      let touchesBlack = false;
      let touchesWhite = false;
      const stack = [key];
      const localSeen = new Set<number>();

      while (stack.length > 0) {
        const k = stack.pop()!;
        if (localSeen.has(k)) continue;
        localSeen.add(k);
        const px = k % 64;
        const py = (k - px) / 64;
        const c = board[py][px];
        if (c === 'b') { touchesBlack = true; continue; }
        if (c === 'w') { touchesWhite = true; continue; }
        visited.add(k);
        region.push(k);

        for (let d = 0; d < 4; d++) {
          const nx = px + DX[d];
          const ny = py + DY[d];
          if (!inBounds(nx, ny, size)) continue;
          const nk = pointKey(nx, ny);
          if (!localSeen.has(nk)) stack.push(nk);
        }
      }

      if (touchesBlack && !touchesWhite) blackTerritory += region.length;
      else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;
    }
  }

  return (blackStones + blackTerritory) - (whiteStones + whiteTerritory + komi);
}

// ─── Root tactical pre-search ───────────────────────────────────────────────
//
// Before running MCTS we scan the root position for obvious one-ply tactics.
// On 19×19 with the "amateur" budget (~1500 playouts / 360 legal moves) each
// root child gets only ~4 visits — far too few for meaningful UCT ranking,
// so MCTS-only play devolves into noise and the AI ignores captures. This
// pre-search guarantees the AI never misses a stone already in atari and
// never loses its own group that can still be saved.
//
// Priority order:
//   1. Capture — prefer the move that captures the most opponent stones.
//   2. Save    — prefer the move that leaves the rescued group with the
//      largest number of liberties (most durable save).
//
// Moves must survive `simPlay` (no suicide, no ko violation) to qualify.

/**
 * Count how many opponent stones a move would capture and whether the move
 * itself is legal. Returns -1 when the move is rejected (suicide / ko).
 */
function countCaptures(rootState: SimState, moveKey: number): number {
  const trial = cloneSimState(rootState);
  const mx = moveKey % 64;
  const my = (moveKey - mx) / 64;
  const opp = opposite(trial.turn);
  const beforeOpp = countStones(trial.board, trial.size, opp);
  if (!simPlay(trial, mx, my)) return -1;
  const afterOpp = countStones(trial.board, trial.size, opp);
  return beforeOpp - afterOpp;
}

/** Count the liberties of the friendly group containing `(mx, my)` after playing it. */
function libertiesAfterMove(rootState: SimState, moveKey: number): number {
  const trial = cloneSimState(rootState);
  const mx = moveKey % 64;
  const my = (moveKey - mx) / 64;
  if (!simPlay(trial, mx, my)) return -1;
  // After simPlay, the placed stone belongs to the prior turn; look up liberties of
  // its group in the new board state.
  const { libertyCount } = getGroupAndLiberties(trial.board, mx, my, trial.size);
  return libertyCount;
}

/** Total stones of color `c` on the board. */
function countStones(board: Board, size: number, c: Stone): number {
  let n = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === c) n++;
    }
  }
  return n;
}

/**
 * Find the root move that captures the largest number of opponent stones.
 * Returns -1 when no legal capture exists.
 */
function findBestCapture(rootState: SimState, legal: number[]): number {
  const candidates = filterCaptureMoves(
    rootState.board,
    rootState.size,
    legal,
    rootState.turn,
  );
  if (candidates.length === 0) return -1;
  let best = -1;
  let bestCount = 0;
  for (const k of candidates) {
    const c = countCaptures(rootState, k);
    if (c > bestCount) {
      bestCount = c;
      best = k;
    }
  }
  return best;
}

/**
 * Find the root move that rescues a friendly group in atari with the most
 * liberties after the save. Returns -1 when no viable save exists.
 *
 * Prefer moves leaving ≥2 liberties — a rescue to a single liberty just
 * delays the capture by one move and gives up sente. If the only saves
 * leave 1 liberty, we skip (let MCTS decide if the group is worth saving).
 */
function findBestSave(rootState: SimState, legal: number[]): number {
  const candidates = filterSaveMoves(
    rootState.board,
    rootState.size,
    legal,
    rootState.turn,
  );
  if (candidates.length === 0) return -1;
  let best = -1;
  let bestLibs = 1; // strictly > 1 to be worth saving
  for (const k of candidates) {
    const libs = libertiesAfterMove(rootState, k);
    if (libs > bestLibs) {
      bestLibs = libs;
      best = k;
    }
  }
  return best;
}

// ─── MCTS ───────────────────────────────────────────────────────────────────

/** Exploration constant for UCT. */
const UCT_C = 1.41;

/** Maximum playout depth to prevent infinite games on large boards. */
const MAX_PLAYOUT_DEPTH = 400;

/** MCTS tree node. */
interface MCTSNode {
  /** Move that led here: pointKey or -1 for pass. */
  moveKey: number;
  /** Parent node (null for root). */
  parent: MCTSNode | null;
  /** Child nodes. */
  children: MCTSNode[];
  /** Visit count. */
  visits: number;
  /** Win count from the perspective of the player who just MOVED (parent.turn). */
  wins: number;
  /** Legal moves not yet expanded. */
  untriedMoves: number[];
  /** Whose turn it is at this node (i.e. who moves FROM this node). */
  turn: Stone;
  /** Whether pass has been tried as a child. */
  passTried: boolean;
}

/**
 * Allocate a fresh MCTS tree node.
 *
 * @param moveKey - The move (pointKey) that was played to reach this node, or -1 for pass / root.
 * @param parent - Parent node in the tree; `null` for the root.
 * @param untriedMoves - Legal moves from this position that have not yet been expanded.
 * @param turn - Whose turn it is to move FROM this node.
 */
function createNode(
  moveKey: number,
  parent: MCTSNode | null,
  untriedMoves: number[],
  turn: Stone,
): MCTSNode {
  return {
    moveKey,
    parent,
    children: [],
    visits: 0,
    wins: 0,
    untriedMoves,
    turn,
    passTried: false,
  };
}

/** UCT score for child selection. */
function uctScore(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  return (node.wins / node.visits) + UCT_C * Math.sqrt(Math.log(parentVisits) / node.visits);
}

/**
 * Run MCTS from the given snapshot and return the best move.
 *
 * @returns pointKey of best move, or -1 for pass.
 */
function mctsSearch(
  snapshot: GoEngineJSON,
  timeBudgetMs: number,
  maxPlayouts: number,
): number {
  const rootState = createSimState(snapshot);
  const rootLegal = getLegalMoveKeys(rootState);

  // If no legal moves, pass
  if (rootLegal.length === 0) return -1;
  // Only one legal move — play it immediately
  if (rootLegal.length === 1) return rootLegal[0];

  // ── Root tactical pre-search ─────────────────────────────────────────────
  // Avoids the "MCTS plays random on large boards with small budgets" problem:
  // if there is an obvious capture or save, play it directly without spending
  // any of the time budget on MCTS. This is what separates a competent-looking
  // amateur from a random-noise bot.
  const bestCapture = findBestCapture(rootState, rootLegal);
  if (bestCapture !== -1) return bestCapture;
  const bestSave = findBestSave(rootState, rootLegal);
  if (bestSave !== -1) return bestSave;

  const root = createNode(-1, null, [...rootLegal], rootState.turn);
  const startTime = performance.now();
  let playouts = 0;

  while (playouts < maxPlayouts) {
    // Check time budget periodically. On 19×19 a single playout can take
    // 50–200 ms, so we check every 16 iterations (≈1–3 s resolution) to keep
    // overshoot bounded — the previous "every 64" could run ~10 s past budget.
    if ((playouts & 15) === 0 && performance.now() - startTime > timeBudgetMs) break;

    // Clone state for this iteration
    const state = cloneSimState(rootState);
    let node = root;

    // 1. SELECTION — descend tree via UCT until we reach a node with untried moves or a terminal
    while (node.untriedMoves.length === 0 && node.children.length > 0) {
      // Pick child with best UCT
      let bestChild = node.children[0];
      let bestScore = -Infinity;
      for (const child of node.children) {
        const score = uctScore(child, node.visits);
        if (score > bestScore) {
          bestScore = score;
          bestChild = child;
        }
      }
      node = bestChild;
      // Apply the move to our state
      if (node.moveKey === -1) {
        simPass(state);
      } else {
        const mx = node.moveKey % 64;
        const my = (node.moveKey - mx) / 64;
        simPlay(state, mx, my);
      }
    }

    // 2. EXPANSION — try one untried move
    if (node.untriedMoves.length > 0 && !state.ended) {
      // Pick a random untried move
      const idx = Math.floor(Math.random() * node.untriedMoves.length);
      const moveKey = node.untriedMoves[idx];
      // Remove from untried (swap with last for O(1))
      node.untriedMoves[idx] = node.untriedMoves[node.untriedMoves.length - 1];
      node.untriedMoves.pop();

      const mx = moveKey % 64;
      const my = (moveKey - mx) / 64;
      const ok = simPlay(state, mx, my);

      if (ok) {
        const childLegal = getLegalMoveKeys(state);
        const child = createNode(moveKey, node, childLegal, state.turn);
        node.children.push(child);
        node = child;
      }
      // If not ok (shouldn't happen since getLegalMoveKeys filters), skip
    } else if (!node.passTried && !state.ended && node.untriedMoves.length === 0) {
      // Consider pass as an expansion when no untried play-moves remain
      node.passTried = true;
      simPass(state);
      const childLegal = getLegalMoveKeys(state);
      const child = createNode(-1, node, childLegal, state.turn);
      node.children.push(child);
      node = child;
    }

    // 3. SIMULATION — tactical rollout with eye-filling avoidance.
    //
    // Priority order (first non-empty list wins):
    //   1. Capture moves  — fill the last liberty of an opponent group
    //   2. Save moves     — extend/rescue a friendly group in atari
    //   3. Non-eye moves  — random legal play excluding own eye-fills
    //   4. Any legal move — fallback (eye-fills allowed if pool is otherwise empty)
    //
    // This turns the AI from a purely random player into one that reliably
    // captures stones in atari and defends its own groups — the single biggest
    // quality gap between a random rollout and a real player.
    let depth = 0;
    while (!state.ended && depth < MAX_PLAYOUT_DEPTH) {
      const legal = getLegalMoveKeys(state);
      if (legal.length === 0) {
        simPass(state);
        depth++;
        continue;
      }

      const color = state.turn;

      // Remove own single-point eye-fills first (baseline quality improvement).
      const nonEye = legal.filter((k) => {
        const kx = k % 64;
        const ky = (k - kx) / 64;
        return !isSinglePointEye(state.board, state.size, kx, ky, color);
      });
      const candidates = nonEye.length > 0 ? nonEye : legal;

      // Tactical selection: check captures, then saves, then random.
      const captures = filterCaptureMoves(state.board, state.size, candidates, color);
      let pool: number[];
      if (captures.length > 0) {
        pool = captures;
      } else {
        const saves = filterSaveMoves(state.board, state.size, candidates, color);
        pool = saves.length > 0 ? saves : candidates;
      }

      const moveKey = pool[Math.floor(Math.random() * pool.length)];
      const mx = moveKey % 64;
      const my = (moveKey - mx) / 64;
      if (!simPlay(state, mx, my)) {
        simPass(state);
      }
      depth++;
    }

    // 4. BACKPROPAGATION
    // Score from Black's perspective
    const blackScore = chineseScore(state, snapshot.komi);
    let current: MCTSNode | null = node;
    while (current !== null) {
      current.visits++;
      // The node's parent played the move that led to this node.
      // `current.turn` is who moves from this node.
      // So the player who MOVED to get here is `opposite(current.turn)`.
      const mover = opposite(current.turn);
      if ((mover === 'b' && blackScore > 0) || (mover === 'w' && blackScore < 0)) {
        current.wins++;
      } else if (blackScore === 0) {
        current.wins += 0.5; // Draw (unlikely with komi but handle it)
      }
      current = current.parent;
    }

    playouts++;
  }

  // Pick the root child with the most visits (robust selection)
  let bestChild: MCTSNode | null = null;
  let bestVisits = -1;
  for (const child of root.children) {
    if (child.visits > bestVisits) {
      bestVisits = child.visits;
      bestChild = child;
    }
  }

  const result = bestChild ? bestChild.moveKey : -1;

  // Explicitly break parent references so GC can collect the tree
  // promptly — at expert level the tree can have hundreds of thousands
  // of nodes and we don't want them lingering until the next search.
  freeTree(root);

  return result;
}

/** Recursively null out parent refs and detach children to assist GC. */
function freeTree(node: MCTSNode): void {
  node.parent = null;
  for (const child of node.children) freeTree(child);
  node.children.length = 0;
  node.untriedMoves.length = 0;
}

// ─── Worker message handler ─────────────────────────────────────────────────

/**
 * Entry point for all messages received from the main thread.
 *
 * Expected message shape: `SearchRequest` (`type: 'search'`).
 * Unknown message types are silently ignored.
 *
 * Replies with one of:
 * - `{ type: 'move', point: { x, y } }` — stone placement chosen by MCTS.
 * - `{ type: 'pass' }` — MCTS found no beneficial play.
 * - `{ type: 'error', message: string }` — uncaught exception inside MCTS.
 */
self.onmessage = (e: MessageEvent<SearchRequest>) => {
  const { type, snapshot, timeBudgetMs, maxPlayouts } = e.data;
  if (type !== 'search') return;

  try {
    const moveKey = mctsSearch(snapshot, timeBudgetMs, maxPlayouts);
    if (moveKey === -1) {
      self.postMessage({ type: 'pass' });
    } else {
      const x = moveKey % 64;
      const y = (moveKey - x) / 64;
      self.postMessage({ type: 'move', point: { x, y } });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
  }
};
