import en from '../i18n/en.json';
import ru from '../i18n/ru.json';
import uz from '../i18n/uz.json';

export const LOCALES = ['en', 'uz', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Non-default locales, i.e. the ones that live behind a path prefix. */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

const dictionaries = { en, uz, ru } as const;
export type Strings = typeof en;

export function t(locale: Locale): Strings {
  return dictionaries[locale] as Strings;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** A field translated into every locale. */
export type L10n<T> = Record<Locale, T>;

export function pick<T>(value: L10n<T>, locale: Locale): T {
  return value[locale] ?? value[DEFAULT_LOCALE];
}

/** `/`, `/blog/`, `/cv/` for EN; `/uz/`, `/uz/blog/`, … for the rest. */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return clean === '' ? `${prefix}/` : `${prefix}/${clean}/`;
}

/** Fills {name}-style placeholders in a UI string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

const DATE_LOCALES: Record<Locale, string> = { en: 'en-GB', uz: 'uz-Latn-UZ', ru: 'ru-RU' };

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
