import type { CSSProperties } from 'react';

export function starsText(n: number): string {
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

export function userAvatarStyle(u: { avatarUrl: string | null }): CSSProperties {
  return u.avatarUrl ? { backgroundImage: `url('${u.avatarUrl}')` } : {};
}

export function formatRelativeRu(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес назад`;
  return `${Math.floor(days / 365)} г назад`;
}
