/**
 * Top bar for the Backgammon game page.
 *
 * Mirrors the layout of `GoTopBar`:
 * - **Left** — status chip: player-to-move dot, status text, remaining-dice badges.
 * - **Right** — conditional action buttons (Roll / Confirm / Undo) + permanent
 *   Resign, New Game, Rules, and Settings icon buttons.
 *
 * All state is passed via props from `BackgammonPage`; this component is
 * intentionally stateless and pure so it is safe to memoize.
 *
 * @example
 * ```tsx
 * <BackgammonTopBar
 *   statusText="Your turn"
 *   dice={dice}
 *   turn="w"
 *   gameStatus="choosing"
 *   isAIThinking={false}
 *   showRoll={false}
 *   showConfirm={true}
 *   showUndo={true}
 *   onRoll={rollDice}
 *   onConfirm={confirmTurn}
 *   onUndo={undoLastSubMove}
 *   onResign={resign}
 *   onNewGame={resetGame}
 *   onOpenRules={() => setRulesOpen(true)}
 *   onOpenSettings={() => setSettingsOpen(true)}
 * />
 * ```
 */

import { memo } from 'react';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { GameStatus, DiceRoll, StoneColor } from '../../engine/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link BackgammonTopBar}. */
export interface BackgammonTopBarProps {
  /** Human-readable status text shown in the chip (turn indicator, "Thinking…", etc.). */
  statusText: string;
  /** Current dice roll with remaining values, or `null` before the first roll. */
  dice: DiceRoll | null;
  /** The color whose turn it currently is — drives the dot color in the chip. */
  turn: StoneColor;
  /** Game lifecycle phase — controls which buttons are enabled. */
  gameStatus: GameStatus;
  /** `true` while the AI worker is computing; disables all interactive buttons. */
  isAIThinking: boolean;
  /** Whether to show the Roll Dice button (derived in the page container). */
  showRoll: boolean;
  /** Whether to show the Confirm Move button (derived in the page container). */
  showConfirm: boolean;
  /** Whether to show the Undo sub-move button (derived in the page container). */
  showUndo: boolean;
  /** Trigger a dice roll. */
  onRoll: () => void;
  /** Commit the pending move sequence. */
  onConfirm: () => void;
  /** Undo the last pending sub-move. */
  onUndo: () => void;
  /** Resign the current game. */
  onResign: () => void;
  /** Start a new game. */
  onNewGame: () => void;
  /** Open the rules / tutorial panel. */
  onOpenRules: () => void;
  /** Open the settings slide-in panel. */
  onOpenSettings: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Stateless top bar for the Backgammon game — status chip + action buttons.
 *
 * Renders a full-width row pinned to the top of the game overlay. The status
 * chip on the left shows the stone-color dot, current status text, and remaining
 * dice values as small numbered badges. The right side holds contextual action
 * buttons whose visibility is controlled by the `showRoll`, `showConfirm`, and
 * `showUndo` props.
 *
 * @param props - See {@link BackgammonTopBarProps}.
 * @returns The rendered top bar element.
 */
export const BackgammonTopBar = memo(function BackgammonTopBar({
  statusText,
  dice,
  turn,
  gameStatus,
  isAIThinking,
  showRoll,
  showConfirm,
  showUndo,
  onRoll,
  onConfirm,
  onUndo,
  onResign,
  onNewGame,
  onOpenRules,
  onOpenSettings,
}: BackgammonTopBarProps) {
  const { t } = useTranslation();

  const isFinished = gameStatus === 'ended';

  // Shared button class strings — mirrors GoTopBar for visual consistency.
  const chipClass =
    'bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg ' +
    'px-2.5 md:px-3 py-2 text-[11px] md:text-[12px] text-text-secondary ' +
    'hover:text-text-primary hover:bg-bg-hover/70 transition-colors ' +
    'disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5 cursor-pointer';

  const iconBtnClass =
    'bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg ' +
    'p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover/70 transition-colors cursor-pointer';

  // Text labels hidden on small screens — icon stays visible.
  const textOnDesktop = 'hidden md:inline';

  return (
    <div className="absolute top-0 left-0 right-0 p-2 md:p-4 pointer-events-none">
      <div className="flex items-center justify-between gap-2 md:gap-3">

        {/* ── Status chip (left) ───────────────────────────────────────────── */}
        <div
          className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-2.5 md:px-4 py-2 md:py-2.5 pointer-events-auto shadow-md min-w-0"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Stone-color dot */}
            <span
              className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                turn === 'b'
                  ? 'bg-zinc-900 ring-1 ring-white/20'
                  : 'bg-zinc-100 ring-1 ring-zinc-400'
              }`}
            />
            {/* Status label */}
            <span className="text-[12px] md:text-[13px] font-medium text-text-primary truncate">
              {statusText}
            </span>
            {/* Remaining dice badges — hidden when no dice are active */}
            {dice && dice.remaining.length > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {dice.remaining.map((val, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center justify-center
                      w-5 h-5 md:w-6 md:h-6 rounded
                      bg-white/90 text-zinc-900 text-[10px] md:text-[11px]
                      font-bold shadow-sm select-none"
                  >
                    {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons (right) ───────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">

          {/* Roll dice — shown only when it is the player's turn and dice not yet rolled */}
          {showRoll && (
            <button
              onClick={onRoll}
              className={`${chipClass} !text-accent !border-accent/40 hover:!border-accent/70`}
              aria-label={t('backgammon.roll')}
            >
              {/* Dice icon */}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="5" cy="5" r="1.1" fill="currentColor" />
                <circle cx="8" cy="8" r="1.1" fill="currentColor" />
                <circle cx="11" cy="11" r="1.1" fill="currentColor" />
              </svg>
              <span className={textOnDesktop}>{t('backgammon.roll')}</span>
            </button>
          )}

          {/* Confirm pending sequence */}
          {showConfirm && (
            <button
              onClick={onConfirm}
              className={`${chipClass} !text-green-400 !border-green-500/40 hover:!border-green-500/70`}
              aria-label={t('backgammon.confirm')}
            >
              {/* Checkmark */}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2.5 8.5L6.5 12.5L13.5 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={textOnDesktop}>{t('backgammon.confirm')}</span>
            </button>
          )}

          {/* Undo last sub-move */}
          {showUndo && (
            <button
              onClick={onUndo}
              className={chipClass}
              aria-label={t('backgammon.undo')}
            >
              {/* Undo arrow */}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h7a3 3 0 010 6H7M3 8l3-3M3 8l3 3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={textOnDesktop}>{t('backgammon.undo')}</span>
            </button>
          )}

          {/* Resign */}
          <button
            onClick={onResign}
            disabled={isFinished || isAIThinking}
            className={chipClass}
            aria-label={t('backgammon.resign')}
            title={t('backgammon.resign')}
          >
            {/* Flag icon */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 14V2.5M3 3h8l-1.5 2.5L11 8H3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={textOnDesktop}>{t('backgammon.resign')}</span>
          </button>

          {/* New game */}
          <button
            onClick={onNewGame}
            className={chipClass}
            aria-label={t('backgammon.newGame')}
            title={t('backgammon.newGame')}
          >
            {/* Refresh icon */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 2v3h-3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={textOnDesktop}>{t('backgammon.newGame')}</span>
          </button>

          {/* Rules / info */}
          <button
            onClick={onOpenRules}
            className={iconBtnClass}
            aria-label={t('backgammon.rules')}
            title={t('backgammon.rules')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M6 6a2 2 0 113 1.7c-.4.3-.7.6-.7 1.1V9.5M8 11.5v.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Settings gear — Heroicons Cog6Tooth path */}
          <button
            onClick={onOpenSettings}
            className={iconBtnClass}
            aria-label={t('settings.openSettings')}
            title={t('settings.openSettings')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
