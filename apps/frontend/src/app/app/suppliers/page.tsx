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
  MapPin,
  AlertCircle,
} from 'lucide-react';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
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
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save supplier.');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      setToggleTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Suppliers</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your vendors, contact details, procurement terms, and status.
          </p>
        </div>
        <Can permission="suppliers:manage">
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
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
              placeholder="Search by vendor name, contact, or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs rounded-[6px] border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Statuses</option>
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
            title="No suppliers found"
            description="Add vendors and suppliers to enable purchase orders and replenishments."
            action={
              <Can permission="suppliers:manage">
                <Button size="sm" onClick={openCreateModal}>
                  Create Supplier
                </Button>
              </Can>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
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
                        {!s.email && !s.phone && <span className="text-text-muted">—</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-text-muted truncate max-w-[180px]" title={s.address || ''}>
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
                            title="Edit Supplier"
                            className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setToggleTarget(s)}
                            title={s.status === SupplierStatus.ACTIVE ? 'Deactivate Supplier' : 'Activate Supplier'}
                            className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-slate-100 transition-colors"
                          >
                            {s.status === SupplierStatus.ACTIVE ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
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

      {/* Create / Edit Supplier Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Edit Supplier' : 'New Supplier'}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} isLoading={saveMutation.isPending}>
              {editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label="Supplier / Company Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Industrial Supplies"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Person">
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0192"
              />
            </FormField>
          </div>

          <FormField label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. orders@apexsupplies.com"
            />
          </FormField>

          <FormField label="Physical / Billing Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 100 Logistics Way, Suite 400"
            />
          </FormField>

          <FormField label="Internal Notes / Terms">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms: Net 30, lead time 5 business days..."
              className="w-full rounded-[6px] border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </FormField>
        </form>
      </Modal>

      {/* Deactivate / Activate Status Modal */}
      <Modal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.status === SupplierStatus.ACTIVE ? 'Deactivate Supplier' : 'Activate Supplier'}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToggleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={toggleTarget?.status === SupplierStatus.ACTIVE ? 'danger' : 'primary'}
              onClick={() => {
                if (!toggleTarget) return;
                toggleStatusMutation.mutate({
                  id: toggleTarget.id,
                  newStatus:
                    toggleTarget.status === SupplierStatus.ACTIVE
                      ? SupplierStatus.INACTIVE
                      : SupplierStatus.ACTIVE,
                });
              }}
              isLoading={toggleStatusMutation.isPending}
            >
              {toggleTarget?.status === SupplierStatus.ACTIVE ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text">
          Are you sure you want to {toggleTarget?.status === SupplierStatus.ACTIVE ? 'deactivate' : 'activate'}{' '}
          <strong>{toggleTarget?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}

