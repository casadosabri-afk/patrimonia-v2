'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeChoice;
  resolved: 'light' | 'dark';
  setTheme: (theme: ThemeChoice) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'patrimonia-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let stored: ThemeChoice = 'system';
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'light' || value === 'dark') stored = value;
    } catch {
      // Stockage indisponible (navigation privée) : on reste sur le thème système.
    }
    setThemeState(stored);
    setResolved(stored === 'system' ? systemTheme() : stored);
  }, []);

  useEffect(() => {
    const next = theme === 'system' ? systemTheme() : theme;
    setResolved(next);
    document.documentElement.classList.toggle('dark', next === 'dark');

    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setResolved(event.matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', event.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sans stockage, le choix ne survit pas au rechargement : comportement acceptable.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolved,
      setTheme,
      toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
    }),
    [theme, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  return context;
}
