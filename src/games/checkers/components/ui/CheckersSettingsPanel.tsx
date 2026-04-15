import { AnimatePresence, motion } from 'framer-motion';
import { CLOCK_PRESETS } from '../../config/clockPresets';
import { AI_LEVELS } from '../../config/aiLevels';
import { useCheckersSettingsStore } from '../../stores/useCheckersSettingsStore';
import { useCheckersStore } from '../../stores/useCheckersStore';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import { LOCALE_LABELS, type Locale } from '../../../../core/i18n/translations';
import {
  DARK_SQUARE_MIN_LIGHTNESS,
  DARK_SQUARE_MAX_LIGHTNESS,
  lightnessToHex,
} from '../../../../core/utils/grayscale';
import type { AILevel, GameMode, PieceColor } from '../../engine/types';

const AI_LEVEL_LABEL_KEYS: Record<AILevel, string> = {
  easy: 'ai.beginner',
  medium: 'ai.amateur',
  hard: 'ai.master',
  expert: 'ai.grandmaster',
};

const CLOCK_PRESET_LABEL_KEYS: Record<string, string> = {
  bullet: 'clock.bullet',
  blitz: 'clock.blitz',
  rapid: 'clock.rapid',
  classical: 'clock.classical',
  unlimited: 'clock.unlimited',
};

interface CheckersSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResetRequired: () => void;
}

/** Slide-in settings panel for checkers */
export function CheckersSettingsPanel({ isOpen, onClose, onResetRequired }: CheckersSettingsPanelProps) {
  const aiLevel = useCheckersSettingsStore((s) => s.aiLevel);
  const setAILevel = useCheckersSettingsStore((s) => s.setAILevel);
  const clockPreset = useCheckersSettingsStore((s) => s.clockPreset);
  const setClockPreset = useCheckersSettingsStore((s) => s.setClockPreset);
  const playerColor = useCheckersSettingsStore((s) => s.playerColor);
  const setPlayerColor = useCheckersSettingsStore((s) => s.setPlayerColor);
  const soundEnabled = useCheckersSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useCheckersSettingsStore((s) => s.setSoundEnabled);
  const autoRotate = useCheckersSettingsStore((s) => s.autoRotate);
  const setAutoRotate = useCheckersSettingsStore((s) => s.setAutoRotate);
  const darkSquareLightness = useCheckersSettingsStore((s) => s.darkSquareLightness);
  const setDarkSquareLightness = useCheckersSettingsStore((s) => s.setDarkSquareLightness);

  const gameMode = useCheckersStore((s) => s.gameMode);
  const setGameMode = useCheckersStore((s) => s.setGameMode);

  const { t, locale, setLocale } = useTranslation();

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    onResetRequired();
  };

  const handleClockChange = (preset: string) => {
    setClockPreset(preset);
    onResetRequired();
  };

  const handlePlayerColorChange = (color: PieceColor) => {
    setPlayerColor(color);
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
            className="fixed top-0 right-0 bottom-0 w-80 bg-bg-card border-l border-border-primary
              shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-text-primary">{t('settings.title')}</h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors p-1"
                  aria-label={t('settings.close')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                        ${locale === lang
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
                        ${gameMode === mode
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {mode === 'ai' ? t('settings.vsAI') : t('settings.twoPlayers')}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Playing as */}
              <Section title={t('settings.playingAs')}>
                <div className="grid grid-cols-2 gap-2">
                  {(['w', 'b'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => handlePlayerColorChange(color)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 text-[12px]
                        font-medium rounded-lg border transition-all
                        ${playerColor === color
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      <span className={`w-3 h-3 rounded-full border ${
                        color === 'w'
                          ? 'bg-[#f5e6d0] border-[#c8b898]'
                          : 'bg-[#2a1a0e] border-[#5a4a3e]'
                      }`} />
                      {color === 'w' ? t('chess.white') : t('chess.black')}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                  {playerColor === 'w'
                    ? t('settings.whiteFirstHuman')
                    : t('settings.whiteFirstAI')}
                </p>
              </Section>

              {/* AI Difficulty */}
              {gameMode === 'ai' && (
                <Section title={t('settings.aiDifficulty')}>
                  <div className="space-y-1.5">
                    {(Object.keys(AI_LEVELS) as AILevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setAILevel(lvl)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                          border transition-all text-left
                          ${aiLevel === lvl
                            ? 'bg-accent/15 border-accent'
                            : 'bg-bg-hover/50 border-border-subtle hover:border-border-primary'
                          }`}
                      >
                        <span className={`text-[12px] font-medium ${
                          aiLevel === lvl ? 'text-accent' : 'text-text-secondary'
                        }`}>
                          {t(AI_LEVEL_LABEL_KEYS[lvl])}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {t('settings.depth')} {AI_LEVELS[lvl].depth}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {/* Clock Preset */}
              <Section title={t('settings.timeControl')}>
                <div className="space-y-1.5">
                  {Object.entries(CLOCK_PRESETS).map(([key]) => (
                    <button
                      key={key}
                      onClick={() => handleClockChange(key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                        border transition-all text-left
                        ${clockPreset === key
                          ? 'bg-accent/15 border-accent'
                          : 'bg-bg-hover/50 border-border-subtle hover:border-border-primary'
                        }`}
                    >
                      <span className={`text-[12px] font-medium ${
                        clockPreset === key ? 'text-accent' : 'text-text-secondary'
                      }`}>
                        {t(CLOCK_PRESET_LABEL_KEYS[key] ?? key)}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Board appearance */}
              <Section title={t('settings.boardAppearance')}>
                <DarkSquareSlider
                  label={t('settings.darkSquareColor')}
                  value={darkSquareLightness}
                  onChange={setDarkSquareLightness}
                />
              </Section>

              {/* Toggles */}
              <Section title={t('settings.preferences')}>
                <ToggleRow label={t('settings.soundEffects')} value={soundEnabled} onChange={setSoundEnabled} />
                <ToggleRow label={t('settings.autoRotate')} value={autoRotate} onChange={setAutoRotate} />
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-2 font-medium">{title}</h3>
      {children}
    </div>
  );
}

interface DarkSquareSliderProps {
  /** Visible label above the slider */
  label: string;
  /** Current lightness value (0–50) */
  value: number;
  /** Callback when the slider value changes */
  onChange: (value: number) => void;
}

/**
 * Slider for adjusting the grayscale lightness of dark board squares.
 * Range is clamped to the MIN/MAX defined in `core/utils/grayscale.ts`.
 */
function DarkSquareSlider({ label, value, onChange }: DarkSquareSliderProps) {
  const preview = lightnessToHex(value);
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-text-secondary">{label}</span>
        <span
          className="w-5 h-5 rounded-sm border border-border-subtle"
          style={{ backgroundColor: preview }}
          aria-hidden
        />
      </div>
      <input
        type="range"
        min={DARK_SQUARE_MIN_LIGHTNESS}
        max={DARK_SQUARE_MAX_LIGHTNESS}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
        aria-label={label}
      />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px] text-text-secondary">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-bg-hover'}`}
        aria-pressed={value}
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
          transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}
