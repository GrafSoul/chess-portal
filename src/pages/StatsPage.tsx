import { motion } from 'framer-motion';

const stats = [
  { label: 'Played', value: '0', borderColor: 'border-t-text-muted' },
  { label: 'Wins', value: '0', borderColor: 'border-t-success', valueColor: 'text-success' },
  { label: 'Losses', value: '0', borderColor: 'border-t-danger', valueColor: 'text-danger' },
  { label: 'Draws', value: '0', borderColor: 'border-t-warning', valueColor: 'text-warning' },
];

/** Statistics page */
export function StatsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-12 overflow-auto">
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
        <h1 className="text-2xl font-bold text-text-primary mb-1.5">Statistics</h1>
        <p className="text-sm text-text-secondary">Track your performance across all games</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
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
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      <motion.p
        className="text-xs text-text-muted text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Play your first game to start tracking statistics.
      </motion.p>
    </div>
  );
}
