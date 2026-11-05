'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { ProductDTO, WarehouseDTO, ReasonCode } from '@stockwise/shared';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { useToast } from '../../../../lib/toast-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sliders,
} from 'lucide-react';

interface QuickEntryLog {
  id: string;
  sku: string;
  name: string;
  action: 'RECEIVE' | 'ISSUE' | 'ADJUST';
  quantity: number;
  time: string;
}

export default function QuickEntryPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [scanCode, setScanCode] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [actionType, setActionType] = useState<'RECEIVE' | 'ISSUE' | 'ADJUST'>('RECEIVE');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('Quick scan entry');

  const [foundProduct, setFoundProduct] = useState<ProductDTO | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [recentLogs, setRecentLogs] = useState<QuickEntryLog[]>([]);

  // Fetch warehouses
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => apiRequest<WarehouseDTO[]>('/warehouses'),
  });
  const warehouses = warehousesRes?.data || [];

  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  // Lookup product mutation
  const lookupMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest<ProductDTO>(`/products/lookup?code=${encodeURIComponent(code)}`);
    },
    onSuccess: (res) => {
      if (res?.data) {
        setFoundProduct(res.data);
        setFeedbackMessage(null);
        toast.info(`Found: ${res.data.name} (${res.data.sku})`);
      } else {
        setFoundProduct(null);
        setFeedbackMessage({ text: `No product found for code "${scanCode}"`, isError: true });
        toast.warning(`No product found for code "${scanCode}"`);
      }
    },
    onError: () => {
      setFoundProduct(null);
      setFeedbackMessage({ text: `Failed to find product for code "${scanCode}"`, isError: true });
      toast.error(`Lookup failed for code "${scanCode}"`);
    },
  });

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    lookupMutation.mutate(scanCode.trim());
  };

  // Stock operations mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!foundProduct || !selectedWarehouseId) return;

      if (actionType === 'RECEIVE') {
        return apiRequest('/inventory/receipts', {
          method: 'POST',
          body: JSON.stringify({
            productId: foundProduct.id,
            warehouseId: selectedWarehouseId,
            quantity: Number(quantity),
            reasonCode: ReasonCode.DIRECT_PURCHASE,
            reason: notes || 'Quick scanning receipt',
          }),
        });
      } else if (actionType === 'ISSUE') {
        return apiRequest('/inventory/issues', {
          method: 'POST',
          body: JSON.stringify({
            productId: foundProduct.id,
            warehouseId: selectedWarehouseId,
            quantity: Number(quantity),
            reasonCode: ReasonCode.USAGE,
            reason: notes || 'Quick scanning dispatch',
          }),
        });
      } else {
        return apiRequest('/inventory/adjustments', {
          method: 'POST',
          body: JSON.stringify({
            productId: foundProduct.id,
            warehouseId: selectedWarehouseId,
            newQuantity: Number(quantity),
            reason: notes || 'Quick scanning adjustment',
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });

      // Append to local log
      if (foundProduct) {
        setRecentLogs((prev) => [
          {
            id: Math.random().toString(),
            sku: foundProduct.sku,
            name: foundProduct.name,
            action: actionType,
            quantity: Number(quantity),
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ]);
      }

      const msg = `Successfully executed ${actionType} of ${quantity} unit(s) for ${foundProduct?.sku}`;
      setFeedbackMessage({
        text: msg,
        isError: false,
      });
      toast.success(msg);

      // Clear & refocus scan input for continuous entry
      setScanCode('');
      setFoundProduct(null);
      setQuantity('1');
      barcodeInputRef.current?.focus();
    },
    onError: (err: any) => {
      const msg = err.message || `Failed to process ${actionType}`;
      setFeedbackMessage({
        text: msg,
        isError: true,
      });
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/inventory"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Quick Entry & Barcode Scanner</h1>
            <p className="text-sm text-text-muted mt-0.5">
              High-speed barcode scanning and manual inventory terminal.
            </p>
          </div>
        </div>
      </div>

      {/* Main Terminal Box */}
      <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-6">
        {/* Top Controls: Target Warehouse & Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border">
          <FormField label="Active Warehouse Facility" required>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </FormField>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Operation Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('RECEIVE')}
                className={`px-3 py-2 text-xs font-semibold rounded-[6px] flex items-center justify-center gap-1.5 transition-colors ${
                  actionType === 'RECEIVE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Receive</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('ISSUE')}
                className={`px-3 py-2 text-xs font-semibold rounded-[6px] flex items-center justify-center gap-1.5 transition-colors ${
                  actionType === 'ISSUE'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Issue</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('ADJUST')}
                className={`px-3 py-2 text-xs font-semibold rounded-[6px] flex items-center justify-center gap-1.5 transition-colors ${
                  actionType === 'ADJUST'
                    ? 'bg-accent text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Set Count</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scan Input */}
        <form onSubmit={handleScanSubmit} className="space-y-2">
          <label className="block text-xs font-semibold text-text">
            Scan Barcode or Type SKU (Press Enter)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Ready to scan... e.g. STW-OFF-001 or 893123..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-base font-mono rounded-[6px] border-2 border-accent/40 bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            <Button
              type="submit"
              isLoading={lookupMutation.isPending}
              loadingText="Looking up..."
            >
              Lookup
            </Button>
          </div>
        </form>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-[6px] text-xs flex items-center gap-2 ${
              feedbackMessage.isError
                ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {feedbackMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Scanned Product Card & Execute Row */}
        {foundProduct && (
          <div className="p-4 rounded-[8px] border-2 border-accent/20 bg-accent/5 space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">
                  {foundProduct.sku}
                </span>
                <h3 className="text-lg font-bold text-text mt-1">{foundProduct.name}</h3>
                <p className="text-xs text-text-muted">{foundProduct.categoryName}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted block">Catalog Stock</span>
                <span className="font-mono text-base font-bold text-text">
                  {foundProduct.totalQuantityOnHand} {foundProduct.unit}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-accent/20">
              <FormField
                label={
                  actionType === 'ADJUST'
                    ? 'New Exact Physical Count'
                    : `Quantity to ${actionType === 'RECEIVE' ? 'Receive' : 'Issue'}`
                }
                required
              >
                <Input
                  type="number"
                  min="0.001"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono text-lg font-bold text-text"
                  required
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Notes / Reference">
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference slip, batch #, reason..."
                  />
                </FormField>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => executeMutation.mutate()}
                isLoading={executeMutation.isPending}
                loadingText="Executing..."
                className={`flex items-center gap-2 ${
                  actionType === 'RECEIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'ISSUE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : ''
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Execute {actionType} of {quantity} {foundProduct.unit}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Recent Log */}
      {recentLogs.length > 0 && (
        <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Recent Terminal Entries this Session
          </h3>
          <div className="divide-y divide-border">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-text-muted text-[11px]">{log.time}</span>
                  <span className="font-mono font-semibold text-text">{log.sku}</span>
                  <span className="text-text-muted truncate max-w-[200px]">{log.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold ${
                      log.action === 'RECEIVE'
                        ? 'text-ok'
                        : log.action === 'ISSUE'
                        ? 'text-danger'
                        : 'text-amber-600'
                    }`}
                  >
                    {log.action === 'RECEIVE' ? `+${log.quantity}` : log.action === 'ISSUE' ? `-${log.quantity}` : `=${log.quantity}`}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">{log.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
