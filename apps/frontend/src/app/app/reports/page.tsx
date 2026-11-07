'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { useTheme } from '../../../lib/theme-context';
import { useTranslation } from '../../../i18n/i18n-context';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  Download,
  AlertTriangle,
  PackageX,
  DollarSign,
  Building2,
  FolderTree,
  RefreshCw,
  Package,
} from 'lucide-react';

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = resolvedTheme === 'dark';

  const chartGridColor = isDark ? '#334155' : '#E2E8F0';
  const chartTextColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  const canViewValuation = hasPermission('reports:valuation');
  const canExport = hasPermission('reports:export');

  const [activeTab, setActiveTab] = useState<'valuation' | 'low-stock' | 'out-of-stock'>('valuation');
  const [valuationGroupBy, setValuationGroupBy] = useState<'category' | 'warehouse'>('category');

  // Query Valuation Report
  const { data: valuationRes, isLoading: isValuationLoading } = useQuery({
    queryKey: ['report-valuation', valuationGroupBy],
    queryFn: () => apiRequest<any[]>(`/reports/valuation?groupBy=${valuationGroupBy}`),
    enabled: canViewValuation && activeTab === 'valuation',
  });
  const valuationData = valuationRes?.data || [];

  // Query Low Stock Report
  const { data: lowStockRes, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['report-low-stock'],
    queryFn: () => apiRequest<any[]>('/reports/low-stock'),
    enabled: activeTab === 'low-stock',
  });
  const lowStockData = lowStockRes?.data || [];

  // Query Out of Stock Report
  const { data: outOfStockRes, isLoading: isOutOfStockLoading } = useQuery({
    queryKey: ['report-out-of-stock'],
    queryFn: () => apiRequest<any[]>('/reports/out-of-stock'),
    enabled: activeTab === 'out-of-stock',
  });
  const outOfStockData = outOfStockRes?.data || [];

  const handleExportCsv = (type: 'valuation' | 'low-stock' | 'out-of-stock') => {
    let url = `/api/reports/${type}?format=csv`;
    if (type === 'valuation') {
      url += `&groupBy=${valuationGroupBy}`;
    }
    window.open(url, '_blank');
  };

  const totalValuationSum = valuationData.reduce(
    (sum, row) => sum + (Number(row.totalValuation) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('reports.title')}</h1>
          <p className="text-sm text-text-muted mt-1">{t('reports.subtitle')}</p>
        </div>

        <Can permission="reports:export">
          <Button
            variant="outline"
            onClick={() => handleExportCsv(activeTab)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('common.exportCsv')}</span>
          </Button>
        </Can>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {canViewValuation && (
            <button
              onClick={() => setActiveTab('valuation')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'valuation'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text hover:bg-surface-muted'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t('reports.valuationTab')}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('low-stock')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'low-stock'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('reports.lowStockTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('out-of-stock')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'out-of-stock'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
            }`}
          >
            <PackageX className="w-3.5 h-3.5" />
            <span>{t('reports.outOfStockTab')}</span>
          </button>

          {activeTab === 'valuation' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-text-muted">{t('reports.groupBy')}:</span>
              <button
                onClick={() => setValuationGroupBy('category')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  valuationGroupBy === 'category'
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-surface-muted text-text-muted hover:text-text'
                }`}
              >
                {t('reports.category')}
              </button>
              <button
                onClick={() => setValuationGroupBy('warehouse')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  valuationGroupBy === 'warehouse'
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-surface-muted text-text-muted hover:text-text'
                }`}
              >
                {t('reports.warehouse')}
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Valuation */}
        {activeTab === 'valuation' && (
          <div className="space-y-6">
            {isValuationLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : valuationData.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title={t('reports.noValuationData')}
                description={t('reports.noValuationDesc')}
              />
            ) : (
              <>
                {/* Valuation Bar Chart */}
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={valuationData.map((d) => ({
                        name: valuationGroupBy === 'category' ? d.categoryName : d.warehouseName,
                        valuation: Number(d.totalValuation),
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: chartTextColor, fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fill: chartTextColor, fontSize: 11 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          borderColor: tooltipBorder,
                          color: tooltipText,
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, t('reports.totalValuation')]}
                      />
                      <Bar dataKey="valuation" fill={isDark ? '#2DD4BF' : '#0F766E'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Valuation Table */}
                <div className="overflow-x-auto border border-border rounded-[6px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted text-text-muted uppercase font-semibold text-[11px]">
                        <th className="px-4 py-3">
                          {valuationGroupBy === 'category' ? t('reports.category') : t('reports.warehouse')}
                        </th>
                        <th className="px-4 py-3 text-right">{t('reports.uniqueItems')}</th>
                        <th className="px-4 py-3 text-right">{t('reports.totalUnits')}</th>
                        <th className="px-4 py-3 text-right">{t('reports.totalValuation')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {valuationData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-muted/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-text">
                            {valuationGroupBy === 'category' ? row.categoryName : row.warehouseName}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-text">
                            {row.itemCount}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-text">
                            {Number(row.totalQuantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-accent">
                            ${Number(row.totalValuation).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-muted font-bold border-t-2 border-border">
                        <td className="px-4 py-3 text-text">{t('reports.totalValuation')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-text">
                          {valuationData.reduce((s, r) => s + Number(r.itemCount), 0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text">
                          {valuationData
                            .reduce((s, r) => s + Number(r.totalQuantity), 0)
                            .toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-accent text-sm">
                          ${totalValuationSum.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Low Stock Alerts */}
        {activeTab === 'low-stock' && (
          <div>
            {isLowStockLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : lowStockData.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title={t('reports.noLowStockData')}
                description={t('reports.noLowStockDesc')}
              />
            ) : (
              <>
                {/* Mobile Card List View (< md) */}
                <div className="md:hidden divide-y divide-border border border-border rounded-[8px] overflow-hidden">
                  {lowStockData.map((item, idx) => {
                    const onHand = Number(item.quantity_on_hand || 0);
                    const reorder = Number(item.reorder_level || 0);
                    const deficit = Math.max(0, reorder - onHand);

                    return (
                      <div key={`m-low-${idx}`} className="p-3.5 space-y-2 bg-surface hover:bg-amber-500/5 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-text leading-snug">{item.name}</div>
                            <div className="text-[10px] text-text-muted font-mono mt-0.5">{item.sku}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap shrink-0">
                            Low Stock
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                          <div>
                            <span className="text-[10px] text-text-muted block">Available</span>
                            <span className="font-bold text-amber-500 tabular-nums">
                              {onHand} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-muted block">Safety Threshold</span>
                            <span className="font-medium text-text-muted tabular-nums">
                              {reorder} {item.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-text-muted block">Suggested</span>
                            <span className="font-bold text-accent tabular-nums">
                              +{deficit + 10} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto border border-border rounded-[6px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted text-text-muted uppercase font-semibold text-[11px]">
                        <th className="px-4 py-3">{t('products.sku')}</th>
                        <th className="px-4 py-3">{t('products.productName')}</th>
                        <th className="px-4 py-3">{t('products.category')}</th>
                        <th className="px-4 py-3 text-right">{t('reports.currentStock')}</th>
                        <th className="px-4 py-3 text-right">{t('reports.reorderThreshold')}</th>
                        <th className="px-4 py-3 text-right">{t('reports.suggestedReplenishment')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lowStockData.map((item, idx) => {
                        const onHand = Number(item.quantity_on_hand || 0);
                        const reorder = Number(item.reorder_level || 0);
                        const deficit = Math.max(0, reorder - onHand);

                        return (
                          <tr key={idx} className="hover:bg-amber-500/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-text">
                              {item.sku}
                            </td>
                            <td className="px-4 py-3 font-medium text-text">{item.name}</td>
                            <td className="px-4 py-3 text-text-muted">{item.category_name}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">
                              {onHand} <span className="text-[10px] font-medium uppercase">{item.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                              {reorder} <span className="text-[10px] uppercase">{item.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-accent">
                              +{deficit + 10} <span className="text-[10px] uppercase">{item.unit}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Out of Stock */}
        {activeTab === 'out-of-stock' && (
          <div>
            {isOutOfStockLoading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : outOfStockData.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t('reports.noOutOfStockData')}
                description={t('reports.noOutOfStockDesc')}
              />
            ) : (
              <>
                {/* Mobile Card List View (< md) */}
                <div className="md:hidden divide-y divide-border border border-border rounded-[8px] overflow-hidden">
                  {outOfStockData.map((item, idx) => (
                    <div key={`m-out-${idx}`} className="p-3.5 space-y-2 bg-surface hover:bg-rose-500/5 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-text leading-snug">{item.name}</div>
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">{item.sku}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap shrink-0">
                          Out of Stock
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                        <div>
                          <span className="text-[10px] text-text-muted block">Category</span>
                          <span className="font-medium text-text">{item.category_name || 'General'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-text-muted block">Reorder Level</span>
                          <span className="font-bold text-amber-500 tabular-nums">
                            {item.reorder_level} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto border border-border rounded-[6px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted text-text-muted uppercase font-semibold text-[11px]">
                        <th className="px-4 py-3">{t('products.sku')}</th>
                        <th className="px-4 py-3">{t('products.productName')}</th>
                        <th className="px-4 py-3">{t('products.category')}</th>
                        <th className="px-4 py-3 text-right">{t('products.stockOnHand')}</th>
                        <th className="px-4 py-3 text-right">{t('products.reorderLevel')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {outOfStockData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-rose-500/10 transition-colors">
                          <td className="px-4 py-3 font-semibold text-text">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 font-medium text-text">{item.name}</td>
                          <td className="px-4 py-3 text-text-muted">{item.category_name}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-rose-600 dark:text-rose-400">
                            0 <span className="text-[10px] font-medium uppercase">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                            {item.reorder_level} <span className="text-[10px] uppercase">{item.unit}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
