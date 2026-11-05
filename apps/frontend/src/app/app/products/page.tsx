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
import { Modal } from '../../../components/ui/Modal';
import {
  Search,
  Plus,
  Package,
  Eye,
  Edit2,
  Archive,
  RefreshCw,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setArchiveTarget(null);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Products</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your product catalog, pricing, SKU codes, and reorder levels.
          </p>
        </div>
        <Can permission="products:create">
          <Link href="/app/products/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Button>
          </Link>
        </Can>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-4">
        {/* Stock Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => { setSelectedStockState('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockState === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-text-muted hover:text-text hover:bg-slate-100'
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => { setSelectedStockState('in'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockState === 'in'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => { setSelectedStockState('low'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockState === 'low'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => { setSelectedStockState('out'); setPage(1); }}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
              selectedStockState === 'out'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            Out of Stock
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-text-muted flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => { setIncludeArchived(e.target.checked); setPage(1); }}
                className="rounded border-border text-accent focus:ring-accent"
              />
              Show Archived Only
            </label>
          </div>
        </div>

        {/* Search & Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by SKU, Name, Brand..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="sku:asc">SKU (Ascending)</option>
              <option value="sellingPrice:desc">Price (High to Low)</option>
              <option value="sellingPrice:asc">Price (Low to High)</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-text-muted">
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
            Showing {products.length} of {meta.total} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={
              searchTerm || selectedCategory || selectedStockState !== 'all'
                ? "Try adjusting your search filters or clear them to see all products."
                : "Get started by adding your first product to the inventory catalog."
            }
            action={
              <Can permission="products:create">
                <Link href="/app/products/new">
                  <Button size="sm">Create First Product</Button>
                </Link>
              </Can>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU / Barcode</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Stock Level</th>
                  <th className="px-4 py-3 text-right">Reorder</th>
                  {canViewCost && <th className="px-4 py-3 text-right">Cost Price</th>}
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const qty = Number(p.totalQuantityOnHand || 0);
                  const reorder = Number(p.reorderLevel || 0);
                  const isLow = qty > 0 && qty <= reorder;
                  const isOut = qty === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Brand */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[6px] border border-border bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-text-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/app/products/${p.id}`}
                              className="font-semibold text-text hover:text-accent truncate block"
                            >
                              {p.name}
                            </Link>
                            {p.brand && (
                              <span className="text-[10px] text-text-muted">{p.brand}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU / Barcode */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-text">{p.sku}</div>
                        {p.barcode && (
                          <div className="font-mono text-[10px] text-text-muted">{p.barcode}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {p.categoryName || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono font-bold text-text">
                            {qty} {p.unit}
                          </span>
                          <StockBadge quantity={qty} reorderLevel={reorder} />
                        </div>
                      </td>

                      {/* Reorder Level */}
                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        {reorder} {p.unit}
                      </td>

                      {/* Cost Price (Permission gated) */}
                      {canViewCost && (
                        <td className="px-4 py-3 text-right font-mono text-text-muted">
                          {p.costPrice ? `$${Number(p.costPrice).toFixed(2)}` : '—'}
                        </td>
                      )}

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-text">
                        ${Number(p.sellingPrice).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {p.status === 'ARCHIVED' ? (
                          <Badge variant="neutral">Archived</Badge>
                        ) : p.isPublished ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="warning">Draft</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/app/products/${p.id}`}>
                            <button
                              title="View Details"
                              className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          <Can permission="products:update">
                            <Link href={`/app/products/${p.id}/edit`}>
                              <button
                                title="Edit Product"
                                className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </Can>

                          <Can permission="products:archive">
                            <button
                              onClick={() => setArchiveTarget(p)}
                              title={p.status === 'ARCHIVED' ? 'Restore Product' : 'Archive Product'}
                              className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-slate-100 transition-colors"
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

      {/* Archive / Restore Confirmation Modal */}
      <Modal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title={archiveTarget?.status === 'ARCHIVED' ? 'Restore Product' : 'Archive Product'}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={archiveTarget?.status === 'ARCHIVED' ? 'primary' : 'danger'}
              onClick={handleArchiveConfirm}
              isLoading={toggleArchiveMutation.isPending}
            >
              {archiveTarget?.status === 'ARCHIVED' ? 'Restore Product' : 'Confirm Archive'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text">
            Are you sure you want to {archiveTarget?.status === 'ARCHIVED' ? 'restore' : 'archive'}{' '}
            <strong className="font-semibold">{archiveTarget?.name}</strong> ({archiveTarget?.sku})?
          </p>
          {archiveTarget?.status !== 'ARCHIVED' && (
            <p className="text-xs text-text-muted bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-[6px]">
              Archived products remain in existing transaction history and reports but cannot be selected for new stock movements or purchase orders.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

