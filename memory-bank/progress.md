# Progress

## [2026-04-29] — Backgammon Sprint 7: Interactive Tutorial Panel
- **Status:** COMPLETED
- **What:** Full interactive tutorial (mirrors GoRulesPanel / CheckersRulesPanel pattern):
  - `tutorialChapters.ts` — 10 chapters (board, setup, movement, dice, nohit, head, blocking, bearoff, winning, strategy) with board positions, highlights, arrows, looped animations
  - `useBackgammonTutorialStore.ts` — Zustand store (enter/exit/setBoard/snapBoard/setHighlights/setArrows)
  - `useBackgammonTutorialLoop.ts` — async cancellation-token loop for animated demos
  - `useBackgammonDisplayedBoardState.ts` — routes rendering data to tutorial or live store
  - `BackgammonTutorialOverlay.tsx` — 3D highlight rings + directional arrows in R3F scene
  - `BackgammonRulesPanel.tsx` — Framer Motion spring slide-in, progress dots, chapter nav, Escape key close
  - `BackgammonScene.tsx` — upgraded to use display hook + overlay + DiceRoller suppression
  - `BackgammonPage.tsx` — wired rulesOpen state + BackgammonRulesPanel
  - `translations.ts` — 25 backgammonRules.* keys (EN+RU)
- **Gates:** Build ✅ Lint ✅ Tests 182/182 ✅

## [2026-04-29] — AI Difficulty Overhaul
- **Status:** COMPLETED
- **What:** Genuine difficulty differentiation across Go and Checkers AI.
  - **Go** (`goWorker.ts`): level-gated pre-search (easy→none, medium→save-only, hard/expert→capture+save), rollout quality (easy→pure random, medium+→tactical with eye filter), child selection (easy→40% top-3 random, medium+→max visits), UCT_C=1.6 for hard/expert. `GoAIService.setLevel(config, levelName)` stores and forwards level. `useGoAI` passes `aiLevel` string.
  - **Checkers** (`checkersWorker.ts`): all root moves evaluated (no root alpha-beta pruning), 30% random top-3 selection on easy. `CheckersAIService.setLevel(config, levelName)`. `useCheckersAI` passes level.
  - **Chess**: already correct — `StockfishService` uses `go movetime N` + `Skill Level` UCI option. `depth` field in config is display-only (shown in SettingsPanel UI).
- **Gates:** Build ✅ Lint ✅ Tests 182/182 ✅

## [2026-04-26] — Backgammon Sprint 6: Stats
- **Status:** COMPLETED
- **What:** useBackgammonStatsStore (persisted to 'backgammon-stats', MAX_RECORDS=200, selectBackgammonStatsSummary helper). Stats recording wired into useBackgammonGame: gameStartedAt + prevStatus + recordedRef + resignedRef pattern (mirrors useGoGame). Wrapped resign() to set resignedRef before store action. StatsPage: 4th tab 'backgammon', grid-cols-3→4, BACKGAMMON_END_REASON_KEYS map. Added i18n: stats.tabBackgammon, stats.endCompleted (EN+RU).
- **Gates:** Build ✅ Lint ✅ Tests 182/182 ✅

## [2026-04-26] — Backgammon Sprint 5: UI/UX
- **Status:** COMPLETED
- **What:** BackgammonTopBar (status chip + dice badges + Roll/Confirm/Undo/Resign/New/Rules/Settings buttons), BackgammonPlayerCard (color dot + born-off progress bar + isThinking pulse), BackgammonMoveHistory (reverse-chronological turns with dice + sub-move notation), BackgammonSettingsPanel (Framer Motion slide-in: game mode, player color, AI level, rules preset, custom rule toggles), BackgammonEndGameDialog (role=dialog, victory/defeat/mars/kokc, play-again + review), BackgammonPage rewritten as thin orchestrator mirroring GoPage. Also added shared src/core/hooks/useEscapeClose.ts, added 36 backgammon i18n keys (EN + RU).
- **Gates:** Build ✅ Lint ✅ Tests 182/182 ✅

## [2026-04-26] — Backgammon Sprint 4: AI (Expectimax)
- **Status:** COMPLETED
- **What:** backgammonWorker.ts (expectimax + chance nodes + budget-limited search), BackgammonAIService.ts (Promise wrapper, mirrors GoAIService), useBackgammonAI.ts (React hook: AI roll trigger + sub-move playback with visual pacing), useBackgammonGame.ts (facade hook, mounts AI, aggregates all state/actions), isAIThinking + setAIThinking added to useBackgammonStore, BackgammonPage refactored to use facade
- **Gates:** Build ✅ Lint ✅ Tests 182/182 ✅
- **Notes:** Worker uses BudgetExhausted sentinel class for safe early-exit; easy level adds 25% randomness from top-3 sequences; AI selects source via selectFrom() before executeSubMove() to satisfy store guard

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

## [2026-04-19] — Backgammon Sprint 1: Engine + Rules
- **Status:** COMPLETED
- **What:** Pure-TS engine for Long Backgammon — types, path utils, dice, head/block/bear-off rules, move generator, evaluator, engine facade
- **Files created:**
  - `src/games/backgammon/config/variants.ts` — BackgammonRules + RULE_PRESETS (5 presets)
  - `src/games/backgammon/config/aiLevels.ts` — AILevel + AI_LEVEL_CONFIG
  - `src/games/backgammon/engine/types.ts` — all game types
  - `src/games/backgammon/engine/constants.ts` — board constants + path arrays
  - `src/games/backgammon/engine/pathUtils.ts` — path traversal, pip count, home detection
  - `src/games/backgammon/engine/diceUtils.ts` — dice rolling, expansion, distribution
  - `src/games/backgammon/engine/rules/headRule.ts` — head lifting limit with doubles exception
  - `src/games/backgammon/engine/rules/blockRule.ts` — 6-block detection (3 modes)
  - `src/games/backgammon/engine/rules/bearOffRule.ts` — bear-off eligibility and move validity
  - `src/games/backgammon/engine/moveGenerator.ts` — DFS legal move generation with max-die filter
  - `src/games/backgammon/engine/evaluator.ts` — AI heuristic features
  - `src/games/backgammon/engine/BackgammonEngine.ts` — engine facade (pure functions)
  - 6 test files with 124 tests
- **Tests:** 124 new, all green. Total: 182/182
- **Notes:** Build PASS, Lint PASS, Tests 182/182 PASS

## [2026-04-26] — Backgammon Sprint 3: Dice Cup + Turn Flow
- **Status:** COMPLETED
- **What:** DicePip, Dice3D, DiceCup (interactive physics cup), DiceRoller, AnimatedStone, store Sprint 3 actions (rollDice, onDiceSettled, executeSubMove, undoLastSubMove, confirmTurn, resign), BackgammonPage functional UI (roll/confirm/undo/end-game), BackgammonScene click-to-move wiring with legal destination computation
- **Files created:**
  - `src/games/backgammon/components/scene/DicePip.tsx` — pip dot patterns on die faces
  - `src/games/backgammon/components/scene/Dice3D.tsx` — Rapier RigidBody physics die with 6-face pips
  - `src/games/backgammon/components/scene/DiceCup.tsx` — interactive leather cup (grab/shake/flip/settle/read)
  - `src/games/backgammon/components/scene/DiceRoller.tsx` — Physics world orchestrator (board + tray colliders)
  - `src/games/backgammon/components/scene/AnimatedStone.tsx` — lerp + parabolic-arc stone animation
- **Files modified:**
  - `src/games/backgammon/stores/useBackgammonStore.ts` — replaced 5 stubs with full Sprint 3 implementations
  - `src/games/backgammon/components/scene/BackgammonScene.tsx` — DiceRoller wired, click-to-move with legal dest computation
  - `src/pages/BackgammonPage.tsx` — functional UI overlay (status chip, roll/confirm/undo/end-game buttons)
  - `src/core/i18n/translations.ts` — 14 new backgammon UI keys (EN+RU)
- **Gates:** Build ✅ Lint ✅ Tests 182/182 ✅
