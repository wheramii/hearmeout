import type { CSSProperties } from 'react';
import { translate, type Language } from './i18n';

export function starsText(n: number): string {
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

export function userAvatarStyle(u: { avatarUrl: string | null }): CSSProperties {
  return u.avatarUrl ? { backgroundImage: `url('${u.avatarUrl}')` } : {};
}

export function formatJoinDate(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(language, { month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function formatRelative(iso: string, language: Language): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return translate(language, 'time.now');
  if (minutes < 60) return translate(language, 'time.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(language, 'time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return translate(language, 'time.yesterday');
  if (days < 7) return translate(language, 'time.daysAgo', { n: days });
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return translate(language, 'time.weeksAgo', { n: weeks });
  const months = Math.floor(days / 30);
  if (months < 12) return translate(language, 'time.monthsAgo', { n: months });
  return translate(language, 'time.yearsAgo', { n: Math.floor(days / 365) });
}
