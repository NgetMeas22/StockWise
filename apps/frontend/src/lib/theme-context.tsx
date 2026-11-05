'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccentColor = 'teal' | 'emerald' | 'blue' | 'indigo' | 'violet';
export type InterfaceDensity = 'comfortable' | 'compact';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
  density: InterfaceDensity;
  setDensity: (density: InterfaceDensity) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [accentColor, setAccentColorState] = useState<AccentColor>('teal');
  const [density, setDensityState] = useState<InterfaceDensity>('comfortable');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('stockwise_theme') as Theme | null;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme);
      }

      const storedAccent = localStorage.getItem('stockwise_accent') as AccentColor | null;
      if (storedAccent && ['teal', 'emerald', 'blue', 'indigo', 'violet'].includes(storedAccent)) {
        setAccentColorState(storedAccent);
      }

      const storedDensity = localStorage.getItem('stockwise_density') as InterfaceDensity | null;
      if (storedDensity && ['comfortable', 'compact'].includes(storedDensity)) {
        setDensityState(storedDensity);
      }
    } catch {
      // Storage unavailable fallback
    }
    setMounted(true);
  }, []);

  // Compute resolved theme & apply to <html> element
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const computeTheme = (): ResolvedTheme => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };

    const resolved = computeTheme();
    setResolvedTheme(resolved);

    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply accent color
    root.setAttribute('data-accent', accentColor);

    // Apply density
    root.setAttribute('data-density', density);

    // System theme listener
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        if (newResolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, accentColor, density, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('stockwise_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setAccentColor = (newAccent: AccentColor) => {
    setAccentColorState(newAccent);
    try {
      localStorage.setItem('stockwise_accent', newAccent);
    } catch {}
  };

  const setDensity = (newDensity: InterfaceDensity) => {
    setDensityState(newDensity);
    try {
      localStorage.setItem('stockwise_density', newDensity);
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        accentColor,
        setAccentColor,
        density,
        setDensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

