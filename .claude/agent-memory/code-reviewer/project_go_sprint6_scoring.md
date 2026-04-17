---
name: Go game Sprint 6 scoring UI review
description: Dead stone marking, scoring overlay UX bug, resign-during-scoring issue found in Sprint 6
type: project
---

Sprint 6 added dead stone marking during scoring phase: toggleDeadStone action, territory map rendering, scoring breakdown in store.

Critical finding: The scoring overlay in GoPage.tsx uses `absolute inset-0` with `pointer-events-auto`, blocking all clicks to the 3D board below. Users cannot actually click stones to mark them dead despite the hint text. The overlay backdrop needs `pointer-events-none` with only the panel itself interactive.

Secondary finding: Resign button is not disabled during scoring phase -- player could accidentally resign while reviewing score.

The Sprint 5 undo-in-scoring issue was resolved: `undoSingle` now correctly retracts only the second pass.

**Why:** The overlay blocking issue makes the dead stone marking feature non-functional from the user's perspective.
**How to apply:** When reviewing Go UI overlays, always verify that overlays don't block interaction with the 3D canvas when interaction is expected.
