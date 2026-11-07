'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import {
  PurchaseOrderDTO,
  PurchaseOrderStatus,
  SupplierDTO,
} from '@stockwise/shared';
import { useAuth } from '../../../lib/auth-context';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useTranslation } from '../../../i18n/i18n-context';
import {
  ShoppingCart,
  Plus,
  Eye,
  Search,
  RefreshCw,
  Building2,
  Truck,
} from 'lucide-react';

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Suppliers for filter
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers-selector'],
    queryFn: () => apiRequest<SupplierDTO[]>('/suppliers?pageSize=100'),
  });
  const suppliers = suppliersRes?.data || [];

  // Query Purchase Orders
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedSupplier ? { supplierId: selectedSupplier } : {}),
    ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
  }).toString();

  const { data: poRes, isLoading, isFetching } = useQuery({
    queryKey: ['purchase-orders', queryParams],
    queryFn: () => apiRequest<PurchaseOrderDTO[]>(`/purchasing/orders?${queryParams}`),
  });

  const orders = poRes?.data || [];
  const meta = poRes?.meta || { total: 0, page: 1, pageSize: 15, totalPages: 1 };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral">{t('purchases.draft')}</Badge>;
      case 'ORDERED':
        return <Badge variant="info">{t('purchases.ordered')}</Badge>;
      case 'PARTIALLY_RECEIVED':
        return <Badge variant="warning">{t('purchases.partiallyReceived')}</Badge>;
      case 'RECEIVED':
        return <Badge variant="success">{t('purchases.received')}</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">{t('purchases.cancelled')}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('purchases.title')}</h1>
          <p className="text-sm text-text-muted mt-1">
            {t('purchases.subtitle')}
          </p>
        </div>

        <Can permission="purchases:manage">
          <Link href="/app/purchases/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>{t('purchases.newPO')}</span>
            </Button>
          </Link>
        </Can>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-4">
        {/* Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => { setSelectedStatus(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === ''
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text hover:bg-surface-muted'
            }`}
          >
            {t('common.all')} Orders
          </button>
          <button
            onClick={() => { setSelectedStatus('DRAFT'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'DRAFT'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t('purchases.draft')}
          </button>
          <button
            onClick={() => { setSelectedStatus('ORDERED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'ORDERED'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60'
            }`}
          >
            {t('purchases.ordered')}
          </button>
          <button
            onClick={() => { setSelectedStatus('PARTIALLY_RECEIVED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'PARTIALLY_RECEIVED'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60'
            }`}
          >
            {t('purchases.partiallyReceived')}
          </button>
          <button
            onClick={() => { setSelectedStatus('RECEIVED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'RECEIVED'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
            }`}
          >
            {t('purchases.received')}
          </button>
          <button
            onClick={() => { setSelectedStatus('CANCELLED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'CANCELLED'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60'
            }`}
          >
            {t('purchases.cancelled')}
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={`${t('common.search')} PO # or vendor...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => { setSelectedSupplier(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">{t('common.all')} Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-text-muted">
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
            Showing {orders.length} of {meta.total} orders
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={canViewCost ? 8 : 7} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={t('common.noData')}
            description="Create a purchase order to request items from suppliers and restock your warehouses."
            action={
              <Can permission="purchases:manage">
                <Link href="/app/purchases/new">
                  <Button size="sm">{t('purchases.newPO')}</Button>
                </Link>
              </Can>
            }
          />
        ) : (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="md:hidden divide-y divide-border">
              {orders.map((po) => (
                <div key={`m-${po.id}`} className="p-4 space-y-3 hover:bg-surface-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/app/purchases/${po.id}`}
                        className="font-bold text-sm text-accent hover:underline block leading-snug"
                      >
                        {po.poNumber}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-text font-medium mt-1">
                        <Truck className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span>{po.supplierName}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(po.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Destination: <strong className="text-text">{po.warehouseName}</strong></span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block">Order Date</span>
                      <span className="font-medium text-text tabular-nums">
                        {new Date(po.orderDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {canViewCost && (
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted block">Total Cost</span>
                        <span className="font-bold text-accent tabular-nums text-sm">
                          {po.totalCost ? `$${Number(po.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                      </div>
                    )}

                    <Link href={`/app/purchases/${po.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-3">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>{t('common.view')}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">{t('purchases.poNumber')}</th>
                    <th className="px-4 py-3">{t('purchases.supplier')}</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">{t('purchases.orderDate')}</th>
                    <th className="px-4 py-3">{t('purchases.expectedDate')}</th>
                    {canViewCost && <th className="px-4 py-3 text-right">{t('purchases.totalCost')}</th>}
                    <th className="px-4 py-3 text-center">{t('common.status')}</th>
                    <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/purchases/${po.id}`}
                          className="font-bold text-accent hover:underline block"
                        >
                          {po.poNumber}
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-text">
                          <Truck className="w-3.5 h-3.5 text-text-muted" />
                          <span>{po.supplierName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-text-muted">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{po.warehouseName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 tabular-nums text-text-muted text-xs">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 tabular-nums text-text-muted text-xs">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                      </td>

                      {canViewCost && (
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-text text-xs">
                          {po.totalCost ? `$${Number(po.totalCost).toFixed(2)}` : '—'}
                        </td>
                      )}

                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(po.status)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link href={`/app/purchases/${po.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            <span>{t('common.view')}</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50 dark:bg-slate-800/50 text-xs text-text-muted">
            <div>
              Page <span className="font-semibold text-text">{meta.page}</span> of{' '}
              <span className="font-semibold text-text">{meta.totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
