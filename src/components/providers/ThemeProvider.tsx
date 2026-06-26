'use client';
import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const actual =
      stored === 'dark' ? 'dark'
      : stored === 'light' ? 'light'
      : prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', actual);

    const fontSize = localStorage.getItem('fontSize');
    if (fontSize) {
      document.documentElement.style.fontSize =
        fontSize === 'klein' ? '14px' : fontSize === 'gross' ? '18px' : '16px';
    }
  }, []);

  return <>{children}</>;
}
