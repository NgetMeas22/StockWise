'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { ProductDTO, WarehouseDTO } from '@stockwise/shared';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useToast } from '../../../lib/toast-context';
import { useTranslation } from '../../../i18n/i18n-context';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Check,
  Building2,
  Stethoscope,
  Send,
} from 'lucide-react';

interface RoomRequestItem {
  id: string;
  requestNumber: string;
  room: string;
  productId: string;
  quantity: number;
  urgency: 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string | null;
  productName: string;
  productSku: string;
  productUnit: string;
  requestedByName: string;
  requestedByEmail: string;
  dispatchedByName?: string | null;
}

const PRESET_ROOMS = [
  'Room 101 — Operatory / General',
  'Room 102 — Orthodontics',
  'Surgery Suite A — Oral Surgery',
  'Surgery Suite B — Implantology',
  'Hygiene Room 1 — Periodontics',
  'Dental Laboratory',
  'Central Sterilization Department (CSD)',
  'Emergency Care Unit',
];

export default function RoomRequestsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t, language } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'FULFILLED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Request Form State
  const [room, setRoom] = useState(PRESET_ROOMS[0]);
  const [customRoom, setCustomRoom] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [urgency, setUrgency] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fulfill Modal State
  const [fulfillingRequest, setFulfillingRequest] = useState<RoomRequestItem | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  // Fetch Requests
  const { data: requestsRes, isLoading } = useQuery({
    queryKey: ['room-requests', statusFilter],
    queryFn: () =>
      apiRequest<RoomRequestItem[]>(
        `/requests${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`
      ),
  });
  const requests = requestsRes?.data || [];

  // Fetch Products for dropdown
  const { data: productsRes } = useQuery({
    queryKey: ['products-list-all'],
    queryFn: () => apiRequest<{ items: ProductDTO[] }>('/products?pageSize=100'),
  });
  const products = productsRes?.data?.items || [];

  // Fetch Warehouses for fulfillment
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => apiRequest<WarehouseDTO[]>('/warehouses'),
  });
  const warehouses = warehousesRes?.data || [];

  // Create Request Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-requests'] });
      setShowNewModal(false);
      setRoom(PRESET_ROOMS[0]);
      setCustomRoom('');
      setProductId('');
      setQuantity('1');
      setUrgency('NORMAL');
      setNotes('');
      setFormError(null);
      toast.success(
        language === 'kh' ? 'បានបង្កើតសំណើសម្ភារ' : 'Room Request Created',
        language === 'kh' ? 'សំណើត្រូវបានបញ្ជូនទៅកាន់ឃ្លាំងកណ្តាល។' : 'Replenishment request dispatched to central inventory.'
      );
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit request');
      toast.error(err.message || 'Error submitting request');
    },
  });

  // Fulfill Mutation
  const fulfillMutation = useMutation({
    mutationFn: ({ id, warehouseId }: { id: string; warehouseId: string }) =>
      apiRequest(`/requests/${id}/fulfill`, {
        method: 'POST',
        body: JSON.stringify({ warehouseId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setFulfillingRequest(null);
      toast.success(
        language === 'kh' ? 'បានបញ្ជូនសម្ភារជោគជ័យ' : 'Request Fulfilled',
        language === 'kh' ? 'ស្តុកត្រូវបានកាត់ចេញពីឃ្លាំងដោយស្វ័យប្រវត្តិ។' : 'Items dispatched to room and inventory balance deducted.'
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to fulfill request');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Rejected by inventory manager' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-requests'] });
      toast.info(
        language === 'kh' ? 'បានបដិសេធសំណើ' : 'Request Rejected',
        language === 'kh' ? 'សំណើសម្ភារត្រូវបានបដិសេធ។' : 'Replenishment request marked as rejected.'
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject request');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetRoom = room === 'OTHER' ? customRoom.trim() : room;
    if (!targetRoom) {
      setFormError('Please select or specify a room / department.');
      return;
    }
    if (!productId) {
      setFormError('Please select a product.');
      return;
    }
    if (Number(quantity) <= 0) {
      setFormError('Quantity must be at least 1.');
      return;
    }

    createMutation.mutate({
      room: targetRoom,
      productId,
      quantity: Number(quantity),
      urgency,
      notes: notes.trim() || null,
    });
  };

  // Filter list
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.room.toLowerCase().includes(q) ||
      r.requestNumber.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.productSku.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-accent" />
            <span>{language === 'kh' ? 'សំណើសម្ភារតាមបន្ទប់ព្យាបាល' : 'Room & Department Stock Requests'}</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            {language === 'kh'
              ? 'ការស្នើសុំសម្ភារប្រើប្រាស់ពីបន្ទប់ព្យាបាលនីមួយៗ និងការរៀបចំបញ្ជូនចេញពីឃ្លាំងកណ្តាល។'
              : 'Digital replenishment queue from dental operatories to central store without clinic interruptions.'}
          </p>
        </div>

        <Button onClick={() => setShowNewModal(true)} className="text-xs font-semibold">
          <Plus className="w-4 h-4" />
          <span>{language === 'kh' ? '+ ស្នើសុំសម្ភារថ្មី' : '+ New Room Request'}</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-[8px] border border-border shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'FULFILLED', 'REJECTED'] as const).map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors shrink-0 ${
                  isActive
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-text-muted hover:text-text hover:bg-surface-muted'
                }`}
              >
                {st === 'ALL'
                  ? language === 'kh'
                    ? 'ទាំងអស់'
                    : 'All Requests'
                  : st === 'PENDING'
                  ? language === 'kh'
                    ? 'កំពុងរង់ចាំ (Pending)'
                    : 'Pending Queue'
                  : st === 'FULFILLED'
                  ? language === 'kh'
                    ? 'បានបញ្ជូន (Fulfilled)'
                    : 'Fulfilled'
                  : language === 'kh'
                  ? 'បានបដិសេធ'
                  : 'Rejected'}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder={language === 'kh' ? 'ស្វែងរកបន្ទប់ ឬទំនិញ...' : 'Search room, SKU, product...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-muted mx-auto flex items-center justify-center text-text-muted">
              <Layers className="w-6 h-6 opacity-40" />
            </div>
            <div className="text-sm font-semibold text-text">
              {language === 'kh' ? 'មិនមានសំណើសម្ភារទេ' : 'No Room Requests Found'}
            </div>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {language === 'kh'
                ? 'នៅពេលដែលបន្ទប់ព្យាបាលស្នើសុំសម្ភារ សំណើនឹងបង្ហាញនៅលើបញ្ជីនេះ។'
                : 'When dental rooms or surgery suites request consumables, their requests will queue here for fulfillment.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-text-muted font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Request #</th>
                  <th className="px-4 py-3">Room / Operatory</th>
                  <th className="px-4 py-3">Item Requested</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-center">Urgency</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-text">
                      {req.requestNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{req.room}</div>
                      {req.notes && (
                        <div className="text-[10px] text-text-muted italic truncate max-w-[200px]">
                          &ldquo;{req.notes}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{req.productName}</div>
                      <div className="font-mono text-[10px] text-text-muted">{req.productSku}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-text">
                      {req.quantity}{' '}
                      <span className="text-[10px] font-normal text-text-muted uppercase">
                        {req.productUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.urgency === 'URGENT'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : req.urgency === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-surface-muted text-text-muted border border-border'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          req.status === 'FULFILLED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text font-medium">{req.requestedByName}</div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(req.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => {
                              setSelectedWarehouseId(warehouses[0]?.id || '');
                              setFulfillingRequest(req);
                            }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'kh' ? 'បញ្ជូនចេញ' : 'Fulfill'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => rejectMutation.mutate(req.id)}
                            isLoading={rejectMutation.isPending}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : req.status === 'FULFILLED' ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatched</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-muted italic">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Room Request Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={language === 'kh' ? 'ស្នើសុំសម្ភារសម្រាប់បន្ទប់ព្យាបាល' : 'Request Operatory Supplies'}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-[6px] text-xs text-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField label={language === 'kh' ? 'បន្ទប់ព្យាបាល / ផ្នែក' : 'Treatment Room / Department'} required>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {PRESET_ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="OTHER">Other / Custom Room...</option>
            </select>
          </FormField>

          {room === 'OTHER' && (
            <FormField label="Specify Custom Room Name" required>
              <Input
                placeholder="e.g. VIP Suite 3"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                required
              />
            </FormField>
          )}

          <FormField label={language === 'kh' ? 'សម្ភារដែលត្រូវស្នើសុំ' : 'Product / Supply Item'} required>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.unit}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={language === 'kh' ? 'ចំនួនស្នើសុំ' : 'Requested Quantity'} required>
              <Input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </FormField>

            <FormField label={language === 'kh' ? 'កម្រិតបន្ទាន់' : 'Urgency Level'} required>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">🚨 Immediate Urgent</option>
              </select>
            </FormField>
          </div>

          <FormField label={language === 'kh' ? 'កំណត់ចំណាំបន្ថែម (ស្រេចចិត្ត)' : 'Clinical Notes / Reason'}>
            <textarea
              placeholder="e.g. Needed for 2:30 PM root canal treatment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </FormField>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} loadingText="Submitting...">
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'kh' ? 'ដាក់ស្នើសំណើ' : 'Submit Request'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fulfill & Dispatch Modal */}
      {fulfillingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setFulfillingRequest(null)}
          title={language === 'kh' ? 'បញ្ជាក់ការបញ្ជូនសម្ភារ' : 'Fulfill & Dispatch Stock'}
        >
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              {language === 'kh'
                ? `អ្នករៀបចំបញ្ជូនសម្ភារ ${fulfillingRequest.quantity} ${fulfillingRequest.productUnit} នៃ "${fulfillingRequest.productName}" ទៅកាន់ "${fulfillingRequest.room}"។`
                : `You are dispatching ${fulfillingRequest.quantity} ${fulfillingRequest.productUnit} of "${fulfillingRequest.productName}" to "${fulfillingRequest.room}".`}
            </p>

            <FormField label={language === 'kh' ? 'ដកចេញពីឃ្លាំងណា?' : 'Dispatch from Warehouse'} required>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </FormField>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setFulfillingRequest(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  fulfillMutation.mutate({
                    id: fulfillingRequest.id,
                    warehouseId: selectedWarehouseId || warehouses[0]?.id,
                  })
                }
                isLoading={fulfillMutation.isPending}
                loadingText="Fulfilling..."
              >
                <Check className="w-4 h-4" />
                <span>{language === 'kh' ? 'បញ្ជាក់ការបញ្ជូន' : 'Confirm Dispatch'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

