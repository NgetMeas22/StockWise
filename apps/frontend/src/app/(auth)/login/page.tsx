'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { Package, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/ui/FormField';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-muted">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text">StockWise IMS</span>
        </Link>
        <h2 className="text-center text-xl font-bold tracking-tight text-text">
          Sign in to Staff Portal
        </h2>
        <p className="mt-1 text-center text-xs text-text-muted">
          Enterprise inventory, ledger auditing & purchasing access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 sm:px-10 rounded-[8px] border border-border shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-3 rounded-[6px] bg-red-50 border border-red-200 text-danger text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Email address" required>
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

            <FormField label="Password" required>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </FormField>

            <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 text-center">
              Quick Role Test Credentials
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
            ← Back to Public Product Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

