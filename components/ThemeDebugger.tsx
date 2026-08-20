'use client';
import { useEffect, useState } from 'react';

export function ThemeDebugger() {
  const [theme, setTheme] = useState('unknown');

  useEffect(() => {
    const checkTheme = () => {
      // Auto-detect system preference
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Apply theme class
      if (isSystemDark) {
        document.documentElement.classList.add('dark');
        setTheme('dark');
      } else {
        document.documentElement.classList.remove('dark');
        setTheme('light');
      }

      // Log computed background colors
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const mainElement = document.querySelector('main');
      const mainBg = mainElement ? window.getComputedStyle(mainElement).backgroundColor : 'n/a';
      
      console.log('--- Theme Debugger ---');
      console.log('System Theme Applied:', isSystemDark ? 'dark' : 'light');
      console.log('Body background:', bodyBg);
      console.log('Main background:', mainBg);
    };

    checkTheme();
    
    // Observar cambios en la clase del elemento raíz
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 p-2 bg-black text-white text-xs rounded opacity-70">
      Theme: {theme}
    </div>
  );
}
