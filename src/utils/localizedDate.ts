import type { AppLanguage } from '../i18n/types';

import { localeTagForLanguage } from './preferredLanguage';

export function formatLocalizedDate(
  value: string | null | undefined,
  language: AppLanguage,
  fallback = '—',
): string {
  if (!value || value === '-') {
    return fallback;
  }

  const iso = value.length >= 10 ? value.slice(0, 10) : value;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(localeTagForLanguage(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
