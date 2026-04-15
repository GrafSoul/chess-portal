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
