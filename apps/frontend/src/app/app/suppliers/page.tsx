'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { SupplierDTO, SupplierStatus } from '@stockwise/shared';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToast } from '../../../lib/toast-context';
import { useTranslation } from '../../../i18n/i18n-context';
import {
  Truck,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDTO | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Status toggle confirmation
  const [toggleTarget, setToggleTarget] = useState<SupplierDTO | null>(null);

  // Query suppliers
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }).toString();

  const { data: suppliersRes, isLoading, isFetching } = useQuery({
    queryKey: ['suppliers-list', queryParams],
    queryFn: () => apiRequest<SupplierDTO[]>(`/suppliers?${queryParams}`),
  });

  const suppliers = suppliersRes?.data || [];
  const meta = suppliersRes?.meta || { total: 0, page: 1, pageSize: 15, totalPages: 1 };

  // Create / Edit modal openers
  const openCreateModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (s: SupplierDTO) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson || '');
    setEmail(s.email || '');
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setFormError(null);
    setShowModal(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingSupplier) {
        return apiRequest(`/suppliers/${editingSupplier.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        return apiRequest('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      setShowModal(false);
      toast.success(t('toasts.supplierSaved'));
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to save supplier.';
      setFormError(msg);
      toast.error(msg);
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Supplier name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      contactPerson: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    saveMutation.mutate(payload);
  };

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: SupplierStatus }) => {
      const endpoint = newStatus === SupplierStatus.ACTIVE ? `/suppliers/${id}/activate` : `/suppliers/${id}/deactivate`;
      return apiRequest(endpoint, { method: 'POST' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      setToggleTarget(null);
      toast.success(
        variables.newStatus === SupplierStatus.ACTIVE
          ? t('toasts.supplierActivated')
          : t('toasts.supplierDeactivated')
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to change supplier status.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('suppliers.title')}</h1>
          <p className="text-sm text-text-muted mt-1">
            {t('suppliers.subtitle')}
          </p>
        </div>
        <Can permission="suppliers:manage">
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>{t('suppliers.addSupplier')}</span>
          </Button>
        </Can>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={`${t('common.search')} vendor name, contact, or email...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t('common.all')} Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex items-center text-xs text-text-muted">
          {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
          <span>{meta.total} suppliers total</span>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={t('common.noData')}
            description="Add vendors and suppliers to enable purchase orders and replenishments."
            action={
              <Can permission="suppliers:manage">
                <Button size="sm" onClick={openCreateModal}>
                  {t('suppliers.addSupplier')}
                </Button>
              </Can>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">{t('suppliers.supplierName')}</th>
                  <th className="px-4 py-3">{t('suppliers.contactPerson')}</th>
                  <th className="px-4 py-3">{t('suppliers.email')} & {t('suppliers.phone')}</th>
                  <th className="px-4 py-3">{t('suppliers.address')}</th>
                  <th className="px-4 py-3 text-center">{t('common.status')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{s.name}</div>
                      {s.notes && (
                        <div className="text-[10px] text-text-muted line-clamp-1">{s.notes}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-text">
                      {s.contactPerson || <span className="text-text-muted">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-text-muted hover:text-text">
                            <Mail className="w-3 h-3 text-text-muted" />
                            <a href={`mailto:${s.email}`} className="truncate max-w-[160px]">
                              {s.email}
                            </a>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Phone className="w-3 h-3 text-text-muted" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-text-muted max-w-xs truncate" title={s.address || ''}>
                      {s.address || '—'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {s.status === SupplierStatus.ACTIVE ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Can permission="suppliers:manage">
                          <button
                            onClick={() => openEditModal(s)}
                            title={t('suppliers.editSupplier')}
                            className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setToggleTarget(s)}
                            title={s.status === SupplierStatus.ACTIVE ? t('suppliers.deactivate') : t('suppliers.activate')}
                            className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {s.status === SupplierStatus.ACTIVE ? (
                              <XCircle className="w-3.5 h-3.5 text-danger" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-ok" />
                            )}
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
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

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleFormSubmit}
              isLoading={saveMutation.isPending}
              loadingText="Saving..."
            >
              {editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label={t('suppliers.supplierName')} required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Industrial Supplies"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('suppliers.contactPerson')}>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </FormField>

            <FormField label={t('suppliers.phone')}>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0192"
              />
            </FormField>
          </div>

          <FormField label={t('suppliers.email')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. orders@apexsupplies.com"
            />
          </FormField>

          <FormField label={t('suppliers.address')}>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 100 Logistics Way, Suite 400"
            />
          </FormField>

          <FormField label={t('suppliers.terms')}>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms: Net 30, lead time 5 business days..."
              className="w-full rounded-[6px] border border-border bg-surface text-text px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </FormField>
        </form>
      </Modal>

      {/* Deactivate / Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          if (!toggleTarget) return;
          toggleStatusMutation.mutate({
            id: toggleTarget.id,
            newStatus:
              toggleTarget.status === SupplierStatus.ACTIVE
                ? SupplierStatus.INACTIVE
                : SupplierStatus.ACTIVE,
          });
        }}
        title={toggleTarget?.status === SupplierStatus.ACTIVE ? t('suppliers.deactivate') : t('suppliers.activate')}
        message={`Are you sure you want to ${toggleTarget?.status === SupplierStatus.ACTIVE ? 'deactivate' : 'activate'} "${toggleTarget?.name}"?`}
        confirmLabel={toggleTarget?.status === SupplierStatus.ACTIVE ? t('suppliers.deactivate') : t('suppliers.activate')}
        variant={toggleTarget?.status === SupplierStatus.ACTIVE ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
}
