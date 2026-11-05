import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-surface-muted text-text-muted border-border',
    neutral: 'bg-surface-muted text-text-muted border-border',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-ok dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-warn dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    danger: 'bg-red-50 dark:bg-red-950/40 text-danger dark:text-rose-400 border-red-200 dark:border-rose-800/60',
    info: 'bg-sky-50 dark:bg-sky-950/40 text-info dark:text-sky-400 border-sky-200 dark:border-sky-800/60',
    outline: 'bg-transparent text-text border-border',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border select-none transition-colors',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
}
