'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ArrowRight, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';
import { useTranslation } from '../../i18n/i18n-context';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Public Top Navbar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-text leading-tight">StockWise</span>
              <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Catalog & Inventory</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <Link href="/catalog" className="hover:text-accent transition-colors">Browse Catalog</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text hover:bg-surface-muted transition-colors text-xs font-medium"
              title="Change Display Language"
            >
              <Globe className="w-3.5 h-3.5 text-text-muted" />
              <span className="hidden sm:inline">{language === 'en' ? 'ភាសាខ្មែរ 🇰🇭' : 'English 🇺🇸'}</span>
              <span className="sm:hidden">{language === 'en' ? 'KH' : 'EN'}</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-[6px] border border-border bg-surface text-text hover:bg-surface-muted transition-colors"
              title="Toggle Dark / Light Theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-[6px] bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm ml-1"
            >
              <span>Staff Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="bg-surface border-t border-border mt-16 py-12 text-sm text-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <span className="font-semibold text-text">StockWise IMS</span>
            <span className="text-text-muted">· Enterprise Inventory & Supply System</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>Server-side verified</span>
            <span>Immutable Ledger</span>
            <span>WCAG 2.2 AA Design</span>
          </div>
          <div className="text-xs text-text-muted">
            © {new Date().getFullYear()} StockWise Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
