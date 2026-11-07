'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { CategoryDTO, ProductDTO, UnitOfMeasure } from '@stockwise/shared';
import { useAuth } from '../../../../lib/auth-context';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { useToast } from '../../../../lib/toast-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>(UnitOfMeasure.EACH);
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [isPublished, setIsPublished] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => apiRequest<CategoryDTO[]>('/categories'),
  });
  const categories = categoriesRes?.data || [];

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    const sanitized = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (sanitized) {
      setSlug(sanitized);
    } else if (val.trim()) {
      setSlug(`prod-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleSkuChange = (val: string) => {
    setSku(val.toUpperCase().replace(/\s+/g, '-'));
  };

  const handleSlugChange = (val: string) => {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest<ProductDTO>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      toast.success(t('toasts.productCreated'));
      if (res?.data?.id) {
        router.push(`/app/products/${res.data.id}`);
      } else {
        router.push('/app/products');
      }
    },
    onError: (err: any) => {
      let msg = err.message || 'Failed to create product. Check your input.';
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const detailsList = err.details
          .map((d: any) => `• ${d.field ? `${d.field}: ` : ''}${d.message}`)
          .join('\n');
        msg = `${msg}\n${detailsList}`;
      }
      setFormError(msg);
      toast.error(err.message || 'Validation error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSku = sku.trim().toUpperCase().replace(/\s+/g, '-');
    const cleanSlug =
      slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '') || `prod-${Date.now().toString().slice(-6)}`;

    if (!cleanSku) {
      setFormError('SKU code is required');
      return;
    }
    if (!name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!cleanSlug) {
      setFormError('URL slug is required');
      return;
    }
    if (!categoryId) {
      setFormError('Please select a Category');
      return;
    }

    const payload: any = {
      sku: cleanSku,
      barcode: barcode.trim() || null,
      name: name.trim(),
      slug: cleanSlug,
      brand: brand.trim() || null,
      description: description.trim() || null,
      categoryId,
      unit,
      sellingPrice: Number(sellingPrice) || 0,
      reorderLevel: Number(reorderLevel) || 0,
      isPublished,
      status: 'ACTIVE',
    };

    if (canViewCost) {
      payload.costPrice = Number(costPrice) || 0;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/products"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">{t('products.newProduct')}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {t('products.createSubtitle') || 'Define a new catalog item, pricing, and stock monitoring threshold.'}
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-[8px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="whitespace-pre-line font-medium">{formError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identification */}
        <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-semibold text-text border-b border-border pb-3">
            {t('products.identitySection')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('products.sku')} required hint={t('products.skuHint') || 'Unique alphanumeric stock keeping unit'}>
              <Input
                placeholder="e.g. STW-OFF-001"
                value={sku}
                onChange={(e) => handleSkuChange(e.target.value)}
                className="uppercase font-semibold tracking-wide"
                required
              />
            </FormField>

            <FormField label={t('products.barcode')} hint={t('products.barcodeHint') || 'Optional scanning barcode'}>
              <Input
                placeholder="e.g. 893123456789"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="tracking-wide"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label={t('products.productName')} required>
                <Input
                  placeholder="e.g. Ergonomic Mesh Office Chair"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label={t('products.urlSlug')} required hint={t('products.slugHint') || 'Used in public catalog links'}>
                <Input
                  placeholder="e.g. ergonomic-mesh-office-chair"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="text-xs"
                  required
                />
              </FormField>
            </div>

            <FormField label={t('products.brand')}>
              <Input
                placeholder="e.g. ErgoComfort"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </FormField>

            <FormField label={t('products.category')} required>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="sm:col-span-2">
              <FormField label={t('categories.description')}>
                <textarea
                  rows={3}
                  placeholder="Detailed specifications, features, and dimensions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-[6px] border border-border bg-surface text-text px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory Control */}
        <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-semibold text-text border-b border-border pb-3">
            {t('products.pricingSection')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={t('products.unit')} required>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {Object.values(UnitOfMeasure).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </FormField>

            {canViewCost && (
              <FormField label={`${t('products.costPrice')} ($)`} hint="Purchase baseline">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="font-mono"
                />
              </FormField>
            )}

            <FormField label={`${t('products.sellingPrice')} ($)`} required hint="Standard sales price">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="font-mono font-bold"
                required
              />
            </FormField>

            <FormField label={t('products.reorderLevel')} required hint="Alert trigger when stock falls below">
              <Input
                type="number"
                step="1"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="font-mono"
                required
              />
            </FormField>
          </div>
        </div>

        {/* Section 3: Visibility & Publishing */}
        <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-semibold text-text border-b border-border pb-3">
            {t('products.visibilitySection')}
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text">{t('products.publishToCatalog')}</div>
              <p className="text-xs text-text-muted mt-0.5">
                {t('products.publishHint')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/app/products">
            <Button variant="outline" type="button">
              {t('common.cancel') || 'Cancel'}
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex items-center gap-2"
            isLoading={createMutation.isPending}
            loadingText="Creating Product..."
          >
            <Save className="w-4 h-4" />
            <span>{t('products.addProduct')}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
