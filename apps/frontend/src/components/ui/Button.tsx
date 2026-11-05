import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-accent text-white hover:bg-accent-hover shadow-sm active:translate-y-[0.5px]',
    secondary:
      'bg-surface-muted text-text hover:bg-slate-200 dark:hover:bg-slate-700 active:translate-y-[0.5px]',
    outline:
      'border border-border bg-surface text-text hover:bg-surface-muted active:translate-y-[0.5px]',
    danger:
      'bg-danger text-white hover:bg-red-700 active:translate-y-[0.5px] shadow-sm',
    ghost:
      'hover:bg-surface-muted text-text-muted hover:text-text',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-[6px] gap-1.5',
    md: 'h-9 px-4 text-sm rounded-[6px] gap-2',
    lg: 'h-11 px-6 text-base rounded-[8px] gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
