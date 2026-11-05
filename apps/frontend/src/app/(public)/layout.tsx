import React from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, ArrowRight, Search } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/catalog" className="hover:text-accent transition-colors">Browse Products</Link>
            <Link href="/catalog/surgical-instruments" className="hover:text-accent transition-colors">Instruments</Link>
            <Link href="/catalog/infection-control-ppe" className="hover:text-accent transition-colors">PPE & Infection Control</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-[6px] bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm"
            >
              Staff Portal
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
            <span className="text-slate-400">· Enterprise Inventory & Supply System</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>Server-side verified</span>
            <span>Immutable Ledger</span>
            <span>WCAG 2.2 AA Design</span>
          </div>
          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} StockWise Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

