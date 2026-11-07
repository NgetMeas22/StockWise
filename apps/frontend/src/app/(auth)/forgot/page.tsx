'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sun, Moon, Globe, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/ui/FormField';
import { useTheme } from '../../../lib/theme-context';
import { useTranslation } from '../../../i18n/i18n-context';
import { useToast } from '../../../lib/toast-context';
import { apiRequest } from '../../../lib/api-client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const toast = useToast();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await apiRequest<{ message: string; devCode?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.data?.devCode) {
        setDevCode(res.data.devCode);
        setCode(res.data.devCode);
      }

      toast.success(
        language === 'kh' ? 'បានផ្ញើកូដផ្ទៀងផ្ទាត់' : 'Verification Code Sent',
        language === 'kh' ? 'សូមពិនិត្យអ៊ីមែលរបស់អ្នកដើម្បីទទួលបានកូដ ៦ ខ្ទង់។' : 'Please check your email for the 6-digit reset code.'
      );
      setStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request reset code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 10) {
      setErrorMsg(language === 'kh' ? 'លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ១០ តួអក្សរ' : 'Password must be at least 10 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(language === 'kh' ? 'លេខសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });

      toast.success(
        language === 'kh' ? 'បានផ្លាស់ប្តូរលេខសម្ងាត់ដោយជោគជ័យ' : 'Password Reset Successfully',
        language === 'kh' ? 'អ្នកអាចចូលប្រើប្រាស់ដោយប្រើលេខសម្ងាត់ថ្មីបានហើយ។' : 'You can now sign in with your new password.'
      );

      router.push('/login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Please verify your code.');
    } finally {
      setIsLoading(false);
    }
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex flex-col items-center justify-center gap-2 mb-4 group">
          <img
            src="/images/dental-logo.webp"
            alt="Dental Systems Platform"
            className="h-16 w-auto object-contain bg-white rounded-xl p-2 border border-border shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-lg tracking-tight text-text">Dental Systems Inventory</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-text">
          {language === 'kh' ? 'ភ្លេចលេខសម្ងាត់របស់អ្នក?' : 'Forgot My Password!'}
        </h2>
        <p className="mt-1 text-xs text-text-muted max-w-xs mx-auto">
          {step === 'request'
            ? language === 'kh'
              ? 'បញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់អ្នក ហើយយើងនឹងផ្ញើកូដ ៦ ខ្ទង់ដើម្បីកំណត់លេខសម្ងាត់ឡើងវិញ។'
              : 'Enter your email address, and we will send you a 6-digit code to reset your password.'
            : language === 'kh'
            ? 'បញ្ចូលកូដ ៦ ខ្ទង់ដែលបានផ្ញើទៅអ៊ីមែលរបស់អ្នក រួចកំណត់លេខសម្ងាត់ថ្មី។'
            : 'Enter the 6-digit verification code sent to your email and set your new password.'}
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

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <FormField
                label={language === 'kh' ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}
                required
              >
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    placeholder="doctor@dentalsystems.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                loadingText={language === 'kh' ? 'កំពុងផ្ញើ...' : 'Sending Reset Code...'}
              >
                <span>{language === 'kh' ? 'ផ្ញើកូដកំណត់ឡើងវិញ' : 'Send Reset Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-surface-muted/60 border border-border rounded-[6px] text-xs flex items-center justify-between">
                <span className="text-text-muted truncate max-w-[220px]">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-accent hover:underline text-[11px] font-semibold"
                >
                  {language === 'kh' ? 'ប្តូរអ៊ីមែល' : 'Change'}
                </button>
              </div>

              {devCode && (
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                  <span>Dev Preview Code: <strong className="font-mono tracking-widest text-sm">{devCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCode(devCode)}
                    className="text-[11px] font-bold underline"
                  >
                    Auto Fill
                  </button>
                </div>
              )}

              <FormField
                label={language === 'kh' ? 'កូដផ្ទៀងផ្ទាត់ (៦ ខ្ទង់)' : 'Verification Code (6 Digits)'}
                required
              >
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-9 font-mono tracking-widest text-center text-base font-bold"
                    autoFocus
                  />
                </div>
              </FormField>

              <FormField
                label={language === 'kh' ? 'លេខសម្ងាត់ថ្មី' : 'New Password'}
                required
              >
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <FormField
                label={language === 'kh' ? 'បញ្ជាក់លេខសម្ងាត់ថ្មី' : 'Confirm New Password'}
                required
              >
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                loadingText={language === 'kh' ? 'កំពុងកំណត់...' : 'Updating Password...'}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'kh' ? 'កំណត់លេខសម្ងាត់ឡើងវិញ' : 'Reset Password'}</span>
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'kh' ? 'ត្រឡប់ទៅទំព័រចូលប្រើ' : 'Back to Login'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

