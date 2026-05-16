/**
 * Animated slide-in settings panel for the Backgammon game.
 *
 * Renders a full-height drawer from the right edge of the screen, animated
 * with Framer Motion's spring. Provides controls for:
 *
 * - **Game mode** — AI vs local two-player.
 * - **Player color** — White or Black (AI mode only).
 * - **AI difficulty** — Easy / Medium / Hard (AI mode only).
 * - **Rules preset** — Classic / Strict / Relaxed / Caucasian / Custom.
 * - **Custom rule toggles** — visible only when the Custom preset is selected.
 *
 * Changing any game-invalidating setting immediately calls `onResetRequired`
 * so the parent can start a fresh game with the updated configuration.
 *
 * Reads and writes all settings directly via `useBackgammonSettingsStore`
 * (same pattern as `GoSettingsPanel`).
 *
 * @example
 * ```tsx
 * <BackgammonSettingsPanel
 *   isOpen={settingsOpen}
 *   onClose={() => setSettingsOpen(false)}
 *   onResetRequired={handleNewGame}
 * />
 * ```
 */

import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBackgammonSettingsStore } from '../../stores/useBackgammonSettingsStore';
import { RULE_PRESETS } from '../../config/variants';
import type { BackgammonRules } from '../../config/variants';
import type { AILevel } from '../../config/aiLevels';
import type { StoneColor } from '../../engine/types';
import type { BackgammonGameMode } from '../../stores/useBackgammonStore';
import { useEscapeClose } from '../../../../core/hooks/useEscapeClose';
import { useTranslation } from '../../../../core/i18n/useTranslation';
import { LOCALE_LABELS, type Locale } from '../../../../core/i18n/translations';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ordered list of rule preset keys used for rendering preset buttons. */
const PRESET_KEYS = [
  'classic',
  'strict',
  'relaxed',
  'caucasian',
  'custom',
] as const satisfies ReadonlyArray<keyof typeof RULE_PRESETS>;

/** i18n key for each rules preset. */
const PRESET_LABEL_KEYS: Record<(typeof PRESET_KEYS)[number], string> = {
  classic: 'backgammon.presetClassic',
  strict: 'backgammon.presetStrict',
  relaxed: 'backgammon.presetRelaxed',
  caucasian: 'backgammon.presetCaucasian',
  custom: 'backgammon.presetCustom',
};

/** Ordered AI difficulty levels. */
const AI_LEVELS: AILevel[] = ['easy', 'medium', 'hard'];

/** i18n key for each AI level. */
const AI_LABEL_KEYS: Record<AILevel, string> = {
  easy: 'backgammon.levelEasy',
  medium: 'backgammon.levelMedium',
  hard: 'backgammon.levelHard',
};

/**
 * Available options for the six-block rule, paired with their i18n label keys.
 * Presented as a radio-list inside the Custom rules section.
 */
const SIX_BLOCK_OPTIONS: ReadonlyArray<[BackgammonRules['sixBlockRule'], string]> = [
  ['classical', 'backgammon.blockClassical'],
  ['always-allowed', 'backgammon.blockAlwaysAllowed'],
  ['always-forbidden', 'backgammon.blockAlwaysForbidden'],
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link BackgammonSettingsPanel}. */
interface BackgammonSettingsPanelProps {
  /** Whether the panel is currently open. Controls `AnimatePresence` mount/unmount. */
  isOpen: boolean;
  /** Called when the user clicks the close button or the backdrop overlay. */
  onClose: () => void;
  /**
   * Called immediately after any setting that invalidates the current game
   * (mode, color, rules preset) is changed. The parent resets the game in response.
   */
  onResetRequired: () => void;
}

// ---------------------------------------------------------------------------
// Sub-component: ToggleRow
// ---------------------------------------------------------------------------

/**
 * A labelled boolean toggle switch — used inside the Custom rules section.
 *
 * @param label    - Human-readable label describing the rule.
 * @param value    - Current boolean value of the toggle.
 * @param onChange - Called with the new value when the switch is clicked.
 * @returns The rendered toggle row.
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-text-secondary flex-1 leading-snug">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full
          transition-colors duration-150 cursor-pointer focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-accent
          ${value ? 'bg-accent' : 'bg-bg-tertiary'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow
            transition-transform duration-150
            ${value ? 'translate-x-4' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Framer-Motion slide-in settings panel for Backgammon.
 *
 * Reads all settings from `useBackgammonSettingsStore` and writes changes back
 * directly. Changing a game-invalidating setting immediately calls
 * `onResetRequired` — the parent is expected to call `resetGame()` in response.
 *
 * Keyboard: Escape dismisses the panel via `useEscapeClose`.
 *
 * @param props - See {@link BackgammonSettingsPanelProps}.
 * @returns An `AnimatePresence`-managed settings panel element.
 */
export function BackgammonSettingsPanel({
  isOpen,
  onClose,
  onResetRequired,
}: BackgammonSettingsPanelProps) {
  const { t, locale, setLocale } = useTranslation();
  useEscapeClose(isOpen, onClose);

  const {
    gameMode,
    setGameMode,
    playerColor,
    setPlayerColor,
    aiLevel,
    setAILevel,
    rulesPreset,
    setRulesPreset,
    getActiveRules,
    setCustomRules,
  } = useBackgammonSettingsStore();

  // ── Action handlers ──────────────────────────────────────────────────────

  const handleGameModeChange = useCallback(
    (mode: BackgammonGameMode) => {
      setGameMode(mode);
      onResetRequired();
    },
    [setGameMode, onResetRequired],
  );

  const handlePlayerColorChange = useCallback(
    (c: StoneColor) => {
      setPlayerColor(c);
      onResetRequired();
    },
    [setPlayerColor, onResetRequired],
  );

  const handlePresetChange = useCallback(
    (p: (typeof PRESET_KEYS)[number]) => {
      setRulesPreset(p);
      onResetRequired();
    },
    [setRulesPreset, onResetRequired],
  );

  const handleCustomRuleChange = useCallback(
    <K extends keyof BackgammonRules>(key: K, value: BackgammonRules[K]) => {
      const current = getActiveRules();
      setCustomRules({ ...current, [key]: value });
      onResetRequired();
    },
    [getActiveRules, setCustomRules, onResetRequired],
  );

  // ── Shared CSS helpers ───────────────────────────────────────────────────

  const sectionClass = 'mb-5';
  const labelClass = 'block text-[11px] text-text-muted uppercase tracking-wider mb-1.5';
  const segmentClass = 'flex rounded-lg overflow-hidden border border-border-subtle';
  const segBtn = (active: boolean) =>
    'flex-1 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ' +
    (active
      ? 'bg-accent text-bg-primary'
      : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover');

  const activeRules = getActiveRules();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent backdrop — click to close */}
          <motion.div
            key="bg"
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Sliding panel */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('backgammon.settingsTitle')}
            className="absolute top-0 bottom-0 right-0 w-72 md:w-80
              bg-bg-card border-l border-border-subtle shadow-2xl
              overflow-y-auto pointer-events-auto z-10 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* ── Panel header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-text-primary">
                {t('backgammon.settingsTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary
                  hover:bg-bg-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* ── Panel body ───────────────────────────────────────────── */}
            <div className="flex-1 px-5 py-4">

              {/* Language */}
              <div className={sectionClass}>
                <span className={labelClass}>{t('settings.language')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(LOCALE_LABELS) as Locale[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLocale(lang)}
                      className={`px-3 py-2.5 text-[12px] font-medium rounded-lg border transition-all cursor-pointer
                        ${locale === lang
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-hover/50 border-border-subtle text-text-secondary hover:border-border-primary'
                        }`}
                    >
                      {LOCALE_LABELS[lang]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game mode */}
              <div className={sectionClass}>
                <span className={labelClass}>{t('backgammon.gameMode')}</span>
                <div className={segmentClass}>
                  <button
                    type="button"
                    className={segBtn(gameMode === 'ai')}
                    onClick={() => handleGameModeChange('ai')}
                  >
                    {t('backgammon.modeAI')}
                  </button>
                  <button
                    type="button"
                    className={segBtn(gameMode === 'local')}
                    onClick={() => handleGameModeChange('local')}
                  >
                    {t('backgammon.modeLocal')}
                  </button>
                </div>
              </div>

              {/* Player color — AI mode only */}
              {gameMode === 'ai' && (
                <div className={sectionClass}>
                  <span className={labelClass}>{t('backgammon.playerColor')}</span>
                  <div className={segmentClass}>
                    <button
                      type="button"
                      className={segBtn(playerColor === 'w')}
                      onClick={() => handlePlayerColorChange('w')}
                    >
                      ○ {t('backgammon.white')}
                    </button>
                    <button
                      type="button"
                      className={segBtn(playerColor === 'b')}
                      onClick={() => handlePlayerColorChange('b')}
                    >
                      ● {t('backgammon.black')}
                    </button>
                  </div>
                </div>
              )}

              {/* AI level — AI mode only */}
              {gameMode === 'ai' && (
                <div className={sectionClass}>
                  <span className={labelClass}>{t('backgammon.aiLevel')}</span>
                  <div className={segmentClass}>
                    {AI_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={segBtn(aiLevel === lvl)}
                        onClick={() => setAILevel(lvl)}
                      >
                        {t(AI_LABEL_KEYS[lvl])}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules preset */}
              <div className={sectionClass}>
                <span className={labelClass}>{t('backgammon.rulesPreset')}</span>
                <div className="space-y-1">
                  {PRESET_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetChange(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium
                        transition-colors cursor-pointer
                        ${rulesPreset === key
                          ? 'bg-accent/20 text-accent border border-accent/40'
                          : 'bg-bg-secondary text-text-secondary border border-transparent hover:bg-bg-hover hover:text-text-primary'
                        }`}
                    >
                      {t(PRESET_LABEL_KEYS[key])}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom rule toggles — only when Custom preset is active */}
              {rulesPreset === 'custom' && (
                <div className={sectionClass}>
                  <span className={labelClass}>Custom rules</span>
                  <div className="space-y-3 bg-bg-secondary/60 rounded-xl p-3 border border-border-subtle">

                    <ToggleRow
                      label={t('backgammon.headException')}
                      value={activeRules.headExceptionOnFirstDoubles}
                      onChange={(v) => handleCustomRuleChange('headExceptionOnFirstDoubles', v)}
                    />

                    <ToggleRow
                      label={t('backgammon.enableKokc')}
                      value={activeRules.enableKokc}
                      onChange={(v) => handleCustomRuleChange('enableKokc', v)}
                    />

                    <ToggleRow
                      label={t('backgammon.firstMoveByDice')}
                      value={activeRules.firstMoveByDiceRoll}
                      onChange={(v) => handleCustomRuleChange('firstMoveByDiceRoll', v)}
                    />

                    <ToggleRow
                      label={t('backgammon.strictMaxDie')}
                      value={activeRules.strictMaxDieRule}
                      onChange={(v) => handleCustomRuleChange('strictMaxDieRule', v)}
                    />

                    {/* Six-block rule — radio list */}
                    <div>
                      <span className="block text-[10px] text-text-muted mb-1.5">
                        {t('backgammon.sixBlockRule')}
                      </span>
                      <div className="space-y-0.5">
                        {SIX_BLOCK_OPTIONS.map(([val, labelKey]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleCustomRuleChange('sixBlockRule', val)}
                            className={`w-full text-left px-2 py-1.5 rounded text-[11px]
                              transition-colors cursor-pointer
                              ${activeRules.sixBlockRule === val
                                ? 'bg-accent/20 text-accent'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                              }`}
                          >
                            {t(labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
