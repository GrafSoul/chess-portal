import { useEffect } from 'react';

/**
 * Attaches an Escape-key handler that invokes `onClose` while `isOpen` is `true`.
 *
 * Shared across all game overlay panels and modals (settings, end-game dialog,
 * rules panels). Extracted here so individual components do not re-implement
 * the same `useEffect` boilerplate.
 *
 * Implementation notes:
 * - Listener is registered on `window` with `keydown` so it fires regardless
 *   of which element currently holds focus.
 * - The cleanup function runs automatically when `isOpen` flips to `false` or
 *   when the component unmounts, preventing stale listeners.
 * - Callers should wrap `onClose` in `useCallback` for stable identity.
 *
 * @param isOpen  - Whether the dialog / panel is currently mounted and visible.
 * @param onClose - Callback invoked when the Escape key is pressed while open.
 *
 * @example
 * ```tsx
 * const handleClose = useCallback(() => setOpen(false), []);
 * useEscapeClose(open, handleClose);
 * ```
 */
export function useEscapeClose(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
}
