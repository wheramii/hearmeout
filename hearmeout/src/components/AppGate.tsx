'use client';

import { useApp } from '@/lib/AppContext';
import { AppShell } from './AppShell';
import { RegisterModal } from './RegisterModal';

export function AppGate() {
  const { state } = useApp();
  if (state.authStatus === 'loading') {
    return <div className="empty-state" style={{ paddingTop: 60 }}>Загрузка…</div>;
  }
  if (state.authStatus === 'anonymous') {
    return <RegisterModal />;
  }
  return <AppShell />;
}
