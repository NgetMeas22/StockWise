'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { useTranslation } from '../../i18n/i18n-context';
import { useToast } from '../../lib/toast-context';
import {
  Package,
  LayoutDashboard,
  Boxes,
  Layers,
  ArrowLeftRight,
  Truck,
  ShoppingCart,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BookOpen,
  Sun,
  Moon,
  Languages,
  Bell,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Can } from '../../components/auth/Can';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, logout, isLoading } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useTranslation();
  const { toasts } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white animate-bounce shadow-md">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-text-muted">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: t('nav.dashboard'),
      href: '/app/dashboard',
      icon: LayoutDashboard,
      permission: 'reports:read' as const,
    },
    {
      label: t('nav.products'),
      href: '/app/products',
      icon: Boxes,
      permission: 'products:read' as const,
    },
    {
      label: t('nav.categories'),
      href: '/app/categories',
      icon: Layers,
      permission: 'categories:read' as const,
    },
    {
      label: t('nav.inventory'),
      href: '/app/inventory',
      icon: Package,
      permission: 'inventory:read' as const,
    },
    {
      label: t('nav.movements'),
      href: '/app/inventory/movements',
      icon: ArrowLeftRight,
      permission: 'inventory:read' as const,
    },
    {
      label: t('nav.suppliers'),
      href: '/app/suppliers',
      icon: Truck,
      permission: 'suppliers:read' as const,
    },
    {
      label: t('nav.purchasing'),
      href: '/app/purchases',
      icon: ShoppingCart,
      permission: 'purchases:read' as const,
    },
    {
      label: t('nav.reports'),
      href: '/app/reports',
      icon: BarChart3,
      permission: 'reports:read' as const,
    },
    {
      label: t('nav.users'),
      href: '/app/admin/users',
      icon: Users,
      permission: 'users:read' as const,
    },
    {
      label: t('nav.auditLogs'),
      href: '/app/admin/audit-logs',
      icon: ShieldAlert,
      permission: 'audit_logs:read' as const,
    },
    {
      label: t('nav.settings'),
      href: '/app/settings',
      icon: Settings,
      permission: 'settings:manage' as const,
    },
  ];

  return (
    <div className="min-h-screen flex bg-bg text-text">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop 240px & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-surface">
            <Link href="/app/dashboard" className="flex items-center gap-2.5 min-w-0">
              <img
                src="/images/khema-logo.png"
                alt="Khema Digital Dental Solution"
                className="h-9 w-auto object-contain rounded bg-white p-1 border border-border shadow-2xs shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs tracking-tight text-text leading-tight truncate">
                  Khema Dental
                </span>
                <span className="text-[10px] text-text-muted font-medium truncate">Inventory Suite</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-text-muted hover:bg-surface-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/app/dashboard'
                  ? pathname === '/app/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Can key={item.href} permission={item.permission}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-muted hover:bg-surface-muted hover:text-text'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </Can>
              );
            })}
          </nav>
        </div>

        {/* Public Catalog Link & User Session Footer */}
        <div className="p-3 border-t border-border space-y-2 bg-surface-muted/30">
          <Link
            href="/catalog"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-text-muted" />
              {t('nav.publicCatalog')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          </Link>

          {/* User profile row with integrated Sign Out icon button */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-[8px] bg-surface border border-border hover:border-text-muted/30 transition-colors">
            <Link
              href="/app/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
              title="View & Edit Profile"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-accent/30 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 border border-accent/20">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text truncate group-hover:text-accent transition-colors leading-tight">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider truncate">
                  {role || 'STAFF'}
                </span>
              </div>
            </Link>

            {/* Sign Out Button (Icon Only next to Admin/User Profile) */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 rounded-[6px] text-text-muted hover:text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title={t('nav.signOut') || 'Sign Out'}
              aria-label={t('nav.signOut') || 'Sign Out'}
            >
              <LogOut className="w-4 h-4 text-text-muted hover:text-danger transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-text-muted hover:bg-surface-muted transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
              <span className="hidden sm:inline">StockWise</span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-text-muted/60" />
              <span className="text-text font-semibold capitalize">
                {pathname.split('/')[2]?.replace('-', ' ') || t('nav.dashboard')}
              </span>
            </div>
          </div>

          {/* Right Controls: Language, Theme, Notifications, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-xs font-medium text-text hover:bg-surface-muted transition-colors"
                title="Change Language"
                aria-label="Change Language"
              >
                <Languages className="w-3.5 h-3.5 text-accent" />
                <span className="font-semibold">{language === 'kh' ? 'ភាសាខ្មែរ' : 'EN'}</span>
              </button>

              {showLangDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangDropdown(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-36 bg-surface border border-border rounded-[8px] shadow-card py-1 z-50 text-xs animate-in zoom-in-95 duration-100">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface-muted transition-colors ${
                          language === l.code ? 'font-bold text-accent bg-accent/5' : 'text-text'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </span>
                        {language === l.code && <CheckCircle2 className="w-3.5 h-3.5 text-accent" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle color theme"
              className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown((prev) => !prev)}
                className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors relative"
                title="System Notifications"
                aria-label="View recent notifications"
              >
                <Bell className="w-4 h-4" />
                {toasts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </button>

              {showNotificationsDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotificationsDropdown(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-80 bg-surface border border-border rounded-[8px] shadow-card p-3 z-50 text-xs animate-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 border-b border-border font-semibold text-text">
                      <span>Notifications & Alerts</span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {toasts.length} active
                      </span>
                    </div>

                    <div className="divide-y divide-border max-h-60 overflow-y-auto mt-1">
                      {toasts.length > 0 ? (
                        toasts.map((t) => (
                          <div key={t.id} className="py-2 space-y-0.5">
                            <div className="font-semibold text-text flex items-center gap-1.5">
                              {t.type === 'success' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                              )}
                              <span>{t.title}</span>
                            </div>
                            {t.description && (
                              <p className="text-[11px] text-text-muted leading-tight">{t.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-text-muted text-[11px]">
                          No recent system alerts. All operational status nominal.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Role Badge */}
            {role && (
              <Badge variant="default" className="font-mono text-[10px] uppercase hidden sm:inline-flex">
                {role}
              </Badge>
            )}

            {/* Sign Out Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title={t('nav.signOut')}
              aria-label={t('nav.signOut')}
              className="p-2 rounded-[6px] text-text-muted hover:text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title={t('nav.signOut')}
        message="Are you sure you want to end your current session and sign out of StockWise IMS?"
        confirmLabel={t('nav.signOut')}
        cancelLabel={t('common.cancel')}
        variant="primary"
      />
    </div>
  );
}
