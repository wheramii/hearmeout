'use client';

import type { ReactNode } from 'react';
import { useApp } from '@/lib/AppContext';
import { PremiumBadge } from './PremiumBadge';

// Wraps a finished, working premium feature and shows a locked, dimmed
// preview instead of the real thing when the viewer isn't premium — the
// feature exists and is real, it's just inaccessible until billing exists.
// The API routes behind these features check is_premium server-side too
// (this is presentation-only, not the actual gate).
export function PremiumLock({ children, label }: { children: ReactNode; label?: string }) {
  const { t, me } = useApp();
  if (me?.isPremium) return <>{children}</>;
  return (
    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ pointerEvents: 'none', filter: 'blur(3px)', opacity: 0.5, userSelect: 'none' }} aria-hidden>
        {children}
      </div>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 8, background: 'rgba(var(--bg-rgb),.55)', textAlign: 'center', padding: 16,
        }}
      >
        <PremiumBadge />
        <p style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 260, margin: 0 }}>{label || t('premium.comingSoon')}</p>
      </div>
    </div>
  );
}
