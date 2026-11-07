'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import {
  SupplierDTO,
  WarehouseDTO,
  ProductDTO,
  PurchaseOrderDTO,
} from '@stockwise/shared';
import { useAuth } from '../../../../lib/auth-context';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { useToast } from '../../../../lib/toast-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';

interface POItemDraft {
  productId: string;
  quantityOrdered: number;
  unitCost: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<POItemDraft[]>([
    { productId: '', quantityOrdered: 10, unitCost: 0 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Suppliers
  const { data: suppliersRes } = useQuery({
    queryKey: ['active-suppliers'],
    queryFn: () => apiRequest<SupplierDTO[]>('/suppliers?status=ACTIVE&pageSize=100'),
  });
  const suppliers = suppliersRes?.data || [];

  // Fetch Warehouses
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => apiRequest<WarehouseDTO[]>('/warehouses'),
  });
  const warehouses = warehousesRes?.data || [];

  // Fetch Products
  const { data: productsRes } = useQuery({
    queryKey: ['active-products-selector'],
    queryFn: () => apiRequest<ProductDTO[]>('/products?status=ACTIVE&pageSize=200'),
  });
  const products = productsRes?.data || [];

  // Helper to add line item
  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantityOrdered: 1, unitCost: 0 }]);
  };

  // Helper to remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to update line item product and default unit cost
  const handleProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    const defaultCost = prod ? Number(prod.averageCost || prod.costPrice || 0) : 0;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: pId,
              unitCost: defaultCost,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantityOrdered: Math.max(0.001, qty) } : item))
    );
  };

  const handleUnitCostChange = (index: number, cost: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitCost: Math.max(0, cost) } : item))
    );
  };

  // Summary calculations
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantityOrdered) || 0), 0);
  const totalCost = items.reduce(
    (sum, item) => sum + (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0),
    0
  );

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest<PurchaseOrderDTO>('/purchasing/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      toast.success(t('toasts.orderCreated'));
      if (res?.data?.id) {
        router.push(`/app/purchases/${res.data.id}`);
      } else {
        router.push('/app/purchases');
      }
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to create purchase order.';
      setFormError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!supplierId) {
      setFormError('Please select a Supplier');
      return;
    }
    if (!warehouseId) {
      setFormError('Please select a Destination Warehouse');
      return;
    }

    const invalidItems = items.filter((it) => !it.productId || it.quantityOrdered <= 0);
    if (invalidItems.length > 0) {
      setFormError('Please ensure every line item has a selected product and valid quantity');
      return;
    }

    const payload = {
      supplierId,
      warehouseId,
      orderDate: new Date(orderDate).toISOString(),
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
      notes: notes.trim() || null,
      items: items.map((it) => ({
        productId: it.productId,
        quantityOrdered: Number(it.quantityOrdered),
        unitCost: Number(it.unitCost) || 0,
      })),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/purchases"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">{t('purchases.newPO')}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Draft a replenishment order for goods to be delivered to a warehouse.
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-[6px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{formError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Details Header */}
        <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-semibold text-text border-b border-border pb-3">
            1. Vendor & Destination Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label={t('purchases.supplier')} required>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                required
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Destination Warehouse" required>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                required
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t('purchases.orderDate')} required>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </FormField>

            <FormField label={t('purchases.expectedDate')}>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="font-mono text-xs"
              />
            </FormField>

            <div className="sm:col-span-2 lg:col-span-4">
              <FormField label="Order Notes & Special Instructions">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, freight instructions, delivery dock contact..."
                  className="w-full rounded-[6px] border border-border bg-surface text-text px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-text">2. Line Items</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Specify quantities and agreed unit purchase pricing.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              const lineTotal = (item.quantityOrdered || 0) * (item.unitCost || 0);

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-[6px] border border-border bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <span className="font-mono text-xs text-text-muted w-6">#{index + 1}</span>

                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                      required
                    >
                      <option value="">Select product to purchase...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Qty"
                      value={item.quantityOrdered}
                      onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                      className="font-mono text-xs text-right"
                      required
                    />
                  </div>

                  {canViewCost && (
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Unit Cost"
                        value={item.unitCost}
                        onChange={(e) => handleUnitCostChange(index, Number(e.target.value))}
                        className="font-mono text-xs text-right"
                        required
                      />
                    </div>
                  )}

                  {canViewCost && (
                    <div className="w-28 text-right tabular-nums font-semibold text-xs text-text">
                      ${lineTotal.toFixed(2)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-text-muted hover:text-danger rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Totals Summary Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-[6px] bg-slate-100 dark:bg-slate-800/60 border border-border mt-4">
            <div className="space-y-1 text-xs text-text-muted">
              <div>
                Total Item Lines: <strong className="text-text">{items.length}</strong>
              </div>
              <div>
                Total Units Ordered: <strong className="text-text">{totalUnits}</strong>
              </div>
            </div>

            {canViewCost && (
              <div className="text-right mt-2 sm:mt-0">
                <span className="text-xs text-text-muted block">Estimated Purchase Total</span>
                <span className="text-xl tabular-nums font-bold text-accent">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/app/purchases">
            <Button variant="outline" type="button">
              {t('common.cancel') || 'Cancel'}
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex items-center gap-2"
            isLoading={createMutation.isPending}
            loadingText="Creating Purchase Order..."
          >
            <Save className="w-4 h-4" />
            <span>{t('purchases.newPO')}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
