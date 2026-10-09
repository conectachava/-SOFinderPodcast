'use client';
import { useEffect } from 'react';

export function ThemeDebugger() {
  useEffect(() => {
    const syncInitialTheme = () => {
      try {
        const pref = localStorage.getItem('sf_theme_preference') || 'system';
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark =
          pref === 'dark' || (pref === 'system' && isSystemDark);

        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.dataset.theme = 'dark';
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.dataset.theme = 'light';
          document.documentElement.style.colorScheme = 'light';
        }
      } catch {
        // Fallback to system preference if localStorage is unavailable
      }
    };

    syncInitialTheme();
  }, []);

  return null;
}
