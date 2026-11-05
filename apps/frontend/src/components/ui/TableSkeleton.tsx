import React from 'react';

export function TableSkeleton({
  rows = 5,
  cols = 4,
  columns,
}: {
  rows?: number;
  cols?: number;
  columns?: number;
}) {
  const columnCount = columns ?? cols;
  return (
    <div className="w-full border border-border rounded-[8px] bg-surface overflow-hidden animate-pulse">
      <div className="h-10 bg-surface-muted border-b border-border flex items-center px-4 gap-4">
        {Array.from({ length: columnCount }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-300 dark:bg-slate-700/60 rounded flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-12 flex items-center px-4 gap-4">
            {Array.from({ length: columnCount }).map((_, c) => (
              <div key={c} className="h-3.5 bg-slate-200 dark:bg-slate-800/60 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
