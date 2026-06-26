'use client';
import { useEffect } from 'react';

function getAutoTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

function applyResolvedTheme(mode: string) {
  const actual =
    mode === 'dark'  ? 'dark' :
    mode === 'light' ? 'light' :
    getAutoTheme();
  document.documentElement.setAttribute('data-theme', actual);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') ?? 'auto';
    applyResolvedTheme(stored);

    const fontSize = localStorage.getItem('fontSize');
    if (fontSize) {
      document.documentElement.style.fontSize =
        fontSize === 'klein' ? '14px' : fontSize === 'gross' ? '18px' : '16px';
    }

    // Re-check auto theme every minute
    const interval = setInterval(() => {
      const current = localStorage.getItem('theme') ?? 'auto';
      if (current === 'auto') applyResolvedTheme('auto');
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
