'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/i18n-context';

interface StockBadgeProps {
  quantity: number | string;
  reorderLevel: number | string;
}

export function StockBadge({ quantity, reorderLevel }: StockBadgeProps) {
  const { t } = useTranslation();
  const qty = Number(quantity);
  const reorder = Number(reorderLevel);

  if (qty <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-rose-950/40 text-danger dark:text-rose-400 border border-red-200 dark:border-rose-800/60 transition-colors">
        <XCircle className="w-3.5 h-3.5" />
        {t('products.outOfStock')}
      </span>
    );
  }

  if (qty <= reorder) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-warn dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 transition-colors">
        <AlertTriangle className="w-3.5 h-3.5" />
        {t('products.lowStock')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-ok dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 transition-colors">
      <CheckCircle2 className="w-3.5 h-3.5" />
      {t('products.inStock')}
    </span>
  );
}
