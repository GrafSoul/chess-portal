import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../core/components/ui';
import { ROUTES } from '../core/types/common';
import { useTranslation } from '../core/i18n/useTranslation';

const games = [
  {
    id: 'chess',
    titleKey: 'home.chess.title',
    descriptionKey: 'home.chess.description',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 16l-1.447.724a1 1 0 0 0-.553.894V20h12v-2.382a1 1 0 0 0-.553-.894L16 16" />
        <path d="M8.5 16h7a1 1 0 0 0 .916-.6L18 12H6l1.584 3.4a1 1 0 0 0 .916.6z" />
        <path d="M9 12V8a3 3 0 0 1 6 0v4" />
        <path d="M12 8V4" />
        <path d="M10 4h4" />
      </svg>
    ),
    route: ROUTES.CHESS,
    available: true,
  },
  {
    id: 'checkers',
    titleKey: 'home.checkers.title',
    descriptionKey: 'home.checkers.description',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    route: ROUTES.CHECKERS,
    available: true,
  },
  {
    id: 'go',
    titleKey: 'home.go.title',
    descriptionKey: 'home.go.description',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
    route: ROUTES.HOME,
    available: false,
  },
] as const;

/** Game portal landing page */
export function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-12 overflow-auto relative">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]
        bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Hero */}
      <motion.div
        className="relative text-center mb-14"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <h1 className="text-5xl font-bold text-text-primary mb-3 tracking-tight leading-tight">
          {t('home.titleStart')}{' '}
          <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
            {t('home.titleAccent')}
          </span>
        </h1>
        <p className="text-text-secondary text-base max-w-sm mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
      </motion.div>

      {/* Game cards */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[640px]">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            className={`group relative rounded-xl border overflow-hidden
              transition-all duration-200
              ${
                game.available
                  ? 'bg-bg-card border-border-primary hover:border-accent/40 cursor-pointer hover:shadow-glow'
                  : 'bg-bg-secondary/40 border-border-subtle cursor-default'
              }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={() => game.available && navigate(game.route)}
          >
            <div className="p-5 flex flex-col items-center gap-3 text-center">
              <div className={`p-3 rounded-lg
                ${game.available
                  ? 'bg-accent/10 text-accent group-hover:bg-accent/15'
                  : 'bg-bg-hover text-text-muted'}
                transition-colors duration-200`}
              >
                {game.icon}
              </div>

              <div>
                <h2 className={`text-base font-semibold mb-1
                  ${game.available ? 'text-text-primary' : 'text-text-muted'}`}>
                  {t(game.titleKey)}
                </h2>
                <p className={`text-xs leading-relaxed
                  ${game.available ? 'text-text-secondary' : 'text-text-muted'}`}>
                  {t(game.descriptionKey)}
                </p>
              </div>

              <div className="pt-1">
                {game.available ? (
                  <Button variant="primary" size="sm">
                    {t('btn.playNow')}
                  </Button>
                ) : (
                  <span className="text-[10px] text-text-muted uppercase tracking-[0.15em] font-medium">
                    {t('btn.comingSoon')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
