import { describe, it, expect, beforeEach } from 'vitest';
import { useGoStore } from '../useGoStore';

/**
 * Regression test for the AI move bug.
 *
 * Root cause: `playAt` has a guard `if (state.isAIThinking) return false`,
 * which rejected the AI's own stone placement because `isAIThinking` was
 * still `true` when the AI hook called `playAt` after receiving the worker
 * result. The fix is to call `setAIThinking(false)` before `playAt`.
 *
 * This test verifies that the store correctly rejects moves while
 * `isAIThinking` is true and accepts them once it is cleared.
 */
describe('useGoStore — AI move guard (isAIThinking)', () => {
  beforeEach(() => {
    useGoStore.getState().resetGame();
  });

  it('rejects playAt while isAIThinking is true', () => {
    const store = useGoStore.getState();
    store.setAIThinking(true);

    const result = store.playAt({ x: 4, y: 4 });

    expect(result).toBe(false);
    expect(useGoStore.getState().board[4][4]).toBeNull();
  });

  it('accepts playAt after isAIThinking is cleared (simulates correct AI flow)', () => {
    const store = useGoStore.getState();

    // Simulate AI flow: set thinking, then clear BEFORE playing
    store.setAIThinking(true);
    store.setAIThinking(false);

    const result = store.playAt({ x: 4, y: 4 });

    expect(result).toBe(true);
    expect(useGoStore.getState().board[4][4]).toBe('b');
  });

  it('rejects pass while isAIThinking is true', () => {
    const store = useGoStore.getState();
    store.setAIThinking(true);

    store.pass();

    // Pass should have been rejected — passCount should remain 0
    expect(useGoStore.getState().passCount).toBe(0);
  });

  it('accepts pass after isAIThinking is cleared', () => {
    const store = useGoStore.getState();
    store.setAIThinking(true);
    store.setAIThinking(false);

    store.pass();

    expect(useGoStore.getState().passCount).toBe(1);
  });
});
