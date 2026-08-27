'use client';

import { useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'hmo-theme';

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as 'dark' | 'light') || 'dark');
  }, []);

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        type="button"
        className={theme === 'dark' ? 'on' : ''}
        onClick={() => { applyTheme('dark'); setTheme('dark'); }}
        aria-label="Dark theme"
      >
        ●
      </button>
      <button
        type="button"
        className={theme === 'light' ? 'on' : ''}
        onClick={() => { applyTheme('light'); setTheme('light'); }}
        aria-label="Light theme"
      >
        ○
      </button>
    </div>
  );
}
