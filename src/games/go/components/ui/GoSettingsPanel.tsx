/**
 * Slide-in settings panel for the Go game.
 *
 * Provides controls for language, game mode, player color, board size,
 * scoring rules, AI difficulty, and sound. Layout and animation mirror
 * `CheckersSettingsPanel` for cross-game consistency.
 *
 * Changing board size, scoring rules, game mode, or player color triggers
 * a game reset via the `onResetRequired` callback.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { GO_AI_LEVELS, type AILevel } from '../../config/aiLevels';
import { GO_CLOCK_PRESETS } from '../../config/clockPresets';
import { useGoSettingsStore } from '../../stores/useGoSettingsStore';
import { useGoStore } from '../../stores/useGoStore';
import { useEscapeClose } from '../../hooks/useEscapeClose';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import { LOCALE_LABELS, type Locale } from '../../../../core/i18n/translations';
import type { BoardSize, Stone } from '../../engine/types';
import type { ScoringRules } from '../../config/scoringRules';

/**
 * Maps each AI difficulty level to its i18n label key.
 * Used to look up the human-readable name shown in the difficulty selector.
 */
const AI_LEVEL_LABEL_KEYS: Record<AILevel, string> = {
  easy: 'ai.beginner',
  medium: 'ai.amateur',
  hard: 'ai.master',
  expert: 'ai.grandmaster',
};

/**
 * Human-readable labels for clock presets, keyed by preset id.
 *
 * Labels are intentionally compact (fit in a narrow dropdown) and use
 * Go-specific notation: `B` for byo-yomi periods, `+` for Fischer increment.
 * Kept inline (not translated) to avoid a large i18n key explosion — the
 * notation is internationally understood by Go players.
 */
const CLOCK_PRESET_LABELS: Record<string, string> = {
  unlimited: '∞ Unlimited',
  'standard-blitz': 'Blitz 5+0',
  'standard-rapid': 'Rapid 15+10',
  'standard-classical': 'Classical 30+0',
  'byoyomi-casual': 'Byo-yomi 1 + 3×30s',
  'byoyomi-standard': 'Byo-yomi 5 + 5×30s',
  'byoyomi-long': 'Byo-yomi 10 + 3×60s',
};

/**
 * Props for the Go settings panel.
 *
 * @example
 * ```tsx
 * <GoSettingsPanel
 *   isOpen={settingsOpen}
 *   onClose={() => setSettingsOpen(false)}
 *   onResetRequired={handleNewGame}
 * />
 * ```
 */
interface GoSettingsPanelProps {
  /** Whether the panel is currently open. Controls AnimatePresence mount. */
  isOpen: boolean;
  /** Called when the user clicks the close button or the backdrop overlay. */
  onClose: () => void;
  /**
   * Called immediately after any setting that invalidates the current game
   * (board size, scoring rules, game mode, player color) is changed.
   * The parent is responsible for resetting the game state in response.
   */
  onResetRequired: () => void;
}

/**
 * Animated slide-in settings panel for the Go game.
 *
 * Renders a full-height drawer from the right edge with a semi-transparent
 * backdrop overlay. Controls language, game mode, player color, board size,
 * scoring rules, AI difficulty (only in AI mode), and sound.
 *
 * Changes to board size, scoring rules, game mode, or player color
 * immediately invoke `onResetRequired` — the caller must start a new game.
 * AI difficulty and sound can be changed mid-game without a reset.
 *
 * @param props - Panel properties. See {@link GoSettingsPanelProps}.
 * @returns The animated settings drawer, or nothing when `isOpen` is false.
 *
 * @example
 * ```tsx
 * const [settingsOpen, setSettingsOpen] = useState(false);
 *
 * <GoSettingsPanel
 *   isOpen={settingsOpen}
 *   onClose={() => setSettingsOpen(false)}
 *   onResetRequired={() => {
 *     setGameOverDismissed(false);
 *     resetGame();
 *   }}
 * />
 * ```
 */
export function GoSettingsPanel({
  isOpen,
  onClose,
  onResetRequired,
}: GoSettingsPanelProps) {
  const aiLevel = useGoSettingsStore((s) => s.aiLevel);
  const setAILevel = useGoSettingsStore((s) => s.setAILevel);
  const playerColor = useGoSettingsStore((s) => s.playerColor);
  const setPlayerColor = useGoSettingsStore((s) => s.setPlayerColor);
  const boardSize = useGoSettingsStore((s) => s.boardSize);
  const setBoardSize = useGoSettingsStore((s) => s.setBoardSize);
  const scoringRules = useGoSettingsStore((s) => s.scoringRules);
  const setScoringRules = useGoSettingsStore((s) => s.setScoringRules);
  const soundEnabled = useGoSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useGoSettingsStore((s) => s.setSoundEnabled);
  const clockPreset = useGoSettingsStore((s) => s.clockPreset);
  const setClockPreset = useGoSettingsStore((s) => s.setClockPreset);

  const gameMode = useGoStore((s) => s.gameMode);
  const setGameMode = useGoStore((s) => s.setGameMode);

  const { t, locale, setLocale } = useTranslation();

  // Keyboard dismissal — Esc closes the panel when open.
  useEscapeClose(isOpen, onClose);

  /** Switches game mode and triggers a game reset. */
  const handleModeChange = (mode: 'ai' | 'local') => {
    setGameMode(mode);
    onResetRequired();
  };

  /** Switches the human player's stone color and triggers a game reset. */
  const handlePlayerColorChange = (color: Stone) => {
    setPlayerColor(color);
    onResetRequired();
  };

  /** Changes board size and triggers a game reset (engine must be recreated). */
  const handleBoardSizeChange = (size: BoardSize) => {
    setBoardSize(size);
    onResetRequired();
  };

  /** Changes scoring rules and triggers a game reset (komi may differ between rulesets). */
  const handleScoringRulesChange = (rules: ScoringRules) => {
    setScoringRules(rules);
    onResetRequired();
  };

  /** Change the time-control preset and reset the game so the new clock starts fresh. */
  const handleClockPresetChange = (preset: string) => {
    setClockPreset(preset);
    onResetRequired();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[92vw] bg-bg-card border-l border-border-primary
              shadow-2xl z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="go-settings-title"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 id="go-settings-title" className="text-base font-semibold text-text-primary">
                  {t('settings.title')}
                </h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors p-1"
                  aria-label={t('settings.close')}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M4 4l10 10M14 4L4 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Language */}
              <Section title={t('settings.language')}>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(LOCALE_LABELS) as Locale[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLocale(lang)}
                      className={`px-3 py-2.5 text-[12px] font-medium rounded-lg border transition-all
                        ${
                          locale === lang
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {LOCALE_LABELS[lang]}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Game Mode */}
              <Section title={t('settings.gameMode')}>
                <div className="grid grid-cols-2 gap-2">
                  {(['ai', 'local'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      className={`px-3 py-2.5 text-[12px] font-medium rounded-lg border transition-all
                        ${
                          gameMode === mode
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {mode === 'ai'
                        ? t('settings.vsAI')
                        : t('settings.twoPlayers')}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Playing As */}
              <Section title={t('settings.playingAs')}>
                <div className="grid grid-cols-2 gap-2">
                  {(['b', 'w'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => handlePlayerColorChange(color)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 text-[12px]
                        font-medium rounded-lg border transition-all
                        ${
                          playerColor === color
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${
                          color === 'b'
                            ? 'bg-zinc-900 ring-1 ring-white/20'
                            : 'bg-zinc-100 ring-1 ring-zinc-300'
                        }`}
                      />
                      {color === 'b' ? t('go.black') : t('go.white')}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Board Size */}
              <Section title={t('go.boardSize')}>
                <div className="grid grid-cols-2 gap-2">
                  {([9, 19] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleBoardSizeChange(size)}
                      className={`px-3 py-2.5 text-[12px] font-medium rounded-lg border transition-all
                        ${
                          boardSize === size
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Scoring Rules */}
              <Section title={t('go.scoringRules')}>
                <div className="grid grid-cols-2 gap-2">
                  {(['chinese', 'japanese'] as const).map((rules) => (
                    <button
                      key={rules}
                      onClick={() => handleScoringRulesChange(rules)}
                      className={`px-3 py-2.5 text-[12px] font-medium rounded-lg border transition-all
                        ${
                          scoringRules === rules
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {t(rules === 'chinese' ? 'go.chinese' : 'go.japanese')}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Clock / time control */}
              <Section title={t('settings.timeControl')}>
                <div className="space-y-1.5">
                  {Object.keys(GO_CLOCK_PRESETS).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleClockPresetChange(key)}
                      className={`w-full px-3 py-2 text-[12px] font-medium rounded-lg
                        border transition-all text-left
                        ${
                          clockPreset === key
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {CLOCK_PRESET_LABELS[key] ?? key}
                    </button>
                  ))}
                </div>
              </Section>

              {/* AI Difficulty */}
              {gameMode === 'ai' && (
                <Section title={t('settings.aiDifficulty')}>
                  <div className="space-y-1.5">
                    {(Object.keys(GO_AI_LEVELS) as AILevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setAILevel(lvl)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                          border transition-all text-left
                          ${
                            aiLevel === lvl
                              ? 'bg-accent/15 border-accent'
                              : 'bg-bg-hover/50 border-border-subtle hover:border-border-primary'
                          }`}
                      >
                        <span
                          className={`text-[12px] font-medium ${
                            aiLevel === lvl
                              ? 'text-accent'
                              : 'text-text-secondary'
                          }`}
                        >
                          {t(AI_LEVEL_LABEL_KEYS[lvl])}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {(GO_AI_LEVELS[lvl].maxPlayouts / 1000).toFixed(0)}k{' '}
                          {t('go.playouts')}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {/* Sound toggle */}
              <Section title={t('settings.preferences')}>
                <ToggleRow
                  label={t('settings.soundEffects')}
                  value={soundEnabled}
                  onChange={setSoundEnabled}
                />
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Settings section wrapper with an uppercase title label.
 *
 * Groups related controls under a muted heading. Used exclusively inside
 * {@link GoSettingsPanel} to keep the layout consistent.
 *
 * @param props.title - Section heading text (already translated).
 * @param props.children - Control elements rendered below the heading.
 *
 * @example
 * ```tsx
 * <Section title={t('settings.language')}>
 *   <button>EN</button>
 * </Section>
 * ```
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-2 font-medium">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Labeled boolean toggle row rendered as a pill-shaped switch.
 *
 * Uses `aria-pressed` for accessibility. Clicking anywhere on the switch
 * inverts the current value. Used for the sound-effects toggle inside
 * {@link GoSettingsPanel}.
 *
 * @param props.label - Visible label and `aria-label` for the button.
 * @param props.value - Current toggle state.
 * @param props.onChange - Called with the new boolean when the user taps the switch.
 *
 * @example
 * ```tsx
 * <ToggleRow
 *   label={t('settings.soundEffects')}
 *   value={soundEnabled}
 *   onChange={setSoundEnabled}
 * />
 * ```
 */
function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px] text-text-secondary">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          value ? 'bg-accent' : 'bg-bg-hover'
        }`}
        aria-pressed={value}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
          transition-transform ${value ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  );
}
