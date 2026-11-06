'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../../lib/api-client';
import { CategoryDTO, ProductDTO, UnitOfMeasure } from '@stockwise/shared';
import { useAuth } from '../../../../../lib/auth-context';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { Input } from '../../../../../components/ui/Input';
import { useToast } from '../../../../../lib/toast-context';
import { useTranslation } from '../../../../../i18n/i18n-context';
import { ArrowLeft, Save, AlertCircle, Upload, Trash2, ImageIcon, Loader2 } from 'lucide-react';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [version, setVersion] = useState(1);

  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiRequest(`/products/${productId}/image`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-detail', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      toast.success('Product image updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload product image.');
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/products/${productId}/image`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-detail', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      toast.success('Product image removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove image.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', 'Product image must be less than 5MB');
        return;
      }
      uploadImageMutation.mutate(file);
    }
  };

  // Fetch product data
  const { data: productRes, isLoading: isProductLoading } = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => apiRequest<ProductDTO>(`/products/${productId}`),
  });

  // Fetch categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => apiRequest<CategoryDTO[]>('/categories'),
  });
  const categories = categoriesRes?.data || [];

  // Populate form
  useEffect(() => {
    if (productRes?.data) {
      const p = productRes.data;
      setSku(p.sku);
      setBarcode(p.barcode || '');
      setName(p.name);
      setSlug(p.slug);
      setBrand(p.brand || '');
      setDescription(p.description || '');
      setCategoryId(p.categoryId);
      setUnit(p.unit);
      if (p.costPrice !== undefined) {
        setCostPrice(String(p.costPrice));
      }
      setSellingPrice(String(p.sellingPrice));
      setReorderLevel(String(p.reorderLevel));
      setIsPublished(p.isPublished);
      setVersion(p.version);
    }
  }, [productRes]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest<ProductDTO>(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-detail', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      toast.success(t('toasts.productUpdated'));
      router.push(`/app/products/${productId}`);
    },
    onError: (err: any) => {
      let msg = err.message || 'Failed to update product. Optimistic locking or validation error.';
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
      version,
    };

    if (canViewCost) {
      payload.costPrice = Number(costPrice) || 0;
    }

    updateMutation.mutate(payload);
  };

  if (isProductLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-text-muted">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/products/${productId}`}
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">{t('products.editProduct')}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Update product specs, pricing, and reorder alerts.
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
            <FormField label={t('products.sku')} required hint={t('products.skuHint')}>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                className="uppercase font-semibold tracking-wide"
                required
              />
            </FormField>

            <FormField label={t('products.barcode')} hint={t('products.barcodeHint')}>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="tracking-wide"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label={t('products.productName')} required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label={t('products.urlSlug')} required hint={t('products.slugHint')}>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                  className="text-xs"
                  required
                />
              </FormField>
            </div>

            <FormField label={t('products.brand')}>
              <Input
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
              <FormField label={`${t('products.costPrice')} ($)`}>
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

            <FormField label={`${t('products.sellingPrice')} ($)`} required>
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

            <FormField label={t('products.reorderLevel')} required>
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

        {/* Section 2.5: Product Photo */}
        <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent" />
                <span>Product Image</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Upload or replace the primary product catalog image (PNG, JPEG, WebP up to 5MB).
              </p>
            </div>
            {productRes?.data?.imageUrl && (
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Uploaded
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-32 bg-surface-muted/60 rounded-[8px] border border-border flex items-center justify-center p-2 overflow-hidden shrink-0">
              {productRes?.data?.imageUrl ? (
                <img
                  src={productRes.data.imageUrl}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-text-muted/60 text-center">
                  <ImageIcon className="w-8 h-8 stroke-[1.5] mb-1" />
                  <span className="text-[10px] font-medium">No photo</span>
                </div>
              )}

              {uploadImageMutation.isPending && (
                <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-xs font-semibold text-accent">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 text-center sm:text-left">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs"
                  disabled={uploadImageMutation.isPending || removeImageMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{productRes?.data?.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </Button>

                {productRes?.data?.imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs flex items-center gap-1.5"
                    disabled={uploadImageMutation.isPending || removeImageMutation.isPending}
                    onClick={() => removeImageMutation.mutate()}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Images are automatically optimized and served with high-performance edge caching across public and staff portals.
              </p>
            </div>
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
          <Link href={`/app/products/${productId}`}>
            <Button variant="outline" type="button">
              {t('actions.cancel')}
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex items-center gap-2"
            isLoading={updateMutation.isPending}
            loadingText="Saving Changes..."
          >
            <Save className="w-4 h-4" />
            <span>{t('actions.save')} Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
