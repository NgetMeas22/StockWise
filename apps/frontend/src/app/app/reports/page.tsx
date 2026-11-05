'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
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
  const canViewValuation = hasPermission('reports:valuation');
  const canExport = hasPermission('reports:export');

  const [activeTab, setActiveTab] = useState<'valuation' | 'low-stock' | 'out-of-stock'>('valuation');
  const [valuationGroupBy, setValuationGroupBy] = useState<'category' | 'warehouse'>('category');

  // Query Valuation Report
  const { data: valuationRes, isLoading: isValuationLoading, isFetching: isValuationFetching } = useQuery({
    queryKey: ['report-valuation', valuationGroupBy],
    queryFn: () => apiRequest<any[]>(`/reports/valuation?groupBy=${valuationGroupBy}`),
    enabled: canViewValuation && activeTab === 'valuation',
  });
  const valuationData = valuationRes?.data || [];

  // Query Low Stock Report
  const { data: lowStockRes, isLoading: isLowStockLoading, isFetching: isLowStockFetching } = useQuery({
    queryKey: ['report-low-stock'],
    queryFn: () => apiRequest<any[]>('/reports/low-stock'),
    enabled: activeTab === 'low-stock',
  });
  const lowStockData = lowStockRes?.data || [];

  // Query Out of Stock Report
  const { data: outOfStockRes, isLoading: isOutOfStockLoading, isFetching: isOutOfStockFetching } = useQuery({
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Reports & Analytics</h1>
          <p className="text-sm text-text-muted mt-1">
            Financial valuation, replenishment triggers, and stock availability metrics.
          </p>
        </div>

        <Can permission="reports:export">
          <Button
            variant="outline"
            onClick={() => handleExportCsv(activeTab)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </Can>
      </div>

      {/* Tabs */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {canViewValuation && (
            <button
              onClick={() => setActiveTab('valuation')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'valuation'
                  ? 'bg-slate-900 text-white'
                  : 'text-text-muted hover:text-text hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Inventory Valuation</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('low-stock')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'low-stock'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('out-of-stock')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'out-of-stock'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <PackageX className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
          </button>

          {activeTab === 'valuation' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-text-muted">Group By:</span>
              <button
                onClick={() => setValuationGroupBy('category')}
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  valuationGroupBy === 'category'
                    ? 'bg-accent text-white'
                    : 'bg-slate-100 text-text-muted hover:text-text'
                }`}
              >
                Category
              </button>
              <button
                onClick={() => setValuationGroupBy('warehouse')}
                className={`px-2.5 py-1 text-xs rounded font-medium ${
                  valuationGroupBy === 'warehouse'
                    ? 'bg-accent text-white'
                    : 'bg-slate-100 text-text-muted hover:text-text'
                }`}
              >
                Warehouse
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
                title="No valuation data available"
                description="Inventory valuation will calculate as soon as products with recorded costs are received."
              />
            ) : (
              <>
                {/* Valuation Chart */}
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={valuationData.map((d) => ({
                        name: valuationGroupBy === 'category' ? d.categoryName : d.warehouseName,
                        valuation: Number(d.totalValuation),
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Valuation']}
                      />
                      <Bar dataKey="valuation" fill="#0F766E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-border rounded-[6px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-slate-50 text-text-muted uppercase font-semibold text-[11px]">
                        <th className="px-4 py-3">
                          {valuationGroupBy === 'category' ? 'Category' : 'Warehouse'}
                        </th>
                        <th className="px-4 py-3 text-right">Unique Items</th>
                        <th className="px-4 py-3 text-right">Total Units</th>
                        <th className="px-4 py-3 text-right">Total Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {valuationData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-text">
                            {valuationGroupBy === 'category' ? row.categoryName : row.warehouseName}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-text">
                            {row.itemCount}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-text">
                            {Number(row.totalQuantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-accent">
                            ${Number(row.totalValuation).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-border">
                        <td className="px-4 py-3 text-text">Total Valuation</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {valuationData.reduce((s, r) => s + Number(r.itemCount), 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {valuationData
                            .reduce((s, r) => s + Number(r.totalQuantity), 0)
                            .toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-accent text-sm">
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
                title="No low stock alerts"
                description="All inventory items are currently above their established reorder thresholds."
              />
            ) : (
              <div className="overflow-x-auto border border-border rounded-[6px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 text-text-muted uppercase font-semibold text-[11px]">
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Current Stock</th>
                      <th className="px-4 py-3 text-right">Reorder Threshold</th>
                      <th className="px-4 py-3 text-right">Suggested Replenishment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lowStockData.map((item, idx) => {
                      const onHand = Number(item.quantity_on_hand || 0);
                      const reorder = Number(item.reorder_level || 0);
                      const deficit = Math.max(0, reorder - onHand);

                      return (
                        <tr key={idx} className="hover:bg-amber-50/40">
                          <td className="px-4 py-3 font-mono font-semibold text-text">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 font-medium text-text">{item.name}</td>
                          <td className="px-4 py-3 text-text-muted">{item.category_name}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                            {onHand} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-text-muted">
                            {reorder} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-accent">
                            +{deficit + 10} {item.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                title="No depleted items"
                description="Zero products are currently completely out of stock."
              />
            ) : (
              <div className="overflow-x-auto border border-border rounded-[6px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 text-text-muted uppercase font-semibold text-[11px]">
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Stock on Hand</th>
                      <th className="px-4 py-3 text-right">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {outOfStockData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/40">
                        <td className="px-4 py-3 font-mono font-semibold text-text">
                          {item.sku}
                        </td>
                        <td className="px-4 py-3 font-medium text-text">{item.name}</td>
                        <td className="px-4 py-3 text-text-muted">{item.category_name}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                          0 {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-muted">
                          {item.reorder_level} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

