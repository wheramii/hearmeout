'use client';

import { useApp } from '@/lib/AppContext';
import { AppShell } from './AppShell';
import { RegisterModal } from './RegisterModal';
import { OnboardingScreen } from './OnboardingScreen';
import { LogoMark } from './ui/Icons';

export function AppGate() {
  const { state } = useApp();
  if (state.authStatus === 'loading') {
    // A branded splash instead of a bare "Загрузка…" — this is also the
    // actual server-rendered HTML for the brief moment before auth state
    // resolves client-side, so it's what a slow connection or a messenger
    // link-preview crawler sees first, not empty text.
    return (
      <div className="app-splash">
        <LogoMark size={56} />
        <div className="app-splash-name">Hear<span>Me</span>Out</div>
      </div>
    );
  }
  if (state.authStatus === 'anonymous') {
    return <RegisterModal />;
  }
  return (
    <>
      <AppShell />
      {state.justRegistered && <OnboardingScreen />}
    </>
  );
}
