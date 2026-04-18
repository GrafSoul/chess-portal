/**
 * Slide-in rules/tutorial panel for Go.
 *
 * When opened, activates tutorial mode in `useGoTutorialStore` so the 3D
 * board switches to showing chapter-specific positions. Closing the panel
 * exits tutorial mode and restores the live game view.
 *
 * Layout and animation match `CheckersRulesPanel` for cross-game consistency.
 *
 * @module
 */

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  GO_TUTORIAL_CHAPTERS,
  getGoChapterById,
} from '../../tutorial/tutorialChapters';
import { useGoTutorialStore } from '../../stores/useGoTutorialStore';
import { useGoTutorialLoop } from '../../hooks/useGoTutorialLoop';
import { useEscapeClose } from '../../hooks/useEscapeClose';
import { useTranslation } from '../../../../core/i18n/useTranslation';

/** Props for the rules panel. */
interface GoRulesPanelProps {
  /** Whether the panel is open. */
  isOpen: boolean;
  /** Close handler — exits tutorial mode and closes the panel. */
  onClose: () => void;
}

/**
 * Slide-in side panel that renders Go rules/tutorial chapters.
 *
 * The 3D board acts as the demonstration surface — chapter positions,
 * highlights, arrows, and looped animations all render directly on it.
 *
 * @param props - Panel open state and close handler.
 * @param props.isOpen - Whether the panel is visible. Opening activates tutorial
 *   mode in `useGoTutorialStore`; closing restores the live game board.
 * @param props.onClose - Called when the user clicks the × button. Should set
 *   `isOpen` to `false` in the parent.
 * @returns The animated panel element, or `null` when the panel is closed.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <GoRulesPanel isOpen={open} onClose={() => setOpen(false)} />
 * ```
 */
export function GoRulesPanel({ isOpen, onClose }: GoRulesPanelProps) {
  const { t } = useTranslation();

  const isActive = useGoTutorialStore((s) => s.isActive);
  const currentChapterId = useGoTutorialStore((s) => s.currentChapterId);
  const enter = useGoTutorialStore((s) => s.enter);
  const exit = useGoTutorialStore((s) => s.exit);
  const setChapter = useGoTutorialStore((s) => s.setChapter);
  const setBoard = useGoTutorialStore((s) => s.setBoard);
  const setHighlights = useGoTutorialStore((s) => s.setHighlights);
  const setArrows = useGoTutorialStore((s) => s.setArrows);

  // Enter/exit tutorial mode when the panel opens/closes
  useEffect(() => {
    if (isOpen && !isActive) {
      enter();
      setChapter(GO_TUTORIAL_CHAPTERS[0].id);
    } else if (!isOpen && isActive) {
      exit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Apply chapter data whenever the chapter changes
  useEffect(() => {
    if (!isActive || !currentChapterId) return;
    const chapter = getGoChapterById(currentChapterId);
    setBoard(chapter.boardNotation);
    setHighlights(chapter.highlights ?? []);
    setArrows(chapter.arrows ?? []);
  }, [isActive, currentChapterId, setBoard, setHighlights, setArrows]);

  // Start looped demonstration for the current chapter
  useGoTutorialLoop(currentChapterId);

  // Esc closes the panel when open.
  useEscapeClose(isOpen, onClose);

  const currentIndex = useMemo(
    () => GO_TUTORIAL_CHAPTERS.findIndex((c) => c.id === currentChapterId),
    [currentChapterId],
  );

  const chapter = currentChapterId
    ? getGoChapterById(currentChapterId)
    : GO_TUTORIAL_CHAPTERS[0];

  const goPrev = () => {
    if (currentIndex > 0) {
      setChapter(GO_TUTORIAL_CHAPTERS[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < GO_TUTORIAL_CHAPTERS.length - 1) {
      setChapter(GO_TUTORIAL_CHAPTERS[currentIndex + 1].id);
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
          className="fixed top-0 right-0 bottom-0 w-[340px] max-w-[92vw] bg-bg-card border-l border-border-primary
            shadow-2xl z-50 overflow-y-auto flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="go-rules-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border-subtle">
            <h2 id="go-rules-title" className="text-base font-semibold text-text-primary">
              {t('goRules.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
              aria-label={t('goRules.close')}
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
            {GO_TUTORIAL_CHAPTERS.map((c, i) => (
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
                aria-label={`${t('goRules.chapter')} ${i + 1}`}
              />
            ))}
          </div>

          {/* Chapter counter */}
          <div className="px-5 pt-4 text-[10px] text-text-muted uppercase tracking-wider font-medium">
            {t('goRules.chapter')} {currentIndex + 1} / {GO_TUTORIAL_CHAPTERS.length}
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
              {t('goRules.prev')}
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex >= GO_TUTORIAL_CHAPTERS.length - 1}
              className="px-3 py-2 text-[12px] font-medium rounded-lg bg-accent text-white
                hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t('goRules.next')}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
