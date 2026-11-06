'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { ProductDTO, CategoryDTO } from '@stockwise/shared';
import { useAuth } from '../../../lib/auth-context';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { StockBadge } from '../../../components/ui/StockBadge';
import { Badge } from '../../../components/ui/Badge';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToast } from '../../../lib/toast-context';
import { useTranslation } from '../../../i18n/i18n-context';
import {
  Search,
  Plus,
  Package,
  Eye,
  Edit2,
  Archive,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCost = hasPermission('products:view_cost');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStockState, setSelectedStockState] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt:desc');

  // Confirmation modal state
  const [archiveTarget, setArchiveTarget] = useState<ProductDTO | null>(null);

  // Fetch categories for filtering
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => apiRequest<CategoryDTO[]>('/categories'),
  });
  const categories = categoriesRes?.data || [];

  // Query products
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
    ...(selectedCategory ? { categoryId: selectedCategory } : {}),
    ...(selectedStockState !== 'all' ? { stockState: selectedStockState } : {}),
    ...(includeArchived ? { status: 'ARCHIVED' } : { status: 'ACTIVE' }),
    sort: sortBy,
  }).toString();

  const { data: productsRes, isLoading, isFetching } = useQuery({
    queryKey: ['products-list', queryParams],
    queryFn: () => apiRequest<ProductDTO[]>(`/products?${queryParams}`),
  });

  const products = productsRes?.data || [];
  const meta = productsRes?.meta || { total: 0, page: 1, pageSize: 15, totalPages: 1 };

  // Archive / Restore mutation
  const toggleArchiveMutation = useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const endpoint = isArchived ? `/products/${id}/restore` : `/products/${id}/archive`;
      return apiRequest(endpoint, { method: 'POST' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      toast.success(variables.isArchived ? t('toasts.productRestored') : t('toasts.productArchived'));
      setArchiveTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Operation failed.');
    },
  });

  const handleArchiveConfirm = () => {
    if (!archiveTarget) return;
    const isCurrentlyArchived = archiveTarget.status === 'ARCHIVED';
    toggleArchiveMutation.mutate({ id: archiveTarget.id, isArchived: isCurrentlyArchived });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div
        data-aos="fade-down"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            <span>{t('products.title')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent font-semibold">
              {meta.total}
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {t('products.subtitle')}
          </p>
        </div>

        <Can permission="products:create">
          <Link href="/app/products/new">
            <Button className="flex items-center gap-1.5 shadow-sm text-xs">
              <Plus className="w-4 h-4" />
              <span>{t('products.addProduct')}</span>
            </Button>
          </Link>
        </Can>
      </div>

      {/* Filter and Tab Bar (Elevated Pic 3 Style) */}
      <div
        data-aos="fade-up"
        className="bg-surface rounded-[12px] border border-border p-4 shadow-sm space-y-4"
      >
        {/* Stock Status Pills & Archived Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setSelectedStockState('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all ${
                selectedStockState === 'all'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-text-muted hover:text-text hover:bg-surface-muted'
              }`}
            >
              {t('products.allStock')}
            </button>

            <button
              type="button"
              onClick={() => { setSelectedStockState('in'); setPage(1); }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all ${
                selectedStockState === 'in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
              }`}
            >
              {t('products.inStock')}
            </button>

            <button
              type="button"
              onClick={() => { setSelectedStockState('low'); setPage(1); }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all ${
                selectedStockState === 'low'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
            >
              {t('products.lowStock')}
            </button>

            <button
              type="button"
              onClick={() => { setSelectedStockState('out'); setPage(1); }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all ${
                selectedStockState === 'out'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              }`}
            >
              {t('products.outOfStock')}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-text-muted flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => { setIncludeArchived(e.target.checked); setPage(1); }}
                className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent"
              />
              <span>{t('products.showArchived')}</span>
            </label>
          </div>
        </div>

        {/* Search, Categories, Sort, and Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={`${t('common.search')} SKU, Name, Brand...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-[8px] border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-[8px] border border-border bg-surface text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-[8px] border border-border bg-surface text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="sku:asc">SKU (Ascending)</option>
              <option value="sellingPrice:desc">Price (High to Low)</option>
              <option value="sellingPrice:asc">Price (Low to High)</option>
            </select>
          </div>

          {/* Count & Refresh Indicator */}
          <div className="flex items-center justify-end text-xs text-text-muted font-medium">
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
            <span>
              Showing {products.length} of {meta.total} products
            </span>
          </div>
        </div>
      </div>

      {/* Products Table (Pic 3 Style Modern High-End Grid) */}
      <div
        data-aos="fade-up"
        data-aos-delay="100"
        className="bg-surface rounded-[12px] border border-border shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <TableSkeleton rows={8} columns={canViewCost ? 9 : 8} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('common.noData')}
            description={
              searchTerm || selectedCategory || selectedStockState !== 'all'
                ? "Try adjusting your search filters or clear them to see all products."
                : "Get started by adding your first product to the inventory catalog."
            }
            action={
              <Can permission="products:create">
                <Link href="/app/products/new">
                  <Button size="sm">{t('products.addProduct')}</Button>
                </Link>
              </Can>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-text font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3.5 min-w-[220px]">{t('products.productName')}</th>
                  <th className="px-4 py-3.5 min-w-[160px]">SKU Code / Barcode</th>
                  <th className="px-4 py-3.5 min-w-[130px]">{t('products.category')}</th>
                  <th className="px-4 py-3.5 text-right min-w-[140px]">{t('products.stockLevel')}</th>
                  <th className="px-4 py-3.5 text-right min-w-[110px]">{t('products.reorderLevel')}</th>
                  {canViewCost && <th className="px-4 py-3.5 text-right min-w-[90px]">{t('products.costPrice')}</th>}
                  <th className="px-4 py-3.5 text-right min-w-[90px]">{t('products.sellingPrice')}</th>
                  <th className="px-4 py-3.5 text-center min-w-[100px]">{t('common.status')}</th>
                  <th className="px-4 py-3.5 text-right min-w-[90px] pr-5">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const qty = Number(p.totalQuantityOnHand || 0);
                  const reorder = Number(p.reorderLevel || 0);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-surface-muted/50 transition-colors group"
                    >
                      {/* Product Name & Brand */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg border border-border bg-surface-muted flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-accent" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/app/products/${p.id}`}
                              className="font-bold text-text hover:text-accent truncate block transition-colors leading-tight"
                            >
                              {p.name}
                            </Link>
                            {p.brand && (
                              <span className="text-[10px] text-text-muted block mt-0.5">{p.brand}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU / Barcode */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text text-xs tracking-tight">{p.sku}</div>
                        {p.barcode && (
                          <div className="text-[10px] text-text-muted mt-0.5 tracking-tight">{p.barcode}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-[4px] bg-surface-muted border border-border text-text text-[11px] font-medium">
                          {p.categoryName || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Stock Level with Pill Badge */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-semibold text-text tabular-nums text-xs">
                            {qty} <span className="text-[10px] font-medium text-text-muted uppercase">{p.unit}</span>
                          </span>
                          <StockBadge quantity={qty} reorderLevel={reorder} />
                        </div>
                      </td>

                      {/* Reorder Level */}
                      <td className="px-4 py-3 text-right tabular-nums text-xs">
                        <span className="font-medium text-text-muted">{reorder}</span>{' '}
                        <span className="text-[10px] text-text-muted uppercase">{p.unit}</span>
                      </td>

                      {/* Cost Price */}
                      {canViewCost && (
                        <td className="px-4 py-3 text-right text-xs tabular-nums text-text-muted font-medium">
                          {p.costPrice ? `$${Number(p.costPrice).toFixed(2)}` : '—'}
                        </td>
                      )}

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right text-xs tabular-nums font-semibold text-text">
                        ${Number(p.sellingPrice).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {p.status === 'ARCHIVED' ? (
                          <Badge variant="neutral">{t('common.archived')}</Badge>
                        ) : p.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/app/products/${p.id}`}>
                            <button
                              title="View Details"
                              className="p-1.5 text-text-muted hover:text-text rounded-md hover:bg-surface-muted transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          <Can permission="products:update">
                            <Link href={`/app/products/${p.id}/edit`}>
                              <button
                                title="Edit Product"
                                className="p-1.5 text-text-muted hover:text-text rounded-md hover:bg-surface-muted transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </Can>

                          <Can permission="products:archive">
                            <button
                              title={p.status === 'ARCHIVED' ? 'Restore Product' : 'Archive Product'}
                              onClick={() => setArchiveTarget(p)}
                              className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-surface-muted transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
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

        {/* Pagination Controls */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted bg-surface-muted/30">
            <div>
              {t('common.page')} <span className="font-semibold text-text">{meta.page}</span> {t('common.of')}{' '}
              <span className="font-semibold text-text">{meta.totalPages}</span> ({meta.total} items total)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('common.previous')}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="h-8 text-xs flex items-center gap-1"
              >
                <span>{t('common.next')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Archiving */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        title={archiveTarget?.status === 'ARCHIVED' ? t('products.confirmRestore') : t('products.confirmArchive')}
        message={
          archiveTarget?.status === 'ARCHIVED'
            ? `Are you sure you want to restore "${archiveTarget?.name}" back to the active catalog?`
            : `Are you sure you want to archive "${archiveTarget?.name}"? ${t('products.archiveWarning')}`
        }
        confirmLabel={archiveTarget?.status === 'ARCHIVED' ? t('common.restore') : t('common.archive')}
        variant={archiveTarget?.status === 'ARCHIVED' ? 'primary' : 'warning'}
        isLoading={toggleArchiveMutation.isPending}
        onConfirm={handleArchiveConfirm}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
}
