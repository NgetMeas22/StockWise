'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import {
  StockMovementDTO,
  WarehouseDTO,
  ProductDTO,
  MovementType,
  ReasonCode,
} from '@stockwise/shared';
import { useAuth } from '../../../../lib/auth-context';
import { Can } from '../../../../components/auth/Can';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { TableSkeleton } from '../../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../../components/ui/EmptyState';
import {
  History,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Package,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';

export default function StockMovementsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Reversal Modal State
  const [reversalTarget, setReversalTarget] = useState<StockMovementDTO | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState<string | null>(null);

  // Detail Modal State
  const [detailMovement, setDetailMovement] = useState<StockMovementDTO | null>(null);

  // Fetch Warehouses
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => apiRequest<WarehouseDTO[]>('/warehouses'),
  });
  const warehouses = warehousesRes?.data || [];

  // Fetch Products
  const { data: productsRes } = useQuery({
    queryKey: ['products-selector'],
    queryFn: () => apiRequest<ProductDTO[]>('/products?pageSize=100'),
  });
  const products = productsRes?.data || [];

  // Query Movements
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(selectedProduct ? { productId: selectedProduct } : {}),
    ...(selectedWarehouse ? { warehouseId: selectedWarehouse } : {}),
    ...(selectedType ? { type: selectedType } : {}),
    ...(dateFrom ? { from: dateFrom } : {}),
    ...(dateTo ? { to: dateTo } : {}),
  }).toString();

  const { data: movementsRes, isLoading, isFetching } = useQuery({
    queryKey: ['inventory-movements', queryParams],
    queryFn: () => apiRequest<StockMovementDTO[]>(`/inventory/movements?${queryParams}`),
  });

  const movements = movementsRes?.data || [];
  const meta = movementsRes?.meta || { total: 0, page: 1, pageSize: 20, totalPages: 1 };

  // Reversal Mutation
  const reverseMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest(`/inventory/movements/${id}/reversals`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      setReversalTarget(null);
      setReversalReason('');
    },
    onError: (err: any) => {
      setReversalError(err.message || 'Failed to reverse movement.');
    },
  });

  const handleReverseConfirm = () => {
    if (!reversalTarget) return;
    if (!reversalReason.trim() || reversalReason.trim().length < 3) {
      setReversalError('Reversal reason must be at least 3 characters.');
      return;
    }
    reverseMutation.mutate({ id: reversalTarget.id, reason: reversalReason.trim() });
  };

  const getMovementTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'RECEIPT':
      case 'TRANSFER_IN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{type}</span>;
      case 'ISSUE':
      case 'TRANSFER_OUT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">{type}</span>;
      case 'ADJUSTMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">{type}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/inventory"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Stock Movement Ledger</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Append-only audit trail of every stock increase, decrease, adjustment, and transfer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/app/inventory">
            <Button variant="outline" size="sm">
              Current Balances
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <select
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedWarehouse}
              onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Movement Types</option>
              <option value="RECEIPT">RECEIPT (+)</option>
              <option value="ISSUE">ISSUE (-)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (+/-)</option>
              <option value="TRANSFER_IN">TRANSFER_IN (+)</option>
              <option value="TRANSFER_OUT">TRANSFER_OUT (-)</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
              title="From date"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
              title="To date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {(selectedProduct || selectedWarehouse || selectedType || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSelectedProduct('');
                  setSelectedWarehouse('');
                  setSelectedType('');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="text-accent hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />}
            <span>Total records: {meta.total}</span>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} columns={8} />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={History}
            title="No movements found"
            description="Stock movements will appear here once inventory transactions are recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Seq #</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">Delta</th>
                  <th className="px-4 py-3 text-right">Balance After</th>
                  {canViewCost && <th className="px-4 py-3 text-right">Unit Cost</th>}
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => {
                  const deltaNum = Number(m.quantityDelta);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-text-muted text-[11px]">
                        #{m.seq}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-text whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}{' '}
                        <span className="text-text-muted">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {getMovementTypeBadge(m.movementType)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-text truncate max-w-[160px]" title={m.productName}>
                          {m.productName}
                        </div>
                        <div className="font-mono text-[10px] text-text-muted">{m.productSku}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-text">{m.warehouseName}</div>
                        <div className="font-mono text-[10px] text-text-muted">{m.warehouseId.slice(0, 8)}</div>
                      </td>

                      <td className={`px-4 py-3 text-right font-mono font-bold text-xs ${
                        deltaNum > 0 ? 'text-ok' : 'text-danger'
                      }`}>
                        {deltaNum > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-medium text-text text-xs">
                        {m.quantityAfter}
                      </td>

                      {canViewCost && (
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-text-muted">
                          {m.unitCost ? `$${Number(m.unitCost).toFixed(2)}` : '—'}
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <div className="font-medium text-text truncate max-w-[120px]">
                          {m.performerName || m.performedBy}
                        </div>
                        <div className="text-[10px] text-text-muted truncate max-w-[120px]" title={m.reason}>
                          {m.reasonCode}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailMovement(m)}
                            title="Inspect Details"
                            className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {!m.reversesMovementId && (
                            <Can permission="inventory:adjust">
                              <button
                                onClick={() => {
                                  setReversalTarget(m);
                                  setReversalReason('');
                                  setReversalError(null);
                                }}
                                title="Reverse this movement"
                                className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-slate-100 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </Can>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Movement Detail Modal */}
      <Modal
        isOpen={!!detailMovement}
        onClose={() => setDetailMovement(null)}
        title={`Movement #${detailMovement?.seq} Details`}
        maxWidth="md"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDetailMovement(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detailMovement && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-[6px] bg-slate-50 border border-border">
              <div>
                <span className="text-text-muted block">Movement ID</span>
                <span className="font-mono text-text break-all">{detailMovement.id}</span>
              </div>
              <div>
                <span className="text-text-muted block">Timestamp</span>
                <span className="text-text">{new Date(detailMovement.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-text-muted block">Product</span>
                <span className="font-semibold text-text">{detailMovement.productName}</span>{' '}
                <span className="font-mono text-text-muted">({detailMovement.productSku})</span>
              </div>
              <div>
                <span className="text-text-muted block">Warehouse</span>
                <span className="font-medium text-text">{detailMovement.warehouseName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div>
                  <span className="text-text-muted block">Quantity Delta</span>
                  <span className={`font-mono font-bold text-sm ${Number(detailMovement.quantityDelta) > 0 ? 'text-ok' : 'text-danger'}`}>
                    {Number(detailMovement.quantityDelta) > 0 ? `+${detailMovement.quantityDelta}` : detailMovement.quantityDelta}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block">Stock After Movement</span>
                  <span className="font-mono font-bold text-sm text-text">{detailMovement.quantityAfter}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block">Reason Code & Notes</span>
                <span className="font-semibold text-text block">{detailMovement.reasonCode}</span>
                <p className="text-text mt-0.5">{detailMovement.reason}</p>
              </div>
              {detailMovement.transferGroupId && (
                <div className="pt-2 border-t border-border">
                  <span className="text-text-muted block">Transfer Group ID</span>
                  <span className="font-mono text-text-muted">{detailMovement.transferGroupId}</span>
                </div>
              )}
              {detailMovement.reversesMovementId && (
                <div className="pt-2 border-t border-border p-2 bg-amber-50 rounded text-amber-900">
                  <span className="font-semibold block">Reversal Transaction</span>
                  <span>Reverses Movement ID: {detailMovement.reversesMovementId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reversal Confirmation Modal */}
      <Modal
        isOpen={!!reversalTarget}
        onClose={() => setReversalTarget(null)}
        title="Reverse Stock Movement"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReversalTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReverseConfirm}
              isLoading={reverseMutation.isPending}
            >
              Confirm Reversal
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {reversalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{reversalError}</span>
            </div>
          )}

          <p className="text-sm text-text">
            You are about to reverse movement <strong>#{reversalTarget?.seq}</strong> (
            {reversalTarget?.movementType}) of <strong>{reversalTarget?.productName}</strong>.
          </p>

          <div className="p-3 bg-slate-50 border border-border rounded-[6px] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Original Delta:</span>
              <span className="font-mono font-semibold">{reversalTarget?.quantityDelta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Counter Delta to Apply:</span>
              <span className="font-mono font-semibold text-danger">
                {reversalTarget ? (Number(reversalTarget.quantityDelta) > 0 ? `-${reversalTarget.quantityDelta}` : `+${Math.abs(Number(reversalTarget.quantityDelta))}`) : ''}
              </span>
            </div>
          </div>

          <FormField label="Mandatory Reason for Reversal" required hint="Must provide audit justification">
            <Input
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Correcting operator entry error on slip #44"
              required
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
