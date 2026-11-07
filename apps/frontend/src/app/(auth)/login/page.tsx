'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { Package, Lock, Mail, AlertCircle, ArrowRight, Sun, Moon, Globe, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/ui/FormField';
import { useTheme } from '../../../lib/theme-context';
import { useTranslation } from '../../../i18n/i18n-context';

export default function LoginPage() {
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-muted relative">
      {/* Top Controls: Theme & Language Switchers */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text hover:bg-surface-muted transition-colors text-xs font-medium"
        >
          <Globe className="w-3.5 h-3.5 text-text-muted" />
          <span>{language === 'en' ? 'ភាសាខ្មែរ 🇰🇭' : 'English 🇺🇸'}</span>
        </button>

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
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex flex-col items-center justify-center gap-2 mb-4 group">
          <img
            src="/images/dental-logo.webp"
            alt="Dental Systems Platform"
            className="h-16 w-auto object-contain bg-white rounded-xl p-2 border border-border shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-lg tracking-tight text-text">Dental Systems Inventory</span>
        </Link>
        <h2 className="text-center text-xl font-bold tracking-tight text-text">
          {t('auth.login')}
        </h2>
        <p className="mt-1 text-center text-xs text-text-muted">
          Staff Portal & Clinical Inventory Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 sm:px-10 rounded-[8px] border border-border shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-3 rounded-[6px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label={t('auth.email')} required>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  placeholder="admin@stockwise.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </FormField>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text">
                  {t('auth.password')} <span className="text-danger">*</span>
                </label>
                <Link
                  href="/forgot"
                  className="text-xs text-accent hover:underline font-medium transition-colors"
                >
                  {language === 'kh' ? 'ភ្លេចលេខសម្ងាត់?' : 'Forgot Password?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
              loadingText={t('auth.signingIn')}
            >
              <span>{t('auth.signIn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 text-center">
              {t('auth.demoAccounts')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@stockwise.local', 'AdminPassword123!')}
                className="p-2 rounded border border-border bg-surface-muted hover:border-accent text-left transition-colors"
              >
                <div className="font-semibold text-text">Administrator</div>
                <div className="text-[10px] text-text-muted">admin@stockwise.local</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('manager@stockwise.local', 'ManagerPassword123!')}
                className="p-2 rounded border border-border bg-surface-muted hover:border-accent text-left transition-colors"
              >
                <div className="font-semibold text-text">Manager</div>
                <div className="text-[10px] text-text-muted">manager@stockwise.local</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff@stockwise.local', 'StaffPassword123!')}
                className="p-2 rounded border border-border bg-surface-muted hover:border-accent text-left transition-colors"
              >
                <div className="font-semibold text-text">Warehouse Staff</div>
                <div className="text-[10px] text-text-muted">staff@stockwise.local</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('viewer@stockwise.local', 'ViewerPassword123!')}
                className="p-2 rounded border border-border bg-surface-muted hover:border-accent text-left transition-colors"
              >
                <div className="font-semibold text-text">Auditor / Viewer</div>
                <div className="text-[10px] text-text-muted">viewer@stockwise.local</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-text-muted">
          <Link href="/" className="hover:text-accent transition-colors">
            {t('auth.backToCatalog')}
          </Link>
        </div>
      </div>
    </div>
  );
}
