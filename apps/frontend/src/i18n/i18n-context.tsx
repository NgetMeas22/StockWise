'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Language, LanguageOption } from './types';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './config';
import { translations } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  languages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const path = window.location.pathname;
      if (path.startsWith('/en')) {
        setLanguageState('en');
        localStorage.setItem('stockwise_lang', 'en');
      } else if (path.startsWith('/kh')) {
        setLanguageState('kh');
        localStorage.setItem('stockwise_lang', 'kh');
      } else {
        const stored = localStorage.getItem('stockwise_lang') as Language | null;
        if (stored && (stored === 'en' || stored === 'kh')) {
          setLanguageState(stored);
        } else {
          const browserLang = navigator.language.toLowerCase();
          if (browserLang.startsWith('km') || browserLang.startsWith('kh')) {
            setLanguageState('kh');
          }
        }
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = language === 'kh' ? 'km' : 'en';
  }, [language, mounted]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('stockwise_lang', newLang);
      document.documentElement.lang = newLang === 'kh' ? 'km' : 'en';

      // Update URL prefix smoothly if desired
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        let cleanPath = currentPath;
        if (cleanPath.startsWith('/en')) cleanPath = cleanPath.slice(3) || '/';
        else if (cleanPath.startsWith('/kh')) cleanPath = cleanPath.slice(3) || '/';

        const newPath = newLang === 'en' ? `/en${cleanPath === '/' ? '' : cleanPath}` : `/kh${cleanPath === '/' ? '' : cleanPath}`;
        window.history.replaceState(null, '', newPath + window.location.search);
      }
    } catch {}
  };

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const [section, key] = path.split('.');
      if (!section || !key) return path;

      const langDict = translations[language];
      let value = langDict?.[section]?.[key];

      // Fallback to English if missing in chosen language
      if (!value) {
        value = translations.en?.[section]?.[key];
      }

      // Cross-fallback to common section if available (e.g. actions.cancel -> common.cancel)
      if (!value && section !== 'common') {
        value = langDict?.common?.[key] || translations.en?.common?.[key];
      }

      // If still missing, format key cleanly instead of leaking raw path
      if (!value) {
        value = path;
      }

      // Interpolate parameters like {count}
      if (params && value) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          value = value.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        });
      }

      return value;
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
