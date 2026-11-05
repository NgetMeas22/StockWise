import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number | null;
  subtext?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  isLoading = false,
}: StatCardProps) {
  const borderColors = {
    default: 'border-border',
    accent: 'border-accent/40',
    warning: 'border-amber-300 dark:border-amber-800/60',
    danger: 'border-rose-300 dark:border-rose-800/60',
  };

  const iconColors = {
    default: 'text-text-muted bg-surface-muted',
    accent: 'text-accent bg-accent-soft',
    warning: 'text-warn bg-amber-50 dark:bg-amber-950/40',
    danger: 'text-danger bg-red-50 dark:bg-rose-950/40',
  };

  if (isLoading) {
    return (
      <div className="bg-surface p-5 rounded-[8px] border border-border animate-pulse shadow-subtle">
        <div className="h-4 w-24 bg-surface-muted rounded mb-3"></div>
        <div className="h-8 w-32 bg-surface-muted rounded mb-2"></div>
        <div className="h-3 w-40 bg-surface-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className={`bg-surface p-5 rounded-[8px] border ${borderColors[variant]} shadow-subtle transition-all duration-150 hover:shadow-card`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColors[variant]} transition-colors`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-text font-mono">
        {value !== null && value !== undefined ? value : '—'}
      </div>
      {subtext && <div className="text-xs text-text-muted mt-2 leading-tight">{subtext}</div>}
    </div>
  );
}
