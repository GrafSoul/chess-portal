import { AnimatePresence, motion } from 'framer-motion';
import { CLOCK_PRESETS } from '../../config/clockPresets';
import { AI_LEVELS } from '../../config/aiLevels';
import { useChessSettingsStore } from '../../stores/useChessSettingsStore';
import { useChessStore } from '../../stores/useChessStore';
import type { AILevel, GameMode, PieceColor } from '../../engine/types';

interface SettingsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close handler — called on backdrop click or Escape */
  onClose: () => void;
  /** Called when a setting changes that requires resetting the game */
  onResetRequired: () => void;
}

/**
 * Slide-in side panel containing all chess game settings.
 *
 * Settings include:
 * - Game mode (vs AI / 2 Players)
 * - AI difficulty level (when in AI mode)
 * - Clock preset (bullet/blitz/rapid/classical/unlimited)
 * - Sound toggle
 * - Auto-rotate board toggle
 *
 * Changing the clock preset or game mode automatically resets the current game
 * via the `onResetRequired` callback so the new settings take effect immediately.
 */
export function SettingsPanel({ isOpen, onClose, onResetRequired }: SettingsPanelProps) {
  const aiLevel = useChessSettingsStore((s) => s.aiLevel);
  const setAILevel = useChessSettingsStore((s) => s.setAILevel);
  const clockPreset = useChessSettingsStore((s) => s.clockPreset);
  const setClockPreset = useChessSettingsStore((s) => s.setClockPreset);
  const playerColor = useChessSettingsStore((s) => s.playerColor);
  const setPlayerColor = useChessSettingsStore((s) => s.setPlayerColor);
  const soundEnabled = useChessSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useChessSettingsStore((s) => s.setSoundEnabled);
  const autoRotate = useChessSettingsStore((s) => s.autoRotate);
  const setAutoRotate = useChessSettingsStore((s) => s.setAutoRotate);

  const gameMode = useChessStore((s) => s.gameMode);
  const setGameMode = useChessStore((s) => s.setGameMode);

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-bg-card border-l border-border-primary
              shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-text-primary">Settings</h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors p-1"
                  aria-label="Close settings"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M4 4l10 10M14 4L4 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Game Mode */}
              <Section title="Game Mode">
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
                      {mode === 'ai' ? 'vs AI' : '2 Players'}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Playing as (color selection) */}
              <Section title="Playing as">
                <div className="grid grid-cols-2 gap-2">
                  {(['w', 'b'] as const).map((color) => (
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
                        className={`w-3 h-3 rounded-sm border ${
                          color === 'w'
                            ? 'bg-white-piece border-white/20'
                            : 'bg-black-piece border-white/10'
                        }`}
                      />
                      {color === 'w' ? 'White' : 'Black'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                  {playerColor === 'w'
                    ? 'White moves first — you start the game.'
                    : 'White moves first — the AI starts.'}
                </p>
              </Section>

              {/* AI Difficulty (only in AI mode) */}
              {gameMode === 'ai' && (
                <Section title="AI Difficulty">
                  <div className="space-y-1.5">
                    {(Object.keys(AI_LEVELS) as AILevel[]).map((lvl) => (
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
                            aiLevel === lvl ? 'text-accent' : 'text-text-secondary'
                          }`}
                        >
                          {AI_LEVELS[lvl].label}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                          depth {AI_LEVELS[lvl].depth}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {/* Clock Preset */}
              <Section title="Time Control">
                <div className="space-y-1.5">
                  {Object.entries(CLOCK_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handleClockChange(key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                        border transition-all text-left
                        ${
                          clockPreset === key
                            ? 'bg-accent/15 border-accent'
                            : 'bg-bg-hover/50 border-border-subtle hover:border-border-primary'
                        }`}
                    >
                      <span
                        className={`text-[12px] font-medium ${
                          clockPreset === key ? 'text-accent' : 'text-text-secondary'
                        }`}
                      >
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Toggles */}
              <Section title="Preferences">
                <ToggleRow
                  label="Sound effects"
                  value={soundEnabled}
                  onChange={setSoundEnabled}
                />
                <ToggleRow
                  label="Auto-rotate board"
                  value={autoRotate}
                  onChange={setAutoRotate}
                />
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

/** Settings section wrapper with title and content area */
function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-2 font-medium">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Single labelled toggle row used inside settings sections */
function ToggleRow({ label, value, onChange }: ToggleRowProps) {
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
