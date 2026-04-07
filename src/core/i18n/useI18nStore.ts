import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TRANSLATIONS, type Locale } from './translations';

interface I18nState {
  /** Currently active UI language. */
  locale: Locale;
  /** Switch the active UI language. */
  setLocale: (locale: Locale) => void;
}

/**
 * Detect a sensible initial locale from the browser's `navigator.language`.
 * Falls back to English when the value is missing or unsupported.
 */
function detectInitialLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('ru')) return 'ru';
  return 'en';
}

/**
 * Persistent UI language store. Used by `useTranslation` to look up strings.
 *
 * Persisted under the `chess-portal-i18n` localStorage key so the user's
 * choice survives reloads.
 */
export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: detectInitialLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'chess-portal-i18n' },
  ),
);

/**
 * Look up a translation by key for a given locale, with English fallback.
 * Exposed as a non-hook helper for use outside React (e.g. in selectors).
 */
export function translate(locale: Locale, key: string): string {
  return TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key;
}
