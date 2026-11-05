'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { DashboardSummaryDTO } from '@stockwise/shared';
import {
  Boxes,
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Can } from '../../../components/auth/Can';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiRequest<DashboardSummaryDTO>('/reports/summary'),
  });

  const summary = data?.data;
  const metrics = summary?.metrics;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">Operations Dashboard</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time inventory levels, ledger metrics, and stock movement telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isRefetching}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Data
          </Button>
          <Can permission="inventory:receive">
            <Link href="/app/inventory">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Receive Stock
              </Button>
            </Link>
          </Can>
        </div>
      </div>

      {/* 5 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Products"
          value={metrics?.activeProductsCount ?? null}
          subtext="Catalog items enabled"
          icon={Boxes}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Stock"
          value={metrics?.totalStockQuantity ? Number(metrics.totalStockQuantity).toLocaleString() : null}
          subtext="Units on hand (all hubs)"
          icon={Package}
          isLoading={isLoading}
        />
        <StatCard
          label="Inventory Valuation"
          value={
            metrics?.inventoryValuation !== null && metrics?.inventoryValuation !== undefined
              ? `$${Number(metrics.inventoryValuation).toLocaleString()}`
              : 'Restricted'
          }
          subtext="Weighted average cost basis"
          icon={DollarSign}
          variant="accent"
          isLoading={isLoading}
        />
        <StatCard
          label="Low Stock Items"
          value={metrics?.lowStockCount ?? null}
          subtext="At or below reorder level"
          icon={AlertTriangle}
          variant="warning"
          isLoading={isLoading}
        />
        <StatCard
          label="Out of Stock"
          value={metrics?.outOfStockCount ?? null}
          subtext="Zero balance recorded"
          icon={XCircle}
          variant="danger"
          isLoading={isLoading}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category Bar Chart */}
        <div className="bg-surface p-5 rounded-[8px] border border-border shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text">Stock Distribution by Category</h3>
            <p className="text-xs text-text-muted mt-0.5">Total unit count across active divisions</p>
          </div>
          <div className="h-64 w-full">
            {summary?.stockByCategory && summary.stockByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.stockByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="categoryName"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="totalQuantity" fill="#0F766E" radius={[4, 4, 0, 0]} name="Quantity on Hand" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No inventory data available for categories
              </div>
            )}
          </div>
        </div>

        {/* Movements per Day Area Chart */}
        <div className="bg-surface p-5 rounded-[8px] border border-border shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text">Movement Velocity (Last 14 Days)</h3>
            <p className="text-xs text-text-muted mt-0.5">Daily volume of receipts, issues and adjustments</p>
          </div>
          <div className="h-64 w-full">
            {summary?.movementsPerDay && summary.movementsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.movementsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="receipts" stackId="1" stroke="#0F766E" fill="#CCFBF1" name="Receipts" />
                  <Area type="monotone" dataKey="issues" stackId="1" stroke="#B45309" fill="#FEF3C7" name="Issues" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No movements recorded in recent period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items Quick View */}
        <div className="bg-surface rounded-[8px] border border-border shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warn" />
                Low Stock Alerts
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Supplies at or below target reorder thresholds</p>
            </div>
            <Link href="/app/inventory" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-text-muted font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5 text-right">Available</th>
                  <th className="px-4 py-2.5 text-right">Reorder Level</th>
                  <th className="px-4 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary?.lowStockItems && summary.lowStockItems.length > 0 ? (
                  summary.lowStockItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{item.name}</div>
                        <div className="text-[11px] font-mono text-text-muted">{item.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-warn">
                        {item.quantityOnHand} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href="/app/purchases/new">
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Order
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                      No products currently below reorder levels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stock Movements Telemetry */}
        <div className="bg-surface rounded-[8px] border border-border shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Package className="w-4 h-4 text-accent" />
                Recent Ledger Activity
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Last 10 immutable stock movement records</p>
            </div>
            <Link href="/app/inventory/movements" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
              Audit Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-text-muted font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5 text-right">Delta</th>
                  <th className="px-4 py-2.5">Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary?.recentMovements && summary.recentMovements.length > 0 ? (
                  summary.recentMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            mov.movementType === 'RECEIPT'
                              ? 'bg-emerald-50 text-ok border border-emerald-200'
                              : mov.movementType === 'ISSUE'
                              ? 'bg-amber-50 text-warn border border-amber-200'
                              : 'bg-sky-50 text-info border border-sky-200'
                          }`}
                        >
                          {mov.movementType}
                        </span>
                      </td>
                      <td className="px-4 py-3 truncate max-w-[140px]" title={mov.productName}>
                        <div className="font-semibold text-text truncate">{mov.productName}</div>
                        <div className="text-[10px] font-mono text-text-muted">{mov.productSku}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        Number(mov.quantityDelta) > 0 ? 'text-ok' : 'text-danger'
                      }`}>
                        {Number(mov.quantityDelta) > 0 ? `+${mov.quantityDelta}` : mov.quantityDelta}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                        {mov.warehouseName || mov.warehouseId}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
