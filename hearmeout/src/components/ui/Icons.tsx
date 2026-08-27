import { useId } from 'react';

export function LogoMark({ size = 24, animate = false }: { size?: number; animate?: boolean }) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
      className={animate ? 'logo-mark playing' : 'logo-mark'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--lime)" />
          <stop offset="1" stopColor="var(--coral)" />
        </linearGradient>
      </defs>
      <rect className="logo-bar logo-bar-1" x="14" y="26" width="8" height="12" rx="4" fill={`url(#${gradientId})`} />
      <rect className="logo-bar logo-bar-2" x="28" y="16" width="8" height="32" rx="4" fill={`url(#${gradientId})`} />
      <rect className="logo-bar logo-bar-3" x="42" y="22" width="8" height="20" rx="4" fill={`url(#${gradientId})`} />
    </svg>
  );
}

export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.1L2 10.5V21a1 1 0 0 0 1 1h6v-7h6v7h6a1 1 0 0 0 1-1V10.5L12 2.1z" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8.5" cy="8" r="3.3" />
      <path d="M2 20c0-3.7 2.9-6.2 6.5-6.2S15 16.3 15 20z" />
      <circle cx="17" cy="8.7" r="2.6" />
      <path d="M14 20c.3-2.8 1.9-4.9 4.3-5.7 2.7.6 4.7 2.9 4.7 5.7z" />
    </svg>
  );
}

export function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="12" width="4" height="9" rx="1.2" />
      <rect x="10" y="5" width="4" height="16" rx="1.2" />
      <rect x="16" y="9" width="4" height="12" rx="1.2" />
    </svg>
  );
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

export function CompassSearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M11 4a7 7 0 104.65 12.24l4.05 4.06a1 1 0 001.42-1.42l-4.06-4.05A7 7 0 0011 4zm-5 7a5 5 0 1110 0 5 5 0 01-10 0z" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  );
}

export function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
    </svg>
  );
}
