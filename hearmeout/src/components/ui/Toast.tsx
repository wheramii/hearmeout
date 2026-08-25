'use client';

import { useApp } from '@/lib/AppContext';

export function Toast() {
  const { state } = useApp();
  return (
    <div className={`toast ${state.toast ? 'show' : ''}`}>{state.toast}</div>
  );
}
