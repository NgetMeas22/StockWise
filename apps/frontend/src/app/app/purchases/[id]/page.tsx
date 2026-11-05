'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import {
  PurchaseOrderDTO,
  PurchaseOrderStatus,
  GoodsReceiptDTO,
} from '@stockwise/shared';
import { useAuth } from '../../../../lib/auth-context';
import { Can } from '../../../../components/auth/Can';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
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
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface PurchaseOrderDetailProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailProps) {
  const resolvedParams = use(params);
  const poId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
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
    },
    onError: (err: any) => setCancelError(err.message || 'Failed to cancel order.'),
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
    },
    onError: (err: any) => setReceiveError(err.message || 'Failed to record receipt.'),
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
    const linesToSubmit = Object.entries(receiveLines)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => ({
        purchaseOrderItemId: itemId,
        quantityReceived: Number(qty),
      }));

    if (linesToSubmit.length === 0) {
      setReceiveError('Please enter a quantity greater than 0 for at least one item.');
      return;
    }

    receiveMutation.mutate({
      deliveryNoteRef: deliveryNoteRef.trim() || null,
      notes: receiveNotes.trim() || null,
      lines: linesToSubmit,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-text-muted">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-xl font-bold text-text">Purchase Order not found</h2>
        <Link href="/app/purchases">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/app/purchases"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text font-mono">
                {po.poNumber}
              </h1>
              {getStatusBadge(po.status)}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Created on {new Date(po.createdAt).toLocaleDateString()} by {po.creatorName || po.createdBy}
            </p>
          </div>
        </div>

        {/* Action Buttons based on Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print PO</span>
          </Button>

          {po.status === 'DRAFT' && (
            <Can permission="purchases:manage">
              <Button
                size="sm"
                onClick={() => submitMutation.mutate()}
                isLoading={submitMutation.isPending}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
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
                <span>Receive Goods</span>
              </Button>
            </Can>
          )}

          {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
            <Can permission="purchases:cancel">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setCancelReason('');
                  setCancelError(null);
                  setShowCancelModal(true);
                }}
                className="flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel PO</span>
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* PO Overview Card */}
      <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-6">
        {/* Printable Header */}
        <div className="flex justify-between items-start border-b border-border pb-6">
          <div>
            <div className="text-xl font-bold text-text">StockWise IMS</div>
            <div className="text-xs text-text-muted mt-1">Official Purchase Order</div>
            <div className="text-base font-mono font-bold text-accent mt-2">{po.poNumber}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-text-muted block">Order Status</span>
            <div className="mt-1">{getStatusBadge(po.status)}</div>
          </div>
        </div>

        {/* Vendor & Delivery Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-text-muted uppercase tracking-wider font-semibold block">
              Supplier / Vendor
            </span>
            <div className="font-bold text-sm text-text">{po.supplierName}</div>
            <div className="text-text-muted">Vendor ID: {po.supplierId.slice(0, 8)}</div>
          </div>

          <div className="space-y-1">
            <span className="text-text-muted uppercase tracking-wider font-semibold block">
              Ship-to Warehouse
            </span>
            <div className="font-bold text-sm text-text">{po.warehouseName}</div>
            <div className="text-text-muted">Facility ID: {po.warehouseId.slice(0, 8)}</div>
          </div>

          <div className="space-y-1">
            <span className="text-text-muted uppercase tracking-wider font-semibold block">
              Timeline & Delivery
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
          <div className="p-3 bg-slate-50 border border-border rounded-[6px] text-xs">
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
                <tr className="border-b border-border bg-slate-50 text-text-muted uppercase font-semibold text-[11px]">
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
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-text-muted">#{item.lineNumber}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{item.productName}</div>
                        <div className="font-mono text-[10px] text-text-muted">{item.productSku}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-medium text-text">
                        {ordered}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                        {received}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="w-24 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pct >= 100 ? 'bg-emerald-600' : 'bg-accent'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-text-muted font-mono">{pct}%</span>
                      </td>

                      {canViewCost && (
                        <td className="px-4 py-3 text-right font-mono text-text-muted">
                          {item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : '—'}
                        </td>
                      )}

                      {canViewCost && (
                        <td className="px-4 py-3 text-right font-mono font-bold text-text">
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
                <span className="text-xl font-mono font-bold text-accent">
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
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleReceiveSubmit}
              isLoading={receiveMutation.isPending}
            >
              Confirm Receipt
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {receiveError && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiveError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Delivery Slip / Vendor Bill of Lading" hint="Optional reference number">
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
              Quantities Received by Line Item
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {po.items?.map((item) => {
                const ordered = Number(item.quantityOrdered);
                const received = Number(item.quantityReceived);
                const remaining = Math.max(0, ordered - received);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-[6px] bg-slate-50 border border-border text-xs"
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
              Back
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
            >
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {cancelError && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-xs rounded-[6px] flex items-center gap-2">
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

