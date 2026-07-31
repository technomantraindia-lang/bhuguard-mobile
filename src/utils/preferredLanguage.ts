import type { AppLanguage } from '../i18n/types';

export function normalizeAppLanguage(value?: string | null): AppLanguage | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  if (lower === 'en' || lower === 'english') {
    return 'en';
  }

  if (lower === 'hi' || lower === 'hindi' || trimmed === 'हिंदी' || trimmed === 'हिन्दी') {
    return 'hi';
  }

  if (lower === 'gu' || lower === 'gujarati' || trimmed === 'ગુજરાતી') {
    return 'gu';
  }

  return null;
}

export function localeTagForLanguage(language: AppLanguage): string {
  switch (language) {
    case 'hi':
      return 'hi-IN';
    case 'gu':
      return 'gu-IN';
    default:
      return 'en-GB';
  }
}
