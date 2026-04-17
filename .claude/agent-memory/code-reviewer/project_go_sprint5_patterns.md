---
name: Go game Sprint 5 patterns
description: Go game UI/UX patterns, known issues, and architectural decisions from Sprint 5 review
type: project
---

Go game Sprint 5 added player cards, move history, settings panel, scoring overlay, and game-over modal.

Key architectural finding: `gameMode` lives on `useGoStore` (not persisted), while all other settings (boardSize, scoringRules, aiLevel, playerColor, sound) live on `useGoSettingsStore` (persisted). This split is inconsistent and fragile.

Known issue: `undoMove` in AI mode always undoes 2 moves. The "resume from scoring" feature calls `undoMove` which over-undoes. Needs a dedicated single-undo action for scoring resume.

Known issue: `formatMove` uses `point.y + 1` but the Point type says y=0 is topmost. Standard Go notation numbers from bottom. Verify engine coordinate convention.

**Why:** These issues affect game logic correctness and data integrity during scoring phase.
**How to apply:** When reviewing future Go sprints, check undo behavior in scoring context and coordinate system consistency.
