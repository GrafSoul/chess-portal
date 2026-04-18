import { useEffect } from 'react';

/**
 * Attach a one-shot Escape-key handler that invokes `onClose` when the
 * `isOpen` flag is `true`.
 *
 * Used by Go overlay panels and modals (settings, rules, end-game dialog,
 * scoring panel) to provide the expected keyboard dismissal without each
 * component re-implementing the same effect.
 *
 * Implementation notes:
 * - The listener is registered on `window` with `keydown` so it catches the
 *   event regardless of which element has focus.
 * - When `isOpen` flips to `false`, the effect cleans up automatically and
 *   the dependency array ensures a stable identity for `onClose` is required
 *   (prefer `useCallback` in the caller for predictable behaviour).
 * - The handler listens only for `'Escape'`; other keys are ignored.
 *
 * @param isOpen - Whether the dialog/panel is currently open.
 * @param onClose - Handler invoked when the Escape key is pressed while open.
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
