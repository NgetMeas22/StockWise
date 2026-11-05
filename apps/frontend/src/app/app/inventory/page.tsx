'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import {
  InventoryBalanceDTO,
  WarehouseDTO,
  ProductDTO,
  ReasonCode,
} from '@stockwise/shared';
import { useAuth } from '../../../lib/auth-context';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { StockBadge } from '../../../components/ui/StockBadge';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../lib/toast-context';
import { useTranslation } from '../../../i18n/i18n-context';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  ArrowRightLeft,
  Search,
  RefreshCw,
  Building2,
  AlertCircle,
  History,
  QrCode,
} from 'lucide-react';

export default function InventoryBalancesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');

  // Operation Modals State
  const [activeModal, setActiveModal] = useState<'receive' | 'issue' | 'adjust' | 'transfer' | null>(null);

  // Form Fields
  const [formProductId, setFormProductId] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formTargetWarehouseId, setFormTargetWarehouseId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnitCost, setFormUnitCost] = useState('0');
  const [formReasonCode, setFormReasonCode] = useState<string>('');
  const [formReason, setFormReason] = useState('');
  const [formNewQuantity, setFormNewQuantity] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Warehouses
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => apiRequest<WarehouseDTO[]>('/warehouses'),
  });
  const warehouses = warehousesRes?.data || [];

  // Fetch Products (for selectors)
  const { data: productsRes } = useQuery({
    queryKey: ['products-selector'],
    queryFn: () => apiRequest<ProductDTO[]>('/products?pageSize=100&status=ACTIVE'),
  });
  const products = productsRes?.data || [];

  // Query Balances
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
    ...(selectedWarehouse ? { warehouseId: selectedWarehouse } : {}),
    ...(selectedStockFilter !== 'all' ? { state: selectedStockFilter } : {}),
  }).toString();

  const { data: balancesRes, isLoading, isFetching } = useQuery({
    queryKey: ['inventory-balances', queryParams],
    queryFn: () => apiRequest<InventoryBalanceDTO[]>(`/inventory/balances?${queryParams}`),
  });

  const balances = balancesRes?.data || [];
  const meta = balancesRes?.meta || { total: 0, page: 1, pageSize: 15, totalPages: 1 };

  // Mutations
  const receiveMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/inventory/receipts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      setActiveModal(null);
      toast.success(t('toasts.stockReceived'));
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to receive stock.');
      toast.error(err.message || 'Failed to receive stock.');
    },
  });

  const issueMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/inventory/issues', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      setActiveModal(null);
      toast.success(t('toasts.stockIssued'));
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to issue stock.');
      toast.error(err.message || 'Failed to issue stock.');
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/inventory/adjustments', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      setActiveModal(null);
      toast.success(t('toasts.stockAdjusted'));
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to adjust stock.');
      toast.error(err.message || 'Failed to adjust stock.');
    },
  });

  const transferMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/inventory/transfers', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      setActiveModal(null);
      toast.success(t('toasts.stockTransferred'));
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to transfer stock.');
      toast.error(err.message || 'Failed to transfer stock.');
    },
  });

  // Modal openers
  const openReceiveModal = (bal?: InventoryBalanceDTO) => {
    setFormError(null);
    setFormProductId(bal ? bal.productId : products[0]?.id || '');
    setFormWarehouseId(bal ? bal.warehouseId : warehouses[0]?.id || '');
    setFormQuantity('1');
    setFormUnitCost('0');
    setFormReasonCode(ReasonCode.DIRECT_PURCHASE);
    setFormReason('Direct inventory receipt');
    setActiveModal('receive');
  };

  const openIssueModal = (bal?: InventoryBalanceDTO) => {
    setFormError(null);
    setFormProductId(bal ? bal.productId : products[0]?.id || '');
    setFormWarehouseId(bal ? bal.warehouseId : warehouses[0]?.id || '');
    setFormQuantity('1');
    setFormReasonCode(ReasonCode.USAGE);
    setFormReason('Internal issue / dispatch');
    setActiveModal('issue');
  };

  const openAdjustModal = (bal?: InventoryBalanceDTO) => {
    setFormError(null);
    setFormProductId(bal ? bal.productId : products[0]?.id || '');
    setFormWarehouseId(bal ? bal.warehouseId : warehouses[0]?.id || '');
    const current = bal ? Number(bal.quantityOnHand) : 0;
    setFormNewQuantity(String(current));
    setFormReason('Physical count reconciliation');
    setActiveModal('adjust');
  };

  const openTransferModal = (bal?: InventoryBalanceDTO) => {
    setFormError(null);
    setFormProductId(bal ? bal.productId : products[0]?.id || '');
    const fromId = bal ? bal.warehouseId : warehouses[0]?.id || '';
    setFormWarehouseId(fromId);
    const targetWh = warehouses.find((w) => w.id !== fromId);
    setFormTargetWarehouseId(targetWh?.id || '');
    setFormQuantity('1');
    setFormReason('Stock redistribution');
    setActiveModal('transfer');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('inventory.title')}</h1>
          <p className="text-sm text-text-muted mt-1">
            {t('inventory.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/inventory/movements">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>{t('inventory.movementLedger')}</span>
            </Button>
          </Link>

          <Link href="/app/inventory/quick-entry">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>{t('inventory.quickScanner')}</span>
            </Button>
          </Link>

          <Can permission="inventory:receive">
            <Button
              size="sm"
              onClick={() => openReceiveModal()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t('inventory.receiveStock')}</span>
            </Button>
          </Can>

          <Can permission="inventory:issue">
            <Button
              size="sm"
              onClick={() => openIssueModal()}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('inventory.issueStock')}</span>
            </Button>
          </Can>

          <Can permission="inventory:adjust">
            <Button
              size="sm"
              onClick={() => openAdjustModal()}
              className="flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              <span>{t('inventory.adjustStock')}</span>
            </Button>
          </Can>

          <Can permission="inventory:transfer">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openTransferModal()}
              className="flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{t('inventory.transferStock')}</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-4">
        {/* Quick Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => { setSelectedStockFilter('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockFilter === 'all'
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text hover:bg-surface-muted'
            }`}
          >
            {t('products.allStock')}
          </button>
          <button
            onClick={() => { setSelectedStockFilter('in'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockFilter === 'in'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
            }`}
          >
            {t('inventory.adequateStock')}
          </button>
          <button
            onClick={() => { setSelectedStockFilter('low'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockFilter === 'low'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60'
            }`}
          >
            {t('inventory.lowStockAlerts')}
          </button>
          <button
            onClick={() => { setSelectedStockFilter('out'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockFilter === 'out'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60'
            }`}
          >
            {t('inventory.outOfStock')}
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={`${t('common.search')} product name or SKU...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <select
              value={selectedWarehouse}
              onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">{t('common.all')} Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-text-muted">
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
            Showing {balances.length} of {meta.total} records
          </div>
        </div>
      </div>

      {/* Balances Data Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : balances.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={t('common.noData')}
            description="Adjust your search filters or record initial stock receipts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">{t('products.productName')}</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">{t('products.stockOnHand')}</th>
                  <th className="px-4 py-3 text-right">{t('products.reorderLevel')}</th>
                  <th className="px-4 py-3 text-center">{t('common.status')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {balances.map((b) => {
                  const qty = Number(b.quantityOnHand);
                  const reorder = Number(b.reorderLevel);

                  return (
                    <tr key={`${b.productId}-${b.warehouseId}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/products/${b.productId}`}
                          className="font-semibold text-text hover:text-accent block"
                        >
                          {b.productName}
                        </Link>
                        <span className="font-mono text-[11px] text-text-muted">{b.productSku}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-text">
                          <Building2 className="w-3.5 h-3.5 text-text-muted" />
                          <span className="font-medium">{b.warehouseName}</span>
                        </div>
                        <span className="font-mono text-[10px] text-text-muted ml-5">
                          {b.warehouseId.slice(0, 8)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-bold text-text">
                          {qty.toFixed(2)} {b.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        {reorder.toFixed(2)} {b.unit}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StockBadge quantity={qty} reorderLevel={reorder} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Can permission="inventory:receive">
                            <button
                              onClick={() => openReceiveModal(b)}
                              title={t('inventory.receiveStock')}
                              className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                          </Can>

                          <Can permission="inventory:issue">
                            <button
                              onClick={() => openIssueModal(b)}
                              title={t('inventory.issueStock')}
                              className="p-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </Can>

                          <Can permission="inventory:adjust">
                            <button
                              onClick={() => openAdjustModal(b)}
                              title={t('inventory.adjustStock')}
                              className="p-1.5 text-text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </Can>

                          <Can permission="inventory:transfer">
                            <button
                              onClick={() => openTransferModal(b)}
                              title={t('inventory.transferStock')}
                              className="p-1.5 text-text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Modal 1: Receive Stock */}
      <Modal
        isOpen={activeModal === 'receive'}
        onClose={() => setActiveModal(null)}
        title={t('inventory.receiveStock')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              {t('actions.cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                receiveMutation.mutate({
                  productId: formProductId,
                  warehouseId: formWarehouseId,
                  quantity: Number(formQuantity),
                  unitCost: canViewCost ? Number(formUnitCost) : undefined,
                  reasonCode: formReasonCode,
                  reason: formReason,
                });
              }}
              isLoading={receiveMutation.isPending}
              loadingText="Receiving..."
            >
              {t('actions.confirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label={t('products.productName')} required>
            <select
              value={formProductId}
              onChange={(e) => setFormProductId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t('inventory.destinationWarehouse')} required>
            <select
              value={formWarehouseId}
              onChange={(e) => setFormWarehouseId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantity to Receive" required>
              <Input
                type="number"
                min="0.001"
                step="any"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="font-mono font-bold"
                required
              />
            </FormField>

            {canViewCost && (
              <FormField label={`${t('products.costPrice')} ($)`} hint="Weighted avg will recalculate">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formUnitCost}
                  onChange={(e) => setFormUnitCost(e.target.value)}
                  className="font-mono"
                />
              </FormField>
            )}
          </div>

          <FormField label="Receipt Reason Code" required>
            <select
              value={formReasonCode}
              onChange={(e) => setFormReasonCode(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value={ReasonCode.DIRECT_PURCHASE}>Direct Purchase Receipt</option>
              <option value={ReasonCode.CUSTOMER_RETURN}>Customer Return</option>
              <option value={ReasonCode.OTHER}>Other Manual Receipt</option>
            </select>
          </FormField>

          <FormField label="Reason Notes" required>
            <Input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. Received shipment from vendor"
              required
            />
          </FormField>
        </div>
      </Modal>

      {/* Modal 2: Issue Stock */}
      <Modal
        isOpen={activeModal === 'issue'}
        onClose={() => setActiveModal(null)}
        title={t('inventory.issueStock')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                issueMutation.mutate({
                  productId: formProductId,
                  warehouseId: formWarehouseId,
                  quantity: Number(formQuantity),
                  reasonCode: formReasonCode,
                  reason: formReason,
                });
              }}
              isLoading={issueMutation.isPending}
              loadingText="Issuing..."
            >
              {t('actions.confirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label={t('products.productName')} required>
            <select
              value={formProductId}
              onChange={(e) => setFormProductId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t('inventory.sourceWarehouse')} required>
            <select
              value={formWarehouseId}
              onChange={(e) => setFormWarehouseId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Quantity to Issue" required hint="Must not exceed current on-hand quantity">
            <Input
              type="number"
              min="0.001"
              step="any"
              value={formQuantity}
              onChange={(e) => setFormQuantity(e.target.value)}
              className="font-mono font-bold text-danger"
              required
            />
          </FormField>

          <FormField label="Issue Reason Code" required>
            <select
              value={formReasonCode}
              onChange={(e) => setFormReasonCode(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value={ReasonCode.USAGE}>Sales Order / Dispatch Usage</option>
              <option value={ReasonCode.SUPPLIER_RETURN}>Return to Supplier</option>
              <option value={ReasonCode.DAMAGED}>Damaged / Write-off</option>
              <option value={ReasonCode.OTHER}>Other Issue</option>
            </select>
          </FormField>

          <FormField label="Reason Notes" required>
            <Input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. Sales order fulfillment #1049"
              required
            />
          </FormField>
        </div>
      </Modal>

      {/* Modal 3: Adjust Stock */}
      <Modal
        isOpen={activeModal === 'adjust'}
        onClose={() => setActiveModal(null)}
        title={t('inventory.adjustStock')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={() => {
                adjustMutation.mutate({
                  productId: formProductId,
                  warehouseId: formWarehouseId,
                  newQuantity: Number(formNewQuantity),
                  reason: formReason,
                });
              }}
              isLoading={adjustMutation.isPending}
              loadingText="Adjusting..."
            >
              {t('actions.confirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label={t('products.productName')} required>
            <select
              value={formProductId}
              onChange={(e) => setFormProductId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Warehouse" required>
            <select
              value={formWarehouseId}
              onChange={(e) => setFormWarehouseId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="New Exact Physical Count" required hint="System will calculate the adjustment delta">
            <Input
              type="number"
              min="0"
              step="any"
              value={formNewQuantity}
              onChange={(e) => setFormNewQuantity(e.target.value)}
              className="font-mono font-bold"
              required
            />
          </FormField>

          <FormField label="Mandatory Reason" required hint="Must explain physical audit findings">
            <Input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. End of month physical audit recount"
              required
            />
          </FormField>
        </div>
      </Modal>

      {/* Modal 4: Transfer Stock */}
      <Modal
        isOpen={activeModal === 'transfer'}
        onClose={() => setActiveModal(null)}
        title={t('inventory.transferStock')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={() => {
                transferMutation.mutate({
                  productId: formProductId,
                  fromWarehouseId: formWarehouseId,
                  toWarehouseId: formTargetWarehouseId,
                  quantity: Number(formQuantity),
                  notes: formReason,
                });
              }}
              isLoading={transferMutation.isPending}
              loadingText="Transferring..."
            >
              {t('actions.confirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label={t('products.productName')} required>
            <select
              value={formProductId}
              onChange={(e) => setFormProductId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('inventory.sourceWarehouse')} required>
              <select
                value={formWarehouseId}
                onChange={(e) => setFormWarehouseId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t('inventory.destinationWarehouse')} required>
              <select
                value={formTargetWarehouseId}
                onChange={(e) => setFormTargetWarehouseId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {warehouses
                  .filter((w) => w.id !== formWarehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
              </select>
            </FormField>
          </div>

          <FormField label="Transfer Quantity" required>
            <Input
              type="number"
              min="0.001"
              step="any"
              value={formQuantity}
              onChange={(e) => setFormQuantity(e.target.value)}
              className="font-mono font-bold"
              required
            />
          </FormField>

          <FormField label="Transfer Notes">
            <Input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. Regional redistribution batch TR-98"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
