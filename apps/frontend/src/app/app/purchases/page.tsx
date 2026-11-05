'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import {
  PurchaseOrderDTO,
  PurchaseOrderStatus,
  SupplierDTO,
  WarehouseDTO,
} from '@stockwise/shared';
import { useAuth } from '../../../lib/auth-context';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  ShoppingCart,
  Plus,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Truck,
  Calendar,
} from 'lucide-react';

export default function PurchaseOrdersPage() {
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
        return <Badge variant="neutral">Draft</Badge>;
      case 'ORDERED':
        return <Badge variant="info">Ordered</Badge>;
      case 'PARTIALLY_RECEIVED':
        return <Badge variant="warning">Partially Received</Badge>;
      case 'RECEIVED':
        return <Badge variant="success">Received</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Purchase Orders</h1>
          <p className="text-sm text-text-muted mt-1">
            Procure inventory from suppliers with line item tracking and receipt reconciliation.
          </p>
        </div>

        <Can permission="purchases:manage">
          <Link href="/app/purchases/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Purchase Order</span>
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
                ? 'bg-slate-900 text-white'
                : 'text-text-muted hover:text-text hover:bg-slate-100'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => { setSelectedStatus('DRAFT'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'DRAFT'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => { setSelectedStatus('ORDERED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'ORDERED'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            Ordered / Awaiting
          </button>
          <button
            onClick={() => { setSelectedStatus('PARTIALLY_RECEIVED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'PARTIALLY_RECEIVED'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            Partially Received
          </button>
          <button
            onClick={() => { setSelectedStatus('RECEIVED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'RECEIVED'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            Completed / Received
          </button>
          <button
            onClick={() => { setSelectedStatus('CANCELLED'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStatus === 'CANCELLED'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search PO # or vendor..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => { setSelectedSupplier(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Suppliers</option>
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
          <TableSkeleton rows={8} columns={7} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No purchase orders found"
            description="Create a purchase order to request items from suppliers and restock your warehouses."
            action={
              <Can permission="purchases:manage">
                <Link href="/app/purchases/new">
                  <Button size="sm">Create First Purchase Order</Button>
                </Link>
              </Can>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Expected Date</th>
                  {canViewCost && <th className="px-4 py-3 text-right">Total Amount</th>}
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/purchases/${po.id}`}
                        className="font-mono font-bold text-accent hover:underline block"
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

                    <td className="px-4 py-3 font-mono text-text-muted">
                      {new Date(po.orderDate).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 font-mono text-text-muted">
                      {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                    </td>

                    {canViewCost && (
                      <td className="px-4 py-3 text-right font-mono font-bold text-text">
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
                          <span>View</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50 text-xs text-text-muted">
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
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

