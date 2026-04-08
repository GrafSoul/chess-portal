import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  useChessStatsStore,
  selectStatsSummary,
  type GameRecord,
  type GameEndReason,
  type GameOutcome,
} from '../games/chess/stores/useChessStatsStore';
import { useTranslation } from '../core/i18n/useTranslation';

/** Translation keys for end-of-game reasons. */
const END_REASON_KEYS: Record<GameEndReason, string> = {
  checkmate: 'stats.endCheckmate',
  stalemate: 'stats.endStalemate',
  draw: 'stats.endDraw',
  resigned: 'stats.endResigned',
  timeout: 'stats.endTimeout',
};

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

/**
 * Statistics page — shows aggregated counts and a list of recently finished
 * games. All data is read from `useChessStatsStore`, which is persisted in
 * localStorage and updated by `useChessGame` whenever a game ends.
 */
export function StatsPage() {
  const { t, locale } = useTranslation();
  const gameHistory = useChessStatsStore((s) => s.gameHistory);
  const clearStats = useChessStatsStore((s) => s.clearStats);

  const summary = useMemo(() => selectStatsSummary(gameHistory), [gameHistory]);

  const stats = [
    { labelKey: 'stats.played', value: summary.played, borderColor: 'border-t-text-muted' },
    { labelKey: 'stats.wins', value: summary.wins, borderColor: 'border-t-success', valueColor: 'text-success' },
    { labelKey: 'stats.losses', value: summary.losses, borderColor: 'border-t-danger', valueColor: 'text-danger' },
    { labelKey: 'stats.draws', value: summary.draws, borderColor: 'border-t-warning', valueColor: 'text-warning' },
  ];

  const handleClear = () => {
    if (window.confirm(t('stats.confirmClear'))) clearStats();
  };

  return (
    <div className="h-full flex flex-col items-center px-8 py-12 overflow-auto">
      <motion.div
        className="text-center mb-10"
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.labelKey}
            className={`bg-bg-card border border-border-primary ${stat.borderColor} border-t-2
              rounded-lg p-4 text-center`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
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

      {gameHistory.length === 0 ? (
        <motion.p
          className="text-xs text-text-muted text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('stats.empty')}
        </motion.p>
      ) : (
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
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
            {gameHistory.slice(0, 30).map((rec) => (
              <HistoryRow key={rec.id} record={rec} locale={locale} t={t} />
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

interface HistoryRowProps {
  record: GameRecord;
  locale: string;
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
            {t(modeKey)} · {t(END_REASON_KEYS[record.endReason])}
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
