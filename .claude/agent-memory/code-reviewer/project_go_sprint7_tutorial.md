---
name: Go Sprint 7 tutorial review
description: Tutorial/rules panel review — malformed group row, invalid capture/ko positions, snapKey unused, placeStone race on chapter switch
type: project
---

Sprint 7 added Go tutorial system: board notation parser, 10 chapters, tutorial store, loop animation hook, 3D overlay, and slide-in rules panel.

Critical findings:
1. Groups chapter (ch5) notation `3bb5` parses to **10 cells** in a 9-wide board — off-by-one in author's run-length. Fix: `3bb4`.
2. Capture chapter (ch4) shows white at (4,4) with zero liberties on the initial board (already-captured, illegal position). Loop then "captures" by playing at (4,2) which isn't adjacent. Teaches a wrong capture rule.
3. Ko chapter (ch6) board has no empty point in the ko formation — every intersection is occupied, so there is nothing to recapture.
4. Suicide chapter (ch7) surrounds empty (4,4) with four **black** stones, but the red arrows imply black is the one prevented — actual suicide is for white in that formation.
5. `snapKey` in tutorial store is defined/incremented but GoStoneSet keys stones by `"x,y,color"` only — never consumed. Dead code; snap resets can still animate.

High findings:
6. `placeStone` is async with setTimeout; cancellation token is NOT threaded into it. In-flight capture writes can overwrite a freshly-switched chapter's board. Fix: pass `shouldCancel` into placeStone, re-check after each await.

Medium findings:
7. `GoRulesPanel` chapter-apply useEffect calls `setBoard(chapter.boardNotation)`, then `useGoTutorialLoop` immediately `snapBoard(loop.boardNotation)` — double write each chapter switch. Skip setBoard when chapter.loop exists.
8. ArrowMesh useMemo depends on Point object references (fragile but safe with current constant data) — prefer scalar deps.
9. `parseGoBoard` silently ignores unknown chars and doesn't verify row length — would have caught bug #1 at parse time.
10. GoRulesPanel enter/exit useEffect uses eslint-disable + only [isOpen] — doesn't run cleanup on unmount while open; leaks tutorial mode on route change.
11. Module header in `useGoDisplayedBoardState.ts` still says "Sprint 2 ... tutorial layer does not yet exist" — stale.

**Why:** Chapters 4/5/6 teach incorrect Go rules. The placeStone race can desync the board during rapid chapter switching. Tutorial-mode leak on unmount breaks the game board after closing the panel via navigation.
**How to apply:** When reviewing future tutorial chapters, (a) verify EVERY row of board notation sums to boardSize, (b) verify stones have valid liberty counts (nothing already-captured), (c) verify the "rule violation" arrow actually points at a legal next move for the specified color, (d) ensure every async animation primitive accepts a cancellation signal that is re-checked after every await.
