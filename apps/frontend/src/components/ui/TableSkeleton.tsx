import React from 'react';

export function TableSkeleton({
  rows = 6,
  cols = 5,
  columns,
}: {
  rows?: number;
  cols?: number;
  columns?: number;
}) {
  const columnCount = columns ?? cols;

  return (
    <div className="w-full border border-border rounded-[10px] bg-surface overflow-hidden animate-pulse">
      {/* Table Header Skeleton */}
      <div className="h-11 bg-surface-muted/80 border-b border-border flex items-center px-4 gap-4">
        {Array.from({ length: columnCount }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 bg-slate-300 dark:bg-slate-700/60 rounded ${
              i === 0 ? 'w-40' : i === columnCount - 1 ? 'w-20 ml-auto' : 'flex-1'
            }`}
          />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-13 flex items-center px-4 gap-4 py-3">
            {Array.from({ length: columnCount }).map((_, c) => (
              <div
                key={c}
                className={`h-3 bg-slate-200 dark:bg-slate-800/80 rounded ${
                  c === 0
                    ? 'w-44'
                    : c === columnCount - 1
                    ? 'w-16 ml-auto'
                    : 'flex-1'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
