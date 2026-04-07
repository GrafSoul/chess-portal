import { useCallback } from 'react';
import { useI18nStore } from './useI18nStore';
import { TRANSLATIONS, type Locale } from './translations';

/**
 * React hook returning a translation function `t(key)` bound to the active
 * locale plus the current locale and a setter.
 *
 * Components re-render whenever the user switches language.
 *
 * @example
 * const { t, locale, setLocale } = useTranslation();
 * return <h1>{t('settings.title')}</h1>;
 */
export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  const t = useCallback(
    (key: string): string => {
      return TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key;
    },
    [locale],
  );

  return { t, locale, setLocale } as { t: (key: string) => string; locale: Locale; setLocale: (locale: Locale) => void };
}
