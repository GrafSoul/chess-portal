import { useState } from 'react';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { BoardSize, Move } from '../../engine/types';
import { formatMove } from '../../utils/moveFormat';

/**
 * Props for {@link GoMoveHistory}.
 *
 * The component is rendered only when there is at least one move in the
 * history — the parent should conditionally mount it (`moves.length > 0`).
 */
export interface GoMoveHistoryProps {
  /** Ordered list of moves played so far. First move is Black. */
  moves: Move[];
  /** Board dimension — needed so {@link formatMove} can invert the y-axis. */
  boardSize: BoardSize;
}

/**
 * Renders the flow of formatted move entries.
 *
 * Extracted so both the always-visible desktop sidebar and the mobile
 * collapsible panel can share exactly the same presentation logic.
 */
function MoveFlow({ moves, boardSize }: GoMoveHistoryProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-0.5">
      {moves.map((m, i) => (
        <span
          key={i}
          className={`text-[11px] font-mono ${
            m.kind === 'pass'
              ? 'text-amber-400'
              : m.kind === 'resign'
                ? 'text-rose-400'
                : i % 2 === 0
                  ? 'text-text-primary'
                  : 'text-text-secondary'
          }`}
        >
          {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}
          {formatMove(m, t, boardSize)}
        </span>
      ))}
    </div>
  );
}

/**
 * Right-hand move-history sidebar (desktop) / collapsible button + panel (mobile).
 *
 * Behaviour per breakpoint:
 * - **md and up (≥768px)** — permanently mounted sidebar pinned to the top-right
 *   corner, scrollable when the history grows long.
 * - **Below md (<768px)** — a compact "N moves" pill at the top-right. Tapping
 *   it toggles a small panel showing the full history; tapping again closes it.
 *   The pill keeps the move count always visible without eating board real
 *   estate.
 *
 * Pass and resign entries are highlighted in amber/rose so they stand out in
 * the compact flow layout. Move numbers (`1.`, `2.`, …) prefix every second
 * entry (Black's move) so it is easy to scan.
 *
 * @param props - See {@link GoMoveHistoryProps}.
 *
 * @example
 * ```tsx
 * {moveHistory.length > 0 && (
 *   <GoMoveHistory moves={moveHistory} boardSize={boardSize} />
 * )}
 * ```
 */
export function GoMoveHistory({ moves, boardSize }: GoMoveHistoryProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <div className="hidden md:block absolute top-16 right-4 pointer-events-auto">
        <div
          className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-3 py-2.5 shadow-md max-h-60 overflow-y-auto w-36"
        >
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
            {moves.length} {t('go.moves')}
          </div>
          <MoveFlow moves={moves} boardSize={boardSize} />
        </div>
      </div>

      {/* Mobile: compact toggle pill */}
      <div className="md:hidden absolute top-14 right-2 pointer-events-auto flex flex-col items-end gap-1.5">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="bg-bg-primary/80 backdrop-blur-lg border border-border-subtle rounded-full
            px-2.5 py-1 text-[10px] text-text-secondary hover:text-text-primary
            transition-colors shadow-md"
          aria-expanded={mobileOpen}
          aria-label={t('go.moves')}
        >
          {moves.length} {t('go.moves')}
        </button>
        {mobileOpen && (
          <div
            className="bg-bg-primary/85 backdrop-blur-lg border border-border-subtle rounded-lg
              px-3 py-2.5 shadow-md max-h-48 overflow-y-auto w-44"
          >
            <MoveFlow moves={moves} boardSize={boardSize} />
          </div>
        )}
      </div>
    </>
  );
}
