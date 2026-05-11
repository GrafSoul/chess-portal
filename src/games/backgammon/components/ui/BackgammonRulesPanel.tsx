/**
 * Slide-in rules/tutorial panel for Long Backgammon (Длинные нарды).
 *
 * When opened, activates tutorial mode in `useBackgammonTutorialStore` so
 * the 3D board switches to showing chapter-specific positions. Closing the
 * panel exits tutorial mode and restores the live game view.
 *
 * Layout and animation match `CheckersRulesPanel` / `GoRulesPanel` for
 * cross-game visual consistency.
 *
 * @module
 */

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BACKGAMMON_TUTORIAL_CHAPTERS,
  getBackgammonChapterById,
} from '../../data/tutorialChapters';
import { useBackgammonTutorialStore } from '../../stores/useBackgammonTutorialStore';
import { useBackgammonTutorialLoop } from '../../hooks/useBackgammonTutorialLoop';
import { useEscapeClose } from '../../../../core/hooks/useEscapeClose';
import { useTranslation } from '../../../../core/i18n/useTranslation';

/** Props for {@link BackgammonRulesPanel}. */
interface BackgammonRulesPanelProps {
  /** Whether the panel is currently open. */
  isOpen: boolean;
  /**
   * Called when the user closes the panel (× button or Escape key).
   * Should set `isOpen` to `false` in the parent.
   */
  onClose: () => void;
}

/**
 * Animated slide-in side panel that renders Backgammon rules / tutorial.
 *
 * The 3D board acts as the demonstration surface: chapter positions, highlight
 * rings, and directional arrows render directly on it via
 * `BackgammonTutorialOverlay`.
 *
 * Looped board-state animations (stone appear/disappear sequences) are driven
 * by `useBackgammonTutorialLoop`.
 *
 * @param props - Panel open state and close handler.
 * @param props.isOpen - Triggers tutorial mode entry/exit when changed.
 * @param props.onClose - Called when the user dismisses the panel.
 * @returns The animated panel element (renders inside `AnimatePresence`).
 *
 * @example
 * ```tsx
 * const [rulesOpen, setRulesOpen] = useState(false);
 * <BackgammonRulesPanel
 *   isOpen={rulesOpen}
 *   onClose={() => setRulesOpen(false)}
 * />
 * ```
 */
export function BackgammonRulesPanel({ isOpen, onClose }: BackgammonRulesPanelProps) {
  const { t } = useTranslation();

  const isActive = useBackgammonTutorialStore((s) => s.isActive);
  const currentChapterId = useBackgammonTutorialStore((s) => s.currentChapterId);
  const enter = useBackgammonTutorialStore((s) => s.enter);
  const exit = useBackgammonTutorialStore((s) => s.exit);
  const setChapter = useBackgammonTutorialStore((s) => s.setChapter);
  const setBoard = useBackgammonTutorialStore((s) => s.setBoard);
  const setHighlights = useBackgammonTutorialStore((s) => s.setHighlights);
  const setArrows = useBackgammonTutorialStore((s) => s.setArrows);

  // Enter / exit tutorial mode when the panel opens or closes
  useEffect(() => {
    if (isOpen && !isActive) {
      enter();
      setChapter(BACKGAMMON_TUTORIAL_CHAPTERS[0].id);
    } else if (!isOpen && isActive) {
      exit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Apply chapter data (board, highlights, arrows) when the chapter changes
  useEffect(() => {
    if (!isActive || !currentChapterId) return;
    const chapter = getBackgammonChapterById(currentChapterId);
    setBoard(chapter.board, chapter.bornOff);
    setHighlights(chapter.highlights ?? []);
    setArrows(chapter.arrows ?? []);
  }, [isActive, currentChapterId, setBoard, setHighlights, setArrows]);

  // Run looped board-state animation for the current chapter (if any)
  useBackgammonTutorialLoop(currentChapterId);

  // Dismiss panel on Escape key
  useEscapeClose(isOpen, onClose);

  const currentIndex = useMemo(
    () => BACKGAMMON_TUTORIAL_CHAPTERS.findIndex((c) => c.id === currentChapterId),
    [currentChapterId],
  );

  const chapter = currentChapterId
    ? getBackgammonChapterById(currentChapterId)
    : BACKGAMMON_TUTORIAL_CHAPTERS[0];

  const goPrev = () => {
    if (currentIndex > 0) {
      setChapter(BACKGAMMON_TUTORIAL_CHAPTERS[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < BACKGAMMON_TUTORIAL_CHAPTERS.length - 1) {
      setChapter(BACKGAMMON_TUTORIAL_CHAPTERS[currentIndex + 1].id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          className="fixed top-0 right-0 bottom-0 w-[340px] max-w-[92vw] bg-bg-card
            border-l border-border-primary shadow-2xl z-50 overflow-y-auto flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="backgammon-rules-title"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between p-5 border-b border-border-subtle">
            <h2
              id="backgammon-rules-title"
              className="text-base font-semibold text-text-primary"
            >
              {t('backgammonRules.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
              aria-label={t('backgammonRules.close')}
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

          {/* ── Progress dots ── */}
          <div className="flex items-center justify-center gap-1.5 px-5 py-3
            border-b border-border-subtle flex-wrap">
            {BACKGAMMON_TUTORIAL_CHAPTERS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setChapter(c.id)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-5 bg-accent'
                    : i < currentIndex
                      ? 'w-1.5 bg-accent/50'
                      : 'w-1.5 bg-border-primary'
                }`}
                aria-label={`${t('backgammonRules.chapter')} ${i + 1}`}
              />
            ))}
          </div>

          {/* ── Chapter counter ── */}
          <div className="px-5 pt-4 text-[10px] text-text-muted uppercase tracking-wider font-medium">
            {t('backgammonRules.chapter')} {Math.max(0, currentIndex) + 1}{' '}
            / {BACKGAMMON_TUTORIAL_CHAPTERS.length}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 px-5 py-3 overflow-y-auto">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              {t(chapter.titleKey)}
            </h3>
            <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">
              {t(chapter.bodyKey)}
            </p>
          </div>

          {/* ── Navigation footer ── */}
          <div className="flex items-center justify-between gap-2 p-4 border-t border-border-subtle">
            <button
              onClick={goPrev}
              disabled={currentIndex <= 0}
              className="px-3 py-2 text-[12px] font-medium rounded-lg border border-border-subtle
                text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary transition-colors
                disabled:opacity-30 disabled:pointer-events-none"
            >
              ← {t('backgammonRules.prev')}
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex >= BACKGAMMON_TUTORIAL_CHAPTERS.length - 1}
              className="px-3 py-2 text-[12px] font-medium rounded-lg bg-accent text-white
                hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('backgammonRules.next')} →
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
