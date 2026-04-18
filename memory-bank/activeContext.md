# Active Context

## Current Focus
[2026-04-18] — Go is now feature-complete with per-game stats and a working clock. Open tech debt: Go AI engine replacement (hand-written MCTS is weak, amateur plays near-random on 19×19), settings gear icon in GoTopBar uses a fill-only Heroicon rendered as stroke (looks broken — needs replacement). See analysis in chat for full details.

## Recent Changes
- [2026-04-17] — Go Sprint 1: Engine (GoEngine, types, scoring, groupUtils, 54 tests)
- [2026-04-17] — Go Sprint 2: 3D MVP (scene, store, page, routing, stones, board, camera)
- [2026-04-17] — Go Sprint 3: Captures animation (FadingGoStone), ko visual, sounds (GoSoundService), scoring flow
- [2026-04-17] — Go Sprint 4: MCTS AI in Web Worker (goWorker.ts, GoAIService.ts, useGoAI.ts, useGoSettingsStore.ts). Code review: fixed getLegalMoveKeys false-negative bug (slow-path fallback), added eye-filling avoidance in playouts, added MCTS tree GC cleanup.
- [2026-04-17] — Go Sprint 5: UI/UX (GoPlayerCard, GoSettingsPanel, GoPage rewrite with top bar, player cards, move history, settings panel)
- [2026-04-17] — Go Sprint 6: Scoring UI with dead stone marking (toggleDeadStone toggles entire groups), territory visualization (small squares on board), reactive score breakdown. Code review: fixed scoring overlay blocking board clicks (moved to side panel), disabled resign during scoring.
- [2026-04-17] — AI bug fix: setAIThinking(false) moved before playAt()/pass() to prevent guard rejecting AI's own moves.
- [2026-04-18] — Go Sprint 7: Full interactive tutorial. boardNotation.ts (compact notation parser), tutorialChapters.ts (10 chapters: board, placing, liberties, capture, groups, ko, suicide, territory, scoring, strategy), useGoTutorialStore (Zustand, async placeStone), useGoTutorialLoop (async cancellation-token loop), GoTutorialOverlay (3D circles + arrows), GoRulesPanel (Framer Motion slide-in, chapter nav, progress dots). Build ✅ Lint ✅ Tests 58/58 ✅.
- [2026-04-18] — Go AI tactical fix: added root pre-search to `goWorker.ts` — `findBestCapture` (largest single-ply capture) + `findBestSave` (rescue own group to ≥2 liberties). Runs BEFORE MCTS; if found, returned immediately. Fixes "amateur plays random on 19×19" where 1500 playouts / 360 root moves gave ~4 visits each (statistical noise). Also tightened time-budget check from every-64 to every-16 iterations (max overshoot 10s → 1–3s). Build ✅ Lint ✅ Tests 58/58 ✅.
- [2026-04-18] — Go stats + clock: (1) `useGoStatsStore.ts` — per-game persistent history (`go-stats` key), `GoGameRecord` with boardSize/scoringRules/margin/endReason, helpers `selectGoStatsSummary`, `computeGoOutcome`, `isGoTerminalStatus`. (2) `useGoGame` now records on `ended` status, distinguishes `passed`/`resigned`/`timeout` via last move + clock state. (3) `GoClockManager` — standard + byo-yomi + unlimited; tick interval 100ms; timeout auto-resigns the loser. (4) `useGoClock` hook — owns lifecycle, drives `updateClockState` in store. (5) `GoPlayerCard` gets `clock?` prop, renders mono-font badge with amber byo-yomi + red ≤10s. (6) `GoSettingsPanel` gets clock-preset picker (7 presets). (7) Fixed default `clockPreset: 'none'` → `DEFAULT_GO_CLOCK_PRESET` (`byoyomi-standard`). Build ✅ Lint ✅ Tests 58/58 ✅.
- [2026-04-18] — Go Sprint 8 (Polish): (1) Last-move highlight confirmed already present. (2) Hover stone preview — new `GoHoverPreview.tsx`, hover callbacks on `GoIntersection/GoBoard`, `hoveredPoint` state in `GoScene` with empty/ko/tutorial guards. (3) Refactored GoPage 546→222 lines: extracted `GoTopBar`, `GoMoveHistory`, `GoScoringPanel`, `GoEndGameDialog`, shared `utils/moveFormat.ts`. (4) Mobile responsive: icon-only buttons below md:, collapsible move history, smaller player cards on mobile. (5) Accessibility: `useEscapeClose` hook, `role="dialog"` + `aria-modal` + `aria-labelledby` on all modals, `aria-live="polite"` on status chip. (6) React.memo on GoStone, GoStoneSet, GoIntersection (361 instances on 19×19), GoBoard, GoHoverPreview, GoPlayerCard. Build ✅ Lint ✅ Tests 58/58 ✅.

## Open Questions
- None currently

## Blockers
- None
