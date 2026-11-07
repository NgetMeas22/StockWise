'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import {
  PurchaseOrderDTO,
  PurchaseOrderStatus,
} from '@stockwise/shared';
import { useAuth } from '../../../../lib/auth-context';
import { Can } from '../../../../components/auth/Can';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { useToast } from '../../../../lib/toast-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import {
  ArrowLeft,
  Truck,
  Building2,
  Calendar,
  Send,
  XCircle,
  PackageCheck,
  Printer,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PurchaseOrderDetailProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailProps) {
  const resolvedParams = use(params);
  const poId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  // Modal States
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveLines, setReceiveLines] = useState<Record<string, number>>({});
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Fetch PO detail
  const { data: poRes, isLoading, error } = useQuery({
    queryKey: ['purchase-order-detail', poId],
    queryFn: () => apiRequest<PurchaseOrderDTO>(`/purchasing/orders/${poId}`),
  });

  const po = poRes?.data;

  // Submit Order Mutation (Draft -> Ordered)
  const submitMutation = useMutation({
    mutationFn: () => apiRequest(`/purchasing/orders/${poId}/submit`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order-detail', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('toasts.orderSubmitted'));
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit order.');
    },
  });

  // Cancel Order Mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      apiRequest(`/purchasing/orders/${poId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order-detail', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowCancelModal(false);
      toast.success(t('toasts.orderCancelled'));
    },
    onError: (err: any) => {
      setCancelError(err.message || 'Failed to cancel order.');
      toast.error(err.message || 'Failed to cancel order.');
    },
  });

  // Receive Goods Mutation
  const receiveMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest(`/purchasing/orders/${poId}/receipts`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order-detail', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      setShowReceiveModal(false);
      toast.success(t('toasts.orderReceived'));
    },
    onError: (err: any) => {
      setReceiveError(err.message || 'Failed to record receipt.');
      toast.error(err.message || 'Failed to record receipt.');
    },
  });

  const openReceiveDialog = () => {
    if (!po?.items) return;
    const initial: Record<string, number> = {};
    po.items.forEach((item) => {
      const remaining = Math.max(0, Number(item.quantityOrdered) - Number(item.quantityReceived));
      initial[item.id] = remaining;
    });
    setReceiveLines(initial);
    setDeliveryNoteRef('');
    setReceiveNotes('');
    setReceiveError(null);
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = () => {
    setReceiveError(null);
    const itemsToReceive = Object.entries(receiveLines)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([orderItemId, quantityReceived]) => ({
        orderItemId,
        quantityReceived: Number(quantityReceived),
      }));

    if (itemsToReceive.length === 0) {
      setReceiveError('Please enter at least one quantity greater than zero.');
      return;
    }

    receiveMutation.mutate({
      items: itemsToReceive,
      deliverySlipRef: deliveryNoteRef.trim() || undefined,
      notes: receiveNotes.trim() || undefined,
    });
  };

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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-text-muted">
        {t('common.loading')}
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-danger">
        Purchase order not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/purchases"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text">
                {po.poNumber}
              </h1>
              {getStatusBadge(po.status)}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Created on {new Date(po.createdAt).toLocaleDateString()} by {po.creatorName || po.createdBy}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PO</span>
          </Button>

          {po.status === 'DRAFT' && (
            <Can permission="purchases:manage">
              <Button
                size="sm"
                onClick={() => submitMutation.mutate()}
                isLoading={submitMutation.isPending}
                loadingText="Submitting..."
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Supplier</span>
              </Button>
            </Can>
          )}

          {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
            <Can permission="purchases:receive">
              <Button
                size="sm"
                onClick={openReceiveDialog}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Record Goods Receipt</span>
              </Button>
            </Can>
          )}

          {po.status !== 'CANCELLED' && po.status !== 'RECEIVED' && (
            <Can permission="purchases:manage">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelReason('');
                  setCancelError(null);
                  setShowCancelModal(true);
                }}
                className="text-danger hover:bg-red-50 dark:hover:bg-red-950/40 border-danger/30"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                <span>Cancel Order</span>
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-6">
        {/* Parties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-border">
          <div>
            <span className="text-xs uppercase font-semibold text-text-muted tracking-wider block mb-1">
              Supplier / Vendor
            </span>
            <div className="flex items-center gap-2 font-semibold text-text">
              <Truck className="w-4 h-4 text-accent" />
              <span>{po.supplierName}</span>
            </div>
          </div>

          <div>
            <span className="text-xs uppercase font-semibold text-text-muted tracking-wider block mb-1">
              Destination Warehouse
            </span>
            <div className="flex items-center gap-2 font-semibold text-text">
              <Building2 className="w-4 h-4 text-accent" />
              <span>{po.warehouseName}</span>
            </div>
            <p className="text-xs text-text-muted mt-1">Direct inventory receiving destination</p>
          </div>

          <div className="text-xs space-y-1">
            <span className="uppercase font-semibold text-text-muted tracking-wider block mb-1">
              Key Dates
            </span>
            <div>
              <span className="text-text-muted">Order Date:</span>{' '}
              <strong className="text-text">{new Date(po.orderDate).toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="text-text-muted">Expected Delivery:</span>{' '}
              <strong className="text-text">
                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'Unspecified'}
              </strong>
            </div>
          </div>
        </div>

        {po.notes && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-[6px] text-xs">
            <span className="font-semibold text-text block mb-1">Notes & Instructions:</span>
            <p className="text-text-muted">{po.notes}</p>
          </div>
        )}

        {/* Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Ordered Line Items</h3>
          <div className="overflow-x-auto border border-border rounded-[6px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted uppercase font-semibold text-[11px]">
                  <th className="px-4 py-2.5">Line #</th>
                  <th className="px-4 py-2.5">Product SKU / Name</th>
                  <th className="px-4 py-2.5 text-right">Ordered</th>
                  <th className="px-4 py-2.5 text-right">Received</th>
                  <th className="px-4 py-2.5 text-center">Fulfillment</th>
                  {canViewCost && <th className="px-4 py-2.5 text-right">Unit Cost</th>}
                  {canViewCost && <th className="px-4 py-2.5 text-right">Line Total</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.items?.map((item) => {
                  const ordered = Number(item.quantityOrdered);
                  const received = Number(item.quantityReceived);
                  const pct = Math.min(100, Math.round((received / (ordered || 1)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-text-muted tabular-nums">#{item.lineNumber}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{item.productName}</div>
                        <div className="text-[10px] text-text-muted">{item.productSku}</div>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums font-medium text-text">
                        {ordered}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                        {received}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="w-24 mx-auto bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pct >= 100 ? 'bg-emerald-600' : 'bg-accent'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-text-muted tabular-nums font-medium">{pct}%</span>
                      </td>

                      {canViewCost && (
                        <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                          {item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : '—'}
                        </td>
                      )}

                      {canViewCost && (
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-text">
                          {item.lineTotal ? `$${Number(item.lineTotal).toFixed(2)}` : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canViewCost && po.totalCost && (
            <div className="flex justify-end p-3 text-right">
              <div>
                <span className="text-xs text-text-muted block">Grand Total</span>
                <span className="text-xl tabular-nums font-bold text-accent">
                  ${Number(po.totalCost).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receive Goods Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title={`Receive Goods against ${po.poNumber}`}
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReceiveModal(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleReceiveSubmit}
              isLoading={receiveMutation.isPending}
              loadingText="Recording Receipt..."
            >
              {t('purchases.confirmReceipt')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {receiveError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiveError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('purchases.deliverySlipRef')} hint="Optional reference number">
              <Input
                placeholder="e.g. BL-89218"
                value={deliveryNoteRef}
                onChange={(e) => setDeliveryNoteRef(e.target.value)}
              />
            </FormField>

            <FormField label="Receiving Notes">
              <Input
                placeholder="Inspected dock conditions, etc."
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
              />
            </FormField>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <label className="text-xs font-semibold text-text block">
              {t('purchases.quantitiesToReceive')}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {po.items?.map((item) => {
                const ordered = Number(item.quantityOrdered);
                const received = Number(item.quantityReceived);
                const remaining = Math.max(0, ordered - received);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-[6px] bg-slate-50 dark:bg-slate-800/50 border border-border text-xs"
                  >
                    <div>
                      <div className="font-semibold text-text">{item.productName}</div>
                      <div className="text-[10px] text-text-muted">
                        Ordered: {ordered} | Previously Received: {received} | Remaining: {remaining}
                      </div>
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Qty"
                        value={receiveLines[item.id] ?? 0}
                        onChange={(e) =>
                          setReceiveLines((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value),
                          }))
                        }
                        className="font-mono text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={`Cancel Purchase Order ${po.poNumber}`}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!cancelReason.trim()) {
                  setCancelError('Cancellation reason is required.');
                  return;
                }
                cancelMutation.mutate(cancelReason.trim());
              }}
              isLoading={cancelMutation.isPending}
              loadingText="Cancelling..."
            >
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {cancelError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <p className="text-sm text-text">
            Are you sure you want to cancel purchase order <strong>{po.poNumber}</strong>? This action cannot be undone.
          </p>

          <FormField label="Cancellation Reason" required>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Vendor out of stock, cancelled by agreement"
              required
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
