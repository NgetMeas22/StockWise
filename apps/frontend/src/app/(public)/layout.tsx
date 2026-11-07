'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Layers,
  Calendar,
  ClipboardList,
  FileText,
  Activity,
  Users,
  CreditCard,
  Building2,
  QrCode,
  ShieldAlert,
  BarChart3,
  X,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../lib/theme-context';
import { useTranslation } from '../../i18n/i18n-context';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Close mega menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
        setResourcesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text selection:bg-accent selection:text-white">
      {/* Public Top Navbar - Medicasimple Clean Floating Style */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-2">
          {/* Logo Brand Pill */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/dental-logo.webp"
              alt="Dental Systems Platform"
              className="h-10 sm:h-11 w-auto object-contain rounded-lg bg-white p-1 border border-border shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-text leading-tight group-hover:text-accent transition-colors">
                Dental Systems
              </span>
              <span className="text-[10px] text-text-muted font-medium tracking-wide">
                Inventory Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav ref={megaMenuRef} className="hidden lg:flex items-center gap-1 text-sm font-semibold text-text-muted">
            {/* Features Dropdown with Mega Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFeaturesOpen(!featuresOpen);
                  setResourcesOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors ${
                  featuresOpen ? 'text-accent bg-accent/10' : 'hover:text-text hover:bg-surface-muted'
                }`}
              >
                <span>{language === 'kh' ? 'មុខងារ' : 'Features'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    featuresOpen ? 'rotate-180 text-accent' : ''
                  }`}
                />
              </button>

              {/* Mega Menu Dropdown */}
              {featuresOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[880px] bg-surface border border-border rounded-2xl shadow-2xl p-6 grid grid-cols-4 gap-6 animate-in fade-in zoom-in-95 z-50">
                  {/* Col 1: Patient Flow */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      01 Patient Flow
                    </div>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Scheduling
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Online Booking
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Recurring Appointments
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Patient Portal
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Patient Documents
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Col 2: Clinical Records */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      02 Clinical Records
                    </div>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Digital Treatment Forms
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Treatment Planning
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Treatment Costs
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Dental Charting
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          X-Ray Integration
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Col 3: Engage & Scale */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      03 Engage & Scale
                    </div>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Communication & Automation
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Patient Surveys
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Task Management
                        </Link>
                      </li>
                      <li>
                        <Link href="/features" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface-muted text-text font-medium transition-colors">
                          Multi-location Clinics
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Col 4: Finance & Ops (Highlighted Feature) */}
                  <div className="space-y-3 bg-surface-muted/40 p-3 rounded-xl border border-border/80">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-accent" />
                      04 Finance & Ops
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      <li>
                        {/* Prominently Highlighted Inventory Management like Medicasimple video */}
                        <Link
                          href="/features"
                          onClick={() => setFeaturesOpen(false)}
                          className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-accent text-white font-bold shadow-xs transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Inventory Management</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/app/requests" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface text-text font-medium transition-colors">
                          Digital Room Requests
                        </Link>
                      </li>
                      <li>
                        <Link href="/catalog" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface text-text font-medium transition-colors">
                          Supplies Catalog
                        </Link>
                      </li>
                      <li>
                        <Link href="/pricing" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface text-text font-medium transition-colors">
                          Analytics & Reporting
                        </Link>
                      </li>
                      <li>
                        <Link href="/pricing" onClick={() => setFeaturesOpen(false)} className="block py-1 px-2 rounded-md hover:bg-surface text-text font-medium transition-colors">
                          API & Integrations
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setResourcesOpen(!resourcesOpen);
                  setFeaturesOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors ${
                  resourcesOpen ? 'text-accent bg-accent/10' : 'hover:text-text hover:bg-surface-muted'
                }`}
              >
                <span>{language === 'kh' ? 'ធនធាន' : 'Resources'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {resourcesOpen && (
                <div className="absolute top-full left-0 mt-3 w-56 bg-surface border border-border rounded-xl shadow-xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 text-xs">
                  <Link
                    href="/catalog"
                    onClick={() => setResourcesOpen(false)}
                    className="block p-2 rounded-lg hover:bg-surface-muted font-medium text-text"
                  >
                    Clinical Product Catalog
                  </Link>
                  <Link
                    href="/features"
                    onClick={() => setResourcesOpen(false)}
                    className="block p-2 rounded-lg hover:bg-surface-muted font-medium text-text"
                  >
                    Workflow User Guides
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setResourcesOpen(false)}
                    className="block p-2 rounded-lg hover:bg-surface-muted font-medium text-text"
                  >
                    Dental Clinic ROI Calculator
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-full hover:text-text hover:bg-surface-muted transition-colors"
            >
              {language === 'kh' ? 'តម្លៃសេវា' : 'Pricing'}
            </Link>

            <Link
              href="/catalog"
              className="px-3.5 py-2 rounded-full hover:text-text hover:bg-surface-muted transition-colors"
            >
              {language === 'kh' ? 'កាតាឡុកទំនិញ' : 'Catalog'}
            </Link>

            <Link
              href="/about-us"
              className="px-3.5 py-2 rounded-full hover:text-text hover:bg-surface-muted transition-colors"
            >
              {language === 'kh' ? 'អំពីយើង' : 'About Us'}
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-surface text-text hover:bg-surface-muted transition-colors text-xs font-semibold"
              title="Change Display Language"
            >
              <Globe className="w-3.5 h-3.5 text-text-muted" />
              <span>{language === 'en' ? 'KH' : 'EN'}</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full border border-border bg-surface text-text hover:bg-surface-muted transition-colors"
              title="Toggle Dark / Light Theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Login Link */}
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-text hover:text-accent transition-colors"
            >
              {language === 'kh' ? 'ចូលប្រើ' : 'Login'}
            </Link>

            {/* "Try the product" Prominent Pill Button (Exact Medicasimple CTA) */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-accent text-white hover:bg-accent-hover transition-all shadow-sm hover:shadow"
            >
              <span>{language === 'kh' ? 'សាកល្បងឥតគិតថ្លៃ' : 'Try the product'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer - Medicasimple Clean Style */}
      <footer className="bg-surface border-t border-border mt-20 py-14 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/dental-logo.webp"
                alt="Dental Systems Platform"
                className="h-9 w-auto object-contain bg-white rounded-lg p-1 border border-border shadow-2xs"
              />
              <span className="font-bold text-text text-sm">Dental Systems</span>
            </div>
            <p className="text-text-muted leading-relaxed max-w-xs">
              Complete dental inventory management, room replenishment queues, and treatment-linked material traceability.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-text mb-3 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="hover:text-accent transition-colors">Inventory Management</Link></li>
              <li><Link href="/features" className="hover:text-accent transition-colors">Barcode Scanning</Link></li>
              <li><Link href="/features" className="hover:text-accent transition-colors">Procedure Deduction</Link></li>
              <li><Link href="/pricing" className="hover:text-accent transition-colors">Pricing & Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-text mb-3 uppercase tracking-wider text-[11px]">Solutions & Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about-us" className="hover:text-accent transition-colors font-medium">About Our Mission</Link></li>
              <li><Link href="/catalog" className="hover:text-accent transition-colors">Supplies Catalog</Link></li>
              <li><Link href="/app/requests" className="hover:text-accent transition-colors">Room Requests</Link></li>
              <li><Link href="/login" className="hover:text-accent transition-colors">Staff Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-text mb-3 uppercase tracking-wider text-[11px]">Contact & Support</h4>
            <p className="text-text-muted leading-relaxed">
              Phnom Penh, Cambodia<br />
              Email: support@dentalsystems.com<br />
              Phone: +855 23 888 999
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 text-[10px]">
              © {new Date().getFullYear()} Dental Systems. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
