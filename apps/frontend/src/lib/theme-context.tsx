'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccentColor =
  | 'teal'
  | 'emerald'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'rose'
  | 'amber'
  | 'coral'
  | 'crimson'
  | 'slate'
  | 'custom';

export type InterfaceDensity = 'comfortable' | 'compact';

export interface AccentPreset {
  key: AccentColor;
  name: string;
  color: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { key: 'teal', name: 'StockWise Teal', color: '#0F766E' },
  { key: 'emerald', name: 'Emerald Green', color: '#10B981' },
  { key: 'cyan', name: 'Ocean Cyan', color: '#06B6D4' },
  { key: 'blue', name: 'Classic Blue', color: '#2563EB' },
  { key: 'indigo', name: 'Modern Indigo', color: '#4F46E5' },
  { key: 'violet', name: 'Royal Violet', color: '#7C3AED' },
  { key: 'purple', name: 'Vibrant Purple', color: '#9333EA' },
  { key: 'rose', name: 'Velvet Rose', color: '#E11D48' },
  { key: 'amber', name: 'Amber Gold', color: '#D97706' },
  { key: 'coral', name: 'Sunset Coral', color: '#EA580C' },
  { key: 'crimson', name: 'Crimson Red', color: '#DC2626' },
  { key: 'slate', name: 'Titanium Slate', color: '#475569' },
];

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
  customColor: string;
  setCustomColor: (hex: string) => void;
  density: InterfaceDensity;
  setDensity: (density: InterfaceDensity) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return hex;
  const num = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [accentColor, setAccentColorState] = useState<AccentColor>('teal');
  const [customColor, setCustomColorState] = useState<string>('#0F766E');
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
      if (storedAccent) {
        setAccentColorState(storedAccent);
      }

      const storedCustomColor = localStorage.getItem('stockwise_custom_color');
      if (storedCustomColor && /^#[0-9A-Fa-f]{6}$/.test(storedCustomColor)) {
        setCustomColorState(storedCustomColor);
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

    if (accentColor === 'custom') {
      root.style.setProperty('--accent', customColor);
      root.style.setProperty('--accent-hover', customColor);
      root.style.setProperty('--accent-soft', hexToRgba(customColor, resolved === 'dark' ? 0.2 : 0.15));
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-hover');
      root.style.removeProperty('--accent-soft');
    }

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
  }, [theme, accentColor, customColor, density, mounted]);

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

  const setCustomColor = (hex: string) => {
    setCustomColorState(hex);
    setAccentColorState('custom');
    try {
      localStorage.setItem('stockwise_custom_color', hex);
      localStorage.setItem('stockwise_accent', 'custom');
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
        customColor,
        setCustomColor,
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
