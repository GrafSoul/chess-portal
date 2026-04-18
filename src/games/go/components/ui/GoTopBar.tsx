import { useTranslation } from '../../../../core/i18n/useTranslation';
import type { BoardSize, GameStatus, Point, Stone } from '../../engine/types';
import { rejectionKey } from '../../utils/moveFormat';
import type { MoveRejectionReason } from '../../engine/types';

/**
 * Props for {@link GoTopBar}.
 *
 * `GoTopBar` is a pure presentational component: all state and actions come
 * from the page-level container ({@link GoPage}). Keeping it stateless means
 * it can be rendered in tests or Storybook without any stores.
 */
export interface GoTopBarProps {
  /** Board dimension — shown as a small `NxN` badge in the status chip. */
  boardSize: BoardSize;
  /** Player to move — drives the coloured dot in the status chip. */
  turn: Stone;
  /** Human-readable status string (turn indicator, "Thinking…", etc.). */
  statusText: string;
  /** Whether there is an active ko. When truthy, a tiny "ko" label is shown. */
  koPoint: Point | null;
  /** Number of moves in the current game — controls the undo button state. */
  moveCount: number;
  /** Number of consecutive passes so far (0–2). Drives the pass-button label. */
  passCount: number;
  /** Current engine status — disables actions when ended or in scoring. */
  gameStatus: GameStatus;
  /** `true` while the AI is computing — disables all turn-changing actions. */
  isAIThinking: boolean;
  /** Latest move rejection, or `null` when the last move was accepted. */
  lastRejection: MoveRejectionReason | null;
  /** Undo handler. */
  onUndo: () => void;
  /** Pass handler. */
  onPass: () => void;
  /** Resign handler. */
  onResign: () => void;
  /** New-game handler. */
  onNewGame: () => void;
  /** Opens the rules / tutorial panel. */
  onOpenRules: () => void;
  /** Opens the settings panel. */
  onOpenSettings: () => void;
}

/**
 * Top bar of the Go page: status chip on the left, action buttons on the right.
 *
 * Shows:
 * - The player-to-move indicator (coloured dot + text),
 * - Current board size (small badge),
 * - A tiny "ko" tag when a ko rule is active,
 * - Undo / Pass / Resign / New-game buttons,
 * - Rules and Settings icon buttons,
 * - A transient rejection banner below when the last move was illegal.
 *
 * All buttons are disabled appropriately based on the current game status so
 * callers don't need to gate actions themselves.
 *
 * @param props - See {@link GoTopBarProps}.
 *
 * @example
 * ```tsx
 * <GoTopBar
 *   boardSize={19}
 *   turn="b"
 *   statusText="Black to move"
 *   koPoint={null}
 *   moveCount={12}
 *   passCount={0}
 *   gameStatus="playing"
 *   isAIThinking={false}
 *   lastRejection={null}
 *   onUndo={undoMove}
 *   onPass={pass}
 *   onResign={resign}
 *   onNewGame={resetGame}
 *   onOpenRules={() => setRulesOpen(true)}
 *   onOpenSettings={() => setSettingsOpen(true)}
 * />
 * ```
 */
export function GoTopBar({
  boardSize,
  turn,
  statusText,
  koPoint,
  moveCount,
  passCount,
  gameStatus,
  isAIThinking,
  lastRejection,
  onUndo,
  onPass,
  onResign,
  onNewGame,
  onOpenRules,
  onOpenSettings,
}: GoTopBarProps) {
  const { t } = useTranslation();
  const isFinished = gameStatus === 'ended';
  const isScoring = gameStatus === 'scoring';
  const isPlaying = gameStatus === 'idle' || gameStatus === 'playing';
  const rejectKey = rejectionKey(lastRejection);

  const chipClass =
    'bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg ' +
    'px-2.5 md:px-3 py-2 text-[11px] md:text-[12px] text-text-secondary hover:text-text-primary ' +
    'hover:bg-bg-hover/70 transition-colors disabled:opacity-30 disabled:pointer-events-none ' +
    'inline-flex items-center gap-1';
  const iconBtnClass =
    'bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg ' +
    'p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover/70 transition-colors';
  // Utility: hide text below md, keep icon always visible.
  const textOnDesktop = 'hidden md:inline';

  return (
    <div className="absolute top-0 left-0 right-0 p-2 md:p-4 pointer-events-none">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        {/* Status chip */}
        <div
          className="bg-bg-primary/70 backdrop-blur-lg border border-border-subtle rounded-lg
            px-2.5 md:px-4 py-2 md:py-2.5 pointer-events-auto shadow-md min-w-0"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <span
              className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                turn === 'b'
                  ? 'bg-zinc-900 ring-1 ring-white/20'
                  : 'bg-zinc-100'
              }`}
            />
            <span className="text-[12px] md:text-[13px] font-medium text-text-primary truncate">
              {statusText}
            </span>
            <span className="hidden sm:inline text-[11px] text-text-muted flex-shrink-0">
              {boardSize}x{boardSize}
            </span>
            {koPoint && (
              <span
                className="text-[10px] uppercase tracking-wider text-amber-300 flex-shrink-0"
                title={t('go.koActive')}
              >
                ko
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
          <button
            onClick={onUndo}
            disabled={moveCount === 0 || !isPlaying || isAIThinking}
            className={chipClass}
            aria-label={t('go.undo')}
            title={t('go.undo')}
          >
            {/* Undo arrow icon */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h7a3 3 0 010 6H7M3 8l3-3M3 8l3 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={textOnDesktop}>{t('go.undo')}</span>
          </button>
          <button
            onClick={onPass}
            disabled={isFinished || isScoring || isAIThinking}
            title={passCount === 1 ? t('go.passOneLeft') : t('go.pass')}
            className={chipClass}
            aria-label={t('go.pass')}
          >
            {/* Pass: three dots */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="8" r="1.3" />
              <circle cx="8" cy="8" r="1.3" />
              <circle cx="13" cy="8" r="1.3" />
            </svg>
            <span className={textOnDesktop}>
              {t('go.pass')}
              {passCount === 1 ? ' · 1' : ''}
            </span>
            {passCount === 1 && (
              <span className="md:hidden text-[10px] text-amber-300">·1</span>
            )}
          </button>
          <button
            onClick={onResign}
            disabled={isFinished || isAIThinking || isScoring}
            className={chipClass}
            aria-label={t('go.resign')}
            title={t('go.resign')}
          >
            {/* Resign: flag */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 14V2.5M3 3h8l-1.5 2.5L11 8H3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={textOnDesktop}>{t('go.resign')}</span>
          </button>
          <button
            onClick={onNewGame}
            className={chipClass}
            aria-label={t('go.newGame')}
            title={t('go.newGame')}
          >
            {/* New game: refresh */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 2v3h-3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={textOnDesktop}>{t('go.newGame')}</span>
          </button>
          {/* Rules / tutorial */}
          <button
            onClick={onOpenRules}
            className={iconBtnClass}
            aria-label={t('goRules.title')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M6 6a2 2 0 113 1.7c-.4.3-.7.6-.7 1.1V9.5M8 11.5v.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* Settings gear — Heroicons Cog6Tooth */}
          <button
            onClick={onOpenSettings}
            className={iconBtnClass}
            aria-label={t('settings.openSettings')}
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
            >
              <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rejection banner */}
      {rejectKey && (
        <div className="mt-2 flex justify-center pointer-events-none">
          <span
            className="bg-rose-900/70 border border-rose-700/60 text-rose-100
              text-xs px-3 py-1 rounded-md shadow-md"
          >
            {t(rejectKey)}
          </span>
        </div>
      )}
    </div>
  );
}
