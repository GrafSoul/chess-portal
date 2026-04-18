# Progress

## [2026-04-13] — Checkers: Phase 1 (Engine)
- **Status:** COMPLETED
- **What:** CheckersEngine class with Russian draughts rules, FEN, move gen, chains, undo, types

## [2026-04-13] — Checkers: Phase 2 (Stores)
- **Status:** COMPLETED
- **What:** useCheckersStore, useCheckersSettingsStore, useCheckersStatsStore

## [2026-04-13] — Checkers: Phase 3 (3D Pieces)
- **Status:** COMPLETED
- **What:** CheckerPiece (man + king), CheckerPieceSet with two-pass tracking, arc-flight animation

## [2026-04-13] — Checkers: Phase 4 (Scene + Page + Routing)
- **Status:** COMPLETED
- **What:** Board, BoardSquare, MoveIndicator, Scene, Lighting, Environment, CameraRig, CheckersPage, routing, sidebar, home page

## [2026-04-13] — Checkers: Phase 5 (Game Hook + Timer + Sounds)
- **Status:** COMPLETED
- **What:** useCheckersGame, ClockManager, SoundService, useSoundEffects

## [2026-04-13] — Checkers: Phase 6 (AI)
- **Status:** COMPLETED
- **What:** checkersWorker (minimax + alpha-beta), CheckersAIService, useCheckersAI

## [2026-04-13] — Checkers: Phase 7 (i18n + UI Polish)
- **Status:** COMPLETED
- **What:** CheckersSettingsPanel, i18n translations, brand rename

## [2026-04-13] — Checkers: Phase 8 (Quality Gates)
- **Status:** COMPLETED
- **What:** Build PASS, Lint PASS, TypeScript PASS, Visual verification PASS (all 4 pages), Console 0 errors, Code review done (1 fix applied), JSDoc coverage 100%

## [2026-04-13] — Checkers: Tutorial (Rules Panel)
- **Status:** COMPLETED
- **What:** 10-chapter interactive tutorial matching chess pattern. Files: tutorialChapters.ts, useCheckersTutorialStore.ts, useCheckersTutorialLoop.ts, useCheckersDisplayedBoardState.ts, CheckersTutorialOverlay.tsx, CheckersRulesPanel.tsx, fenUtils.ts, boardCoords.ts. Updated CheckersScene, CheckersPage, translations (en+ru). Build/lint/typecheck PASS.

## [2026-04-17] — Go: Sprint 1 (Engine)
- **Status:** COMPLETED
- **What:** GoEngine, types, scoring (Chinese/Japanese), groupUtils, scoringRules config, aiLevels config. 54 unit tests.

## [2026-04-17] — Go: Sprint 2 (3D MVP)
- **Status:** COMPLETED
- **What:** GoBoard, GoStone, GoStoneSet, GoIntersection, GoScene, GoEnvironment, GoLighting, GoCameraRig, GoPage, useGoStore, useGoGame, useGoDisplayedBoardState, boardLayout, routing, sidebar, translations.

## [2026-04-17] — Go: Sprint 3 (Animation + Sounds + Scoring)
- **Status:** COMPLETED
- **What:** FadingGoStone capture animation, GoSoundService (WebAudio synthesis), useGoSoundEffects hook, scoring overlay with previewScore, event-tick pattern for sound triggers.

## [2026-04-17] — Go: Sprint 4 (MCTS AI)
- **Status:** COMPLETED
- **What:** goWorker.ts (self-contained MCTS+UCT in Web Worker, 5.14kB), GoAIService.ts (Promise-based worker wrapper), useGoAI.ts (React hook), useGoSettingsStore.ts (Zustand+persist). Code review fixes: slow-path fallback in getLegalMoveKeys, eye-filling avoidance in playouts, MCTS tree GC. Build/Lint/Tests PASS.

## [2026-04-17] — Go: Sprint 5 (UI/UX)
- **Status:** COMPLETED
- **What:** GoPlayerCard.tsx (name, color indicator, captured count, thinking label), GoSettingsPanel.tsx (Language, Mode, Color, Board Size, Scoring Rules, AI Difficulty, Sound). GoPage.tsx full rewrite: player cards, move history sidebar (Go notation A1-T19), settings panel, proper end-game modal. Added undoSingle action for scoring resume. resetGame reads from useGoSettingsStore. +17 i18n keys. Code review fixes: coordinate inversion (boardSize-y), undoSingle for scoring resume. Build/Lint/Tests PASS.

## [2026-04-17] — Go: Sprint 6 (Scoring UI / Dead Stones)
- **Status:** COMPLETED
- **What:** Dead stone marking (toggleDeadStone toggles entire connected groups dead/alive), territory visualization (small squares on board intersections), reactive scoring (scoringBreakdown + territoryMap recomputed on each toggle). Store: deadStones, territoryMap, scoringBreakdown fields + toggleDeadStone action. GoStone: isDead prop (35% opacity + red × marker). GoBoard: territory markers. GoScene: mode-aware clicks (play vs scoring). GoPage: scoring panel repositioned to bottom-right (no longer blocks board). Code review fixes: scoring overlay pointer-events (moved from full-screen modal to side panel), resign disabled during scoring. Build/Lint/Tests 54/54 PASS.

## [2026-04-18] — Go Sprint 7: Tutorial (post-review fixes)
- **Status:** COMPLETED
- **What:** Applied code review + JSDoc fixes after Sprint 7 implementation
- **Notes:**
  - ch4 (capture): white stone was fully surrounded (0 liberties) — removed extra black stone at y=3. Fixed highlight/arrow/loop step to use correct last-liberty point (4,3).
  - ch5 (groups): `3bb5` created 10-cell row. Fixed to `3bb4`.
  - ch6 (ko): two stones with 0 liberties each. Replaced entire position with mathematically correct ko setup (w@5,4 in atari, ko point at 4,4, verified all adjacencies legal).
  - boardNotation.ts: added @example to emptyBoard.
  - GoRulesPanel.tsx: expanded JSDoc to per-prop @param style.
  - Build ✅ Lint ✅ Tests 58/58 ✅

## [2026-04-18] — Go Sprint 8 (Polish)
- **Status:** COMPLETED
- **What:** 6 polish tasks + quality gates. Last-move highlight confirmed present; hover stone preview added; GoPage refactored 546→222 LOC with 4 extracted subcomponents + utils; mobile responsive layout (icon buttons, collapsible history, compact cards); accessibility (useEscapeClose hook, role=dialog + aria-modal + aria-labelledby on all modals, aria-live on status); React.memo on hot 3D + UI components.
- **Notes:**
  - New files: GoHoverPreview.tsx, GoTopBar.tsx, GoMoveHistory.tsx, GoScoringPanel.tsx, GoEndGameDialog.tsx, utils/moveFormat.ts, hooks/useEscapeClose.ts
  - User preference captured: stats must be per-game (not shared across chess/checkers/go) — for future Stats sprint
  - Open tech debt: Go AI engine replacement (user flagged hand-written MCTS as inferior to Stockfish/minimax used in other games), per-game stats stores, clock implementation, persistence audit in chess/checkers
  - Build ✅ Lint ✅ Tests 58/58 ✅
