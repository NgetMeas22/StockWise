import React from 'react';
import { Package } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20 animate-bounce">
          <Package className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-semibold tracking-wide text-text-muted">
            Loading StockWise...
          </span>
        </div>
      </div>
    </div>
  );
}

