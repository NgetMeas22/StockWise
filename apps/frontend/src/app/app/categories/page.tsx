'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { CategoryDTO } from '@stockwise/shared';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  FolderTree,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Search,
  Folder,
  ChevronRight,
  FolderOpen,
  AlertCircle,
  Package,
} from 'lucide-react';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CategoryDTO | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  // Archive modal states
  const [moveProductsTo, setMoveProductsTo] = useState<string>('');

  // Fetch flat categories list (for parent selector)
  const { data: flatCategoriesRes } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: () => apiRequest<CategoryDTO[]>('/categories'),
  });
  const flatCategories = flatCategoriesRes?.data || [];

  // Fetch tree categories
  const { data: treeCategoriesRes, isLoading, isFetching } = useQuery({
    queryKey: ['categories-tree', searchTerm],
    queryFn: () => apiRequest<CategoryDTO[]>(`/categories?tree=true${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''}`),
  });
  const treeCategories = treeCategoriesRes?.data || [];

  // Open modal for new category
  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentId('');
    setDescription('');
    setSortOrder('0');
    setFormError(null);
    setShowModal(true);
  };

  // Open modal for editing category
  const openEditModal = (cat: CategoryDTO) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId || '');
    setDescription(cat.description || '');
    setSortOrder(String(cat.sortOrder || 0));
    setFormError(null);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  // Create / Update mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingCategory) {
        return apiRequest(`/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        return apiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['categories-flat'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save category.');
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }
    if (!slug.trim()) {
      setFormError('Category slug is required');
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      parentId: parentId || null,
      description: description.trim() || null,
      sortOrder: Number(sortOrder) || 0,
      status: 'ACTIVE',
    };

    saveCategoryMutation.mutate(payload);
  };

  // Archive / Restore mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ id, isArchived, targetCatId }: { id: string; isArchived: boolean; targetCatId?: string }) => {
      const endpoint = isArchived ? `/categories/${id}/restore` : `/categories/${id}/archive`;
      return apiRequest(endpoint, {
        method: 'POST',
        body: targetCatId ? JSON.stringify({ moveProductsTo: targetCatId }) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['categories-flat'] });
      setArchiveTarget(null);
    },
  });

  const handleArchiveConfirm = () => {
    if (!archiveTarget) return;
    const isArchived = archiveTarget.status === 'ARCHIVED';
    archiveMutation.mutate({
      id: archiveTarget.id,
      isArchived,
      targetCatId: moveProductsTo || undefined,
    });
  };

  // Recursive render for category items
  const renderCategoryRow = (cat: CategoryDTO, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;

    return (
      <React.Fragment key={cat.id}>
        <tr className="hover:bg-slate-50/70 transition-colors">
          <td className="px-4 py-3">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 24}px` }}
            >
              {depth > 0 && <span className="text-border">└─</span>}
              {hasChildren ? (
                <FolderOpen className="w-4 h-4 text-accent shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-text-muted shrink-0" />
              )}
              <div>
                <span className="font-semibold text-text">{cat.name}</span>
                {cat.description && (
                  <p className="text-[11px] text-text-muted line-clamp-1">{cat.description}</p>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
            {cat.slug}
          </td>
          <td className="px-4 py-3 text-right">
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-text">
              <Package className="w-3.5 h-3.5 text-text-muted" />
              {cat.productCount ?? 0}
            </span>
          </td>
          <td className="px-4 py-3 text-center font-mono text-xs text-text-muted">
            {cat.sortOrder ?? 0}
          </td>
          <td className="px-4 py-3 text-center">
            {cat.status === 'ACTIVE' ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="neutral">Archived</Badge>
            )}
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <Can permission="categories:manage">
                <button
                  onClick={() => openEditModal(cat)}
                  title="Edit Category"
                  className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </Can>

              <Can permission="categories:manage">
                <button
                  onClick={() => {
                    setArchiveTarget(cat);
                    setMoveProductsTo('');
                  }}
                  title={cat.status === 'ARCHIVED' ? 'Restore Category' : 'Archive Category'}
                  className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-slate-100 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </Can>
            </div>
          </td>
        </tr>
        {hasChildren &&
          cat.children!.map((child) => renderCategoryRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Categories</h1>
          <p className="text-sm text-text-muted mt-1">
            Organize products into hierarchical departments and classification groups.
          </p>
        </div>
        <Can permission="categories:manage">
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Button>
        </Can>
      </div>

      {/* Search Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center text-xs text-text-muted">
          {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
          <span>{flatCategories.length} categories total</span>
        </div>
      </div>

      {/* Category Tree Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : treeCategories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories found"
            description="Create categories to help organize your product catalog and public store."
            action={
              <Can permission="categories:manage">
                <Button size="sm" onClick={openCreateModal}>
                  Create First Category
                </Button>
              </Can>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-right">Products</th>
                  <th className="px-4 py-3 text-center">Sort Order</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {treeCategories.map((c) => renderCategoryRow(c, 0))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              isLoading={saveCategoryMutation.isPending}
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label="Category Name" required>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Ergonomic Desks"
              required
            />
          </FormField>

          <FormField label="URL Slug" required hint="Lowercase letters, numbers, and hyphens">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. ergonomic-desks"
              className="font-mono text-xs"
              required
            />
          </FormField>

          <FormField label="Parent Category" hint="Leave blank to create a top-level department">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">None (Top-Level Category)</option>
              {flatCategories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Description">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for navigation and catalog..."
              className="w-full rounded-[6px] border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>

          <FormField label="Sort Order" hint="Lower numbers appear first">
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="font-mono"
            />
          </FormField>
        </form>
      </Modal>

      {/* Archive / Restore Confirmation Modal */}
      <Modal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title={archiveTarget?.status === 'ARCHIVED' ? 'Restore Category' : 'Archive Category'}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={archiveTarget?.status === 'ARCHIVED' ? 'primary' : 'danger'}
              onClick={handleArchiveConfirm}
              isLoading={archiveMutation.isPending}
            >
              {archiveTarget?.status === 'ARCHIVED' ? 'Restore Category' : 'Confirm Archive'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to {archiveTarget?.status === 'ARCHIVED' ? 'restore' : 'archive'}{' '}
            <strong className="font-semibold">{archiveTarget?.name}</strong>?
          </p>

          {archiveTarget?.status !== 'ARCHIVED' && Number(archiveTarget?.productCount || 0) > 0 && (
            <div className="space-y-2 bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-[6px] text-xs">
              <p className="font-semibold">
                This category currently contains {archiveTarget?.productCount} product(s).
              </p>
              <p>Optionally reassign them to another category before archiving:</p>
              <select
                value={moveProductsTo}
                onChange={(e) => setMoveProductsTo(e.target.value)}
                className="w-full h-8 px-2 text-xs rounded border border-amber-300 bg-white text-text mt-1"
              >
                <option value="">Do not move (keep existing)</option>
                {flatCategories
                  .filter((c) => c.id !== archiveTarget?.id && c.status === 'ACTIVE')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      Move to: {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
