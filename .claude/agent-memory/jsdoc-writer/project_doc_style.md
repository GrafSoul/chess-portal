---
name: Project documentation style
description: JSDoc conventions established in chess-portal Go Sprint 4 files
type: project
---

All JSDoc in this project is written in **English**, even though the owner communicates in Russian.

## Established patterns

**Worker files (self-contained, no exports):**
- File-level doc describes protocol (message shapes in/out) and algorithm overview.
- Key internal functions get JSDoc with @param lines.
- The `self.onmessage` handler gets a JSDoc listing reply message shapes.
- Inline `// comment` on non-obvious logic blocks (board traversal, ko detection, MCTS phases).

**Service classes:**
- Class-level JSDoc includes lifecycle steps (numbered list) and a full usage `@example`.
- Every public method: @param, @returns, @throws for all distinct error messages, @example.
- Private arrow-function methods (event handlers): JSDoc describing dispatch logic, no @param/@returns needed.

**Zustand stores (persist middleware):**
- File-level doc names the localStorage key and mirrors relationship.
- Internal State interface: per-field docs explain edge cases and units (not just "the X").
- Internal Actions interface: per-setter docs note timing (immediate vs. next game).
- Exported store constant: @returns naming the combined type, @example showing selector, action, and shallow pattern.

**Hooks (useGoAI, useGoGame):**
- useGoAI: side-effect-only hook — @returns `void`, @example shows mount context.
- useGoGame: facade hook — @returns lists ALL returned fields in two groups (State / Actions), @example shows destructuring in a component.
- Both document subsystems activated on mount.

**Why:**
- `@throws` must enumerate every distinct error message string for async methods.
- `@example` on every export is mandatory; examples must be syntactically correct.
