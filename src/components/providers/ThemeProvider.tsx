'use client';
import { useEffect } from 'react';
import type { ThemeMode } from '@/lib/theme';
import { resolveTheme } from '@/lib/theme';

function applyResolvedTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = (localStorage.getItem('theme') as ThemeMode | null) ?? 'auto';
    applyResolvedTheme(stored);

    const fontSize = localStorage.getItem('fontSize');
    if (fontSize) {
      document.documentElement.style.fontSize =
        fontSize === 'klein' ? '14px' : fontSize === 'gross' ? '18px' : '16px';
    }

    // Re-check auto theme every minute
    const interval = setInterval(() => {
      const current = (localStorage.getItem('theme') as ThemeMode | null) ?? 'auto';
      if (current === 'auto') applyResolvedTheme('auto');
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
