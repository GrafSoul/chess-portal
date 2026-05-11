# Decision Log

## [2026-04-13] — Checkers AI: Self-contained Web Worker
- **Context:** Need AI computation without blocking UI
- **Decision:** Duplicate engine logic inside the worker file (minimax + move generation + evaluation)
- **Alternatives:** SharedArrayBuffer, Comlink, dynamic import in worker
- **Consequences:** Larger worker file (~3.8kB gzipped), but zero import complexity. Vite bundles it as separate chunk automatically.

## [2026-04-13] — Brand rename: Chess Portal → Game Portal
- **Context:** Adding checkers made "Chess Portal" inaccurate
- **Decision:** Renamed to "Game Portal" / "Игровой портал" in nav and i18n
- **Alternatives:** Keep chess-specific branding
- **Consequences:** Better reflects multi-game nature, URL/repo name unchanged

## [2026-04-13] — Alpha-beta root propagation fix
- **Context:** Code review found that findBestMove wasn't propagating alpha/beta between root-level moves
- **Decision:** Added alpha/beta tracking at root level for proper pruning
- **Alternatives:** Leave as-is (correct but slower)
- **Consequences:** Faster AI search at higher depths, especially for expert difficulty

## [2026-04-26] — TODO: AI Difficulty Overhaul (all three games)
- **Context:** Code audit revealed AI levels don't meaningfully differ in several key areas. User expects: higher level = deeper search + more aggressive evaluation.
- **Decision:** Deferred to a dedicated sprint AFTER Backgammon is playable. Implement in order: Go → Checkers → Chess.
- **Alternatives:** Fix inline during Backgammon sprints (rejected — keeps focus)
- **Consequences:** Known weakness until the overhaul sprint runs

### Exact fixes per game

**Go (HIGH priority):**
- `goWorker.ts`: gate `findBestCapture`/`findBestSave` by level — easy: OFF both, medium: save-only, hard+: both
- `goWorker.ts`: at easy level use temperature/softmax child selection instead of argmax (introduces visible mistakes)
- `goWorker.ts`: reduce rollout quality on easy (pure random, no capture/save filters in playouts)
- `aiLevels.ts`: raise UCT_C from 1.41 → 1.6 for hard/expert on 19×19 (better root exploration)

**Checkers (HIGH priority):**
- `checkersWorker.ts`: add controlled randomness at easy — pick randomly from top-3 moves 30% of time
- `checkersWorker.ts`: add quiescence search (extend on capture sequences) for hard/expert
- `checkersWorker.ts` eval: level-scaled weights — hard/expert increases weight of king mobility + threat detection

**Chess (MEDIUM priority):**
- `StockfishService.ts` line 86: `depth` field in `AI_LEVELS` config is dead code — either send `go depth N movetime M` or remove field
- Optional: use `setoption name UCI_LimitStrength value true` + `setoption name UCI_Elo value N` for finer easy calibration
- Optional: raise `Contempt` to 30 for expert (more aggressive, avoids draws)

### Files to touch when ready:
- `src/games/go/ai/goWorker.ts`
- `src/games/go/config/aiLevels.ts`
- `src/games/checkers/ai/checkersWorker.ts`
- `src/games/chess/ai/StockfishService.ts`
- `src/games/chess/config/aiLevels.ts`
