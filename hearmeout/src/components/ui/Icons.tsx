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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
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
