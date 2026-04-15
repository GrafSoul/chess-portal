# System Patterns

## Game Module Structure
- **What:** Each game follows the same folder structure: engine/, stores/, components/scene/, components/ui/, hooks/, ai/, audio/, config/
- **Why:** Consistency, easy to add new games, clear separation of concerns
- **Where:** src/games/{chess,checkers}/
- **Added:** 2026-04-13

## Engine Pattern
- **What:** Pure TypeScript engine class, no React dependencies. FEN serialization, move generation, undo, win/draw detection
- **Why:** Testable, reusable, can be used in Web Workers
- **Where:** src/games/*/engine/
- **Added:** 2026-04-13

## AI Worker Pattern
- **What:** Minimax + alpha-beta in a self-contained Web Worker. Duplicates engine logic (workers can't import from main bundle). Bundled by Vite via `new URL('./worker.ts', import.meta.url)`
- **Why:** Non-blocking AI computation, keeps UI responsive
- **Where:** src/games/*/ai/
- **Added:** 2026-04-13

## Two-Pass Piece Tracking
- **What:** PieceSet components use two-pass algorithm (exact-square match → closest-match) for stable 3D piece identity across moves
- **Why:** Enables smooth arc-flight animations without piece flickering
- **Where:** src/games/*/components/scene/*PieceSet.tsx
- **Added:** 2026-04-13

## Store + Hook Wiring
- **What:** Zustand store holds game state. Main hook (useCheckersGame/useChessGame) wires store + clock + sounds + AI + stats
- **Why:** Single entry point for page components, clean separation
- **Where:** src/games/*/hooks/use*Game.ts
- **Added:** 2026-04-13

## Sound Pattern
- **What:** WebAudio synthesized sounds (no audio files). Singleton service class, React hook for event detection
- **Why:** Zero external dependencies, small bundle size
- **Where:** src/games/*/audio/
- **Added:** 2026-04-13

## Settings Pattern
- **What:** Zustand with persist middleware for game settings. Slide-in panel with Framer Motion
- **Why:** Settings survive page reload, smooth UX
- **Where:** src/games/*/stores/use*SettingsStore.ts, components/ui/*SettingsPanel.tsx
- **Added:** 2026-04-13
