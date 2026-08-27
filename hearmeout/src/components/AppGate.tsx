'use client';

import { useApp } from '@/lib/AppContext';
import { AppShell } from './AppShell';
import { RegisterModal } from './RegisterModal';
import { OnboardingScreen } from './OnboardingScreen';

export function AppGate() {
  const { t, state } = useApp();
  if (state.authStatus === 'loading') {
    return <div className="empty-state" style={{ paddingTop: 60 }}>{t('app.loading')}</div>;
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
