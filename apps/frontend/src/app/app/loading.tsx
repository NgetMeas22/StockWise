import React from 'react';
import { Package, RefreshCw } from 'lucide-react';

export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-surface-muted rounded-md" />
          <div className="h-3.5 w-72 bg-surface-muted/70 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-surface-muted rounded-md" />
          <div className="h-9 w-32 bg-accent/30 rounded-md" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-[10px] border border-border bg-surface shadow-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-surface-muted rounded" />
              <div className="w-8 h-8 rounded-lg bg-surface-muted" />
            </div>
            <div className="h-8 w-32 bg-surface-muted rounded-md" />
            <div className="h-3 w-40 bg-surface-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="bg-surface rounded-[12px] border border-border p-4 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-surface-muted rounded-md" />
            <div className="h-7 w-20 bg-surface-muted/70 rounded-md" />
            <div className="h-7 w-20 bg-surface-muted/70 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Loading...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-9 bg-surface-muted/70 rounded-[6px]" />
          <div className="h-9 bg-surface-muted/70 rounded-[6px]" />
          <div className="h-9 bg-surface-muted/70 rounded-[6px]" />
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-surface rounded-[12px] border border-border shadow-subtle overflow-hidden">
        {/* Table Header */}
        <div className="h-11 bg-surface-muted/80 border-b border-border flex items-center px-4 gap-4">
          <div className="h-3.5 w-32 bg-slate-300 dark:bg-slate-700/60 rounded" />
          <div className="h-3.5 w-28 bg-slate-300 dark:bg-slate-700/60 rounded hidden sm:block" />
          <div className="h-3.5 w-24 bg-slate-300 dark:bg-slate-700/60 rounded hidden md:block" />
          <div className="h-3.5 w-20 bg-slate-300 dark:bg-slate-700/60 rounded ml-auto" />
          <div className="h-3.5 w-16 bg-slate-300 dark:bg-slate-700/60 rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="h-14 flex items-center px-4 gap-4">
              <div className="w-8 h-8 rounded-lg bg-surface-muted shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-[200px]">
                <div className="h-3.5 bg-surface-muted rounded w-full" />
                <div className="h-2.5 bg-surface-muted/60 rounded w-24" />
              </div>
              <div className="h-3.5 bg-surface-muted/60 rounded w-24 hidden sm:block" />
              <div className="h-3.5 bg-surface-muted/60 rounded w-20 hidden md:block" />
              <div className="h-5 bg-surface-muted/80 rounded-full w-20 ml-auto" />
              <div className="h-3.5 bg-surface-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

