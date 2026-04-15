import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CHECKERS_TUTORIAL_CHAPTERS,
  getCheckersChapterById,
} from '../../data/tutorialChapters';
import { useCheckersTutorialStore } from '../../stores/useCheckersTutorialStore';
import { useCheckersStore } from '../../stores/useCheckersStore';
import { useCheckersTutorialLoop } from '../../hooks/useCheckersTutorialLoop';
import { useTranslation } from '../../../../core/i18n/useTranslation';

interface CheckersRulesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close handler — resets tutorial store and closes panel */
  onClose: () => void;
}

/**
 * Slide-in side panel that renders checkers rules/tutorial chapters while
 * the main 3D board acts as the demonstration surface.
 *
 * When opened, the panel activates tutorial mode in `useCheckersTutorialStore`,
 * which causes the board (via `useCheckersDisplayedBoardState`) to render
 * whatever position the current chapter specifies. Closing the panel exits
 * tutorial mode and restores normal game display.
 *
 * @param props Panel open state and close handler
 */
export function CheckersRulesPanel({ isOpen, onClose }: CheckersRulesPanelProps) {
  const { t } = useTranslation();

  const isActive = useCheckersTutorialStore((s) => s.isActive);
  const currentChapterId = useCheckersTutorialStore((s) => s.currentChapterId);
  const enter = useCheckersTutorialStore((s) => s.enter);
  const exit = useCheckersTutorialStore((s) => s.exit);
  const setChapter = useCheckersTutorialStore((s) => s.setChapter);
  const setPosition = useCheckersTutorialStore((s) => s.setPosition);
  const setHighlights = useCheckersTutorialStore((s) => s.setHighlights);
  const setArrows = useCheckersTutorialStore((s) => s.setArrows);
  const setLastMove = useCheckersTutorialStore((s) => s.setLastMove);

  const checkersFen = useCheckersStore((s) => s.fen);

  // Enter/exit tutorial mode when the panel opens/closes
  useEffect(() => {
    if (isOpen && !isActive) {
      enter({ fen: checkersFen });
      setChapter(CHECKERS_TUTORIAL_CHAPTERS[0].id);
    } else if (!isOpen && isActive) {
      exit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Apply chapter data to the tutorial store whenever the chapter changes
  useEffect(() => {
    if (!isActive || !currentChapterId) return;
    const chapter = getCheckersChapterById(currentChapterId);
    setPosition(chapter.fen);
    setHighlights(chapter.highlights ?? []);
    setArrows(chapter.arrows ?? []);
    setLastMove(null);
  }, [isActive, currentChapterId, setPosition, setHighlights, setArrows, setLastMove]);

  // Start looped demonstration for the current chapter
  useCheckersTutorialLoop(currentChapterId);

  const currentIndex = useMemo(
    () => CHECKERS_TUTORIAL_CHAPTERS.findIndex((c) => c.id === currentChapterId),
    [currentChapterId],
  );

  const chapter = currentChapterId
    ? getCheckersChapterById(currentChapterId)
    : CHECKERS_TUTORIAL_CHAPTERS[0];

  const goPrev = () => {
    if (currentIndex > 0) {
      setChapter(CHECKERS_TUTORIAL_CHAPTERS[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < CHECKERS_TUTORIAL_CHAPTERS.length - 1) {
      setChapter(CHECKERS_TUTORIAL_CHAPTERS[currentIndex + 1].id);
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
          className="fixed top-0 right-0 bottom-0 w-[340px] bg-bg-card border-l border-border-primary
            shadow-2xl z-50 overflow-y-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border-subtle">
            <h2 className="text-base font-semibold text-text-primary">
              {t('checkersRules.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
              aria-label={t('checkersRules.close')}
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

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 px-5 py-3 border-b border-border-subtle">
            {CHECKERS_TUTORIAL_CHAPTERS.map((c, i) => (
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
                aria-label={`${t('checkersRules.chapter')} ${i + 1}`}
              />
            ))}
          </div>

          {/* Chapter counter */}
          <div className="px-5 pt-4 text-[10px] text-text-muted uppercase tracking-wider font-medium">
            {t('checkersRules.chapter')} {currentIndex + 1} / {CHECKERS_TUTORIAL_CHAPTERS.length}
          </div>

          {/* Content */}
          <div className="flex-1 px-5 py-3 overflow-y-auto">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              {t(chapter.titleKey)}
            </h3>
            <p className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">
              {t(chapter.bodyKey)}
            </p>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between gap-2 p-4 border-t border-border-subtle">
            <button
              onClick={goPrev}
              disabled={currentIndex <= 0}
              className="px-3 py-2 text-[12px] font-medium rounded-lg border border-border-subtle
                text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary transition-colors
                disabled:opacity-30 disabled:pointer-events-none"
            >
              ← {t('checkersRules.prev')}
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex >= CHECKERS_TUTORIAL_CHAPTERS.length - 1}
              className="px-3 py-2 text-[12px] font-medium rounded-lg bg-accent text-white
                hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('checkersRules.next')} →
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
