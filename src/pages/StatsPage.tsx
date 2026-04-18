/**
 * Statistics page — shows aggregated counts and a history list of recently
 * finished games, separated by game type.
 *
 * Each game (Chess / Checkers / Go) has its own persistent stats store and
 * the page exposes a tab selector to switch between them. Summary counts and
 * recent-game lists are derived from the currently-selected game's store.
 *
 * Records from different stores have different shapes (end reasons, plus
 * Go carries board size and margin); the page normalises each into a
 * common display shape via per-game adapters.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  useChessStatsStore,
  selectStatsSummary as selectChessSummary,
  type GameOutcome,
} from '../games/chess/stores/useChessStatsStore';
import {
  useCheckersStatsStore,
  selectStatsSummary as selectCheckersSummary,
} from '../games/checkers/stores/useCheckersStatsStore';
import {
  useGoStatsStore,
  selectGoStatsSummary,
} from '../games/go/stores/useGoStatsStore';
import { useTranslation } from '../core/i18n/useTranslation';

/** Identifier of which game's stats are shown. */
type StatsTab = 'chess' | 'checkers' | 'go';

/** Normalized record used by the shared `HistoryRow` renderer. */
interface NormalizedRecord {
  id: string;
  finishedAt: number;
  mode: 'ai' | 'local';
  outcome: GameOutcome | null;
  endReasonKey: string;
  moveCount: number;
  durationMs: number;
  /** Optional game-specific badge (e.g. Go board size). */
  badge?: string;
}

/** Common summary shape displayed in the top grid. */
interface SummaryCounts {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

/** Tailwind class for an outcome label color. */
function outcomeColor(outcome: GameOutcome | null): string {
  switch (outcome) {
    case 'win':
      return 'text-success';
    case 'loss':
      return 'text-danger';
    case 'draw':
      return 'text-warning';
    default:
      return 'text-text-muted';
  }
}

/** Format a duration in `mm:ss` (or `h:mm:ss` for >1 h). */
function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Format a finished-at timestamp in the user's locale. */
function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** i18n key for a chess end reason. */
const CHESS_END_REASON_KEYS: Record<string, string> = {
  checkmate: 'stats.endCheckmate',
  stalemate: 'stats.endStalemate',
  draw: 'stats.endDraw',
  resigned: 'stats.endResigned',
  timeout: 'stats.endTimeout',
};

/** i18n key for a checkers end reason. */
const CHECKERS_END_REASON_KEYS: Record<string, string> = {
  no_moves: 'stats.endNoMoves',
  draw: 'stats.endDraw',
  resigned: 'stats.endResigned',
  timeout: 'stats.endTimeout',
};

/** i18n key for a Go end reason. */
const GO_END_REASON_KEYS: Record<string, string> = {
  passed: 'stats.endPassed',
  resigned: 'stats.endResigned',
  timeout: 'stats.endTimeout',
};

/**
 * Statistics page with per-game tabs. Each tab reads its own persisted
 * stats store and shows an independent summary + history list.
 */
export function StatsPage() {
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState<StatsTab>('chess');

  // Subscribe to every game's history up-front — Zustand selectors keep each
  // subscription cheap and this lets tab counts display without remounting.
  const chessHistory = useChessStatsStore((s) => s.gameHistory);
  const clearChess = useChessStatsStore((s) => s.clearStats);
  const checkersHistory = useCheckersStatsStore((s) => s.gameHistory);
  const clearCheckers = useCheckersStatsStore((s) => s.clearStats);
  const goHistory = useGoStatsStore((s) => s.gameHistory);
  const clearGo = useGoStatsStore((s) => s.clearStats);

  const summary: SummaryCounts = useMemo(() => {
    if (tab === 'chess') return selectChessSummary(chessHistory);
    if (tab === 'checkers') return selectCheckersSummary(checkersHistory);
    return selectGoStatsSummary(goHistory);
  }, [tab, chessHistory, checkersHistory, goHistory]);

  // Map the active tab's store into the shared display shape.
  const records: NormalizedRecord[] = useMemo(() => {
    if (tab === 'chess') {
      return chessHistory.map((r) => ({
        id: r.id,
        finishedAt: r.finishedAt,
        mode: r.mode,
        outcome: r.outcome,
        endReasonKey: CHESS_END_REASON_KEYS[r.endReason] ?? 'stats.endDraw',
        moveCount: r.moveCount,
        durationMs: r.durationMs,
      }));
    }
    if (tab === 'checkers') {
      return checkersHistory.map((r) => ({
        id: r.id,
        finishedAt: r.finishedAt,
        mode: r.mode,
        outcome: r.outcome,
        endReasonKey: CHECKERS_END_REASON_KEYS[r.endReason] ?? 'stats.endDraw',
        moveCount: r.moveCount,
        durationMs: r.durationMs,
      }));
    }
    return goHistory.map((r) => ({
      id: r.id,
      finishedAt: r.finishedAt,
      mode: r.mode,
      outcome: r.outcome,
      endReasonKey: GO_END_REASON_KEYS[r.endReason] ?? 'stats.endDraw',
      moveCount: r.moveCount,
      durationMs: r.durationMs,
      badge: `${r.boardSize}×${r.boardSize}${r.margin > 0 ? ` · +${r.margin}` : ''}`,
    }));
  }, [tab, chessHistory, checkersHistory, goHistory]);

  const stats = [
    { labelKey: 'stats.played', value: summary.played, borderColor: 'border-t-text-muted' },
    { labelKey: 'stats.wins', value: summary.wins, borderColor: 'border-t-success', valueColor: 'text-success' },
    { labelKey: 'stats.losses', value: summary.losses, borderColor: 'border-t-danger', valueColor: 'text-danger' },
    { labelKey: 'stats.draws', value: summary.draws, borderColor: 'border-t-warning', valueColor: 'text-warning' },
  ];

  const handleClear = () => {
    if (!window.confirm(t('stats.confirmClear'))) return;
    if (tab === 'chess') clearChess();
    else if (tab === 'checkers') clearCheckers();
    else clearGo();
  };

  const tabs: { id: StatsTab; labelKey: string }[] = [
    { id: 'chess', labelKey: 'stats.tabChess' },
    { id: 'checkers', labelKey: 'stats.tabCheckers' },
    { id: 'go', labelKey: 'stats.tabGo' },
  ];

  return (
    <div className="h-full flex flex-col items-center px-8 py-12 overflow-auto">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <svg
          width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="mx-auto mb-4 text-accent"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <h1 className="text-2xl font-bold text-text-primary mb-1.5">{t('stats.title')}</h1>
        <p className="text-sm text-text-secondary">{t('stats.subtitle')}</p>
      </motion.div>

      {/* Tab selector */}
      <div
        role="tablist"
        className="w-full max-w-md mb-6 grid grid-cols-3 gap-1 p-1 bg-bg-card border border-border-primary rounded-lg"
      >
        {tabs.map((tabItem) => {
          const active = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tabItem.id)}
              className={`text-xs font-semibold uppercase tracking-[0.1em] py-2 rounded-md transition-colors
                ${active
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-muted hover:text-text-primary'}`}
            >
              {t(tabItem.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={`${tab}-${stat.labelKey}`}
            className={`bg-bg-card border border-border-primary ${stat.borderColor} border-t-2
              rounded-lg p-4 text-center`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + i * 0.04, duration: 0.3 }}
          >
            <div className={`text-2xl font-bold mb-0.5 ${stat.valueColor ?? 'text-text-primary'}`}>
              {stat.value}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-[0.12em] font-medium">
              {t(stat.labelKey)}
            </div>
          </motion.div>
        ))}
      </div>

      {records.length === 0 ? (
        <motion.p
          className="text-xs text-text-muted text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t('stats.empty')}
        </motion.p>
      ) : (
        <motion.div
          key={tab}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[10px] text-text-muted uppercase tracking-[0.12em] font-medium">
              {t('stats.history')}
            </h2>
            <button
              onClick={handleClear}
              className="text-[10px] text-text-muted hover:text-danger transition-colors"
            >
              {t('stats.clear')}
            </button>
          </div>

          <ul className="flex flex-col gap-1.5">
            {records.slice(0, 30).map((rec) => (
              <HistoryRow key={rec.id} record={rec} locale={locale} t={t} />
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

/** Props for {@link HistoryRow}. */
interface HistoryRowProps {
  /** Normalized display record. */
  record: NormalizedRecord;
  /** Current UI locale (for date formatting). */
  locale: string;
  /** Translation function. */
  t: (key: string) => string;
}

/** Single row in the recent-games list. */
function HistoryRow({ record, locale, t }: HistoryRowProps) {
  const outcomeKey =
    record.outcome === 'win'
      ? 'stats.outcomeWin'
      : record.outcome === 'loss'
        ? 'stats.outcomeLoss'
        : record.outcome === 'draw'
          ? 'stats.outcomeDraw'
          : null;

  const modeKey = record.mode === 'ai' ? 'stats.modeAI' : 'stats.modeLocal';

  return (
    <li className="bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 flex items-center
      justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-[12px] font-semibold w-16 ${outcomeColor(record.outcome)}`}>
          {outcomeKey ? t(outcomeKey) : '—'}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-text-secondary truncate">
            {t(modeKey)} · {t(record.endReasonKey)}
            {record.badge ? ` · ${record.badge}` : ''}
          </span>
          <span className="text-[10px] text-text-muted">
            {record.moveCount} {t('stats.movesLabel')} · {formatDuration(record.durationMs)}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-text-muted font-mono whitespace-nowrap">
        {formatDate(record.finishedAt, locale)}
      </span>
    </li>
  );
}
