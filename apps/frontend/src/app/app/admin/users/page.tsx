'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { UserDTO, RoleKey } from '@stockwise/shared';
import { Can } from '../../../../components/auth/Can';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { TableSkeleton } from '../../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { useToast } from '../../../../lib/toast-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import {
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  CheckCircle,
  XCircle,
  LogOut,
  Copy,
  Check,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<RoleKey>('INVENTORY_STAFF');
  const [createError, setCreateError] = useState<string | null>(null);

  // Temporary Password Reveal Modal
  const [revealedPassword, setRevealedPassword] = useState<{
    userName: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<RoleKey>('VIEWER');
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmations
  const [toggleTarget, setToggleTarget] = useState<UserDTO | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDTO | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<UserDTO | null>(null);

  // Query users
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
  }).toString();

  const { data: usersRes, isLoading, isFetching } = useQuery({
    queryKey: ['users-admin-list', queryParams],
    queryFn: () => apiRequest<UserDTO[]>(`/users?${queryParams}`),
  });

  const users = usersRes?.data || [];
  const meta = usersRes?.meta || { total: 0, page: 1, pageSize: 15, totalPages: 1 };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest<any>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users-admin-list'] });
      setShowCreateModal(false);
      toast.success(t('toasts.userCreated'));
      if (res?.data?.temporaryPassword) {
        setRevealedPassword({
          userName: res.data.fullName,
          email: res.data.email,
          password: res.data.temporaryPassword,
        });
      }
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to create user.';
      setCreateError(msg);
      toast.error(msg);
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return apiRequest(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin-list'] });
      setEditingUser(null);
      toast.success(t('toasts.userUpdated'));
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to update user.';
      setEditError(msg);
      toast.error(msg);
    },
  });

  // Activate / Deactivate
  const toggleMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      const endpoint = activate ? `/users/${id}/activate` : `/users/${id}/deactivate`;
      return apiRequest(endpoint, { method: 'POST' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users-admin-list'] });
      setToggleTarget(null);
      toast.success(variables.activate ? t('toasts.userActivated') : t('toasts.userDeactivated'));
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to change user status.');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<any>(`/users/${id}/reset-password`, { method: 'POST' });
    },
    onSuccess: (res) => {
      if (resetTarget && res?.data?.temporaryPassword) {
        setRevealedPassword({
          userName: resetTarget.fullName,
          email: resetTarget.email,
          password: res.data.temporaryPassword,
        });
        toast.success(t('admin.tempPasswordTitle'));
      }
      setResetTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reset password.');
    },
  });

  // Revoke Sessions
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/users/${id}/revoke-sessions`, { method: 'POST' });
    },
    onSuccess: () => {
      setRevokeTarget(null);
      toast.success(t('toasts.sessionsRevoked'));
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to revoke sessions.');
    },
  });

  const handleCopyPassword = () => {
    if (!revealedPassword) return;
    navigator.clipboard.writeText(revealedPassword.password);
    setCopied(true);
    toast.info('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role: RoleKey) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">ADMIN</Badge>;
      case 'MANAGER':
        return <Badge variant="warning">MANAGER</Badge>;
      case 'INVENTORY_STAFF':
        return <Badge variant="info">INVENTORY_STAFF</Badge>;
      case 'VIEWER':
      default:
        return <Badge variant="neutral">VIEWER</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.usersTitle')}</h1>
          <p className="text-sm text-text-muted mt-1">
            {t('admin.usersSubtitle')}
          </p>
        </div>

        <Can permission="users:manage">
          <Button
            onClick={() => {
              setCreateName('');
              setCreateEmail('');
              setCreateRole('INVENTORY_STAFF');
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('admin.addUser')}</span>
          </Button>
        </Can>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder={`${t('common.search')} user name or email...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t('common.all')} Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="INVENTORY_STAFF">INVENTORY_STAFF</option>
            <option value="VIEWER">VIEWER</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t('common.all')} Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive / Locked</option>
          </select>
        </div>

        <div className="flex items-center text-xs text-text-muted">
          {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-accent" />}
          <span>{meta.total} users</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('common.noData')}
            description="Adjust your search filters or create a new user account."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">{t('admin.fullName')} & {t('admin.email')}</th>
                  <th className="px-4 py-3">{t('admin.assignedRole')}</th>
                  <th className="px-4 py-3 text-center">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('admin.lastLogin')}</th>
                  <th className="px-4 py-3">{t('admin.created')}</th>
                  <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{u.fullName}</div>
                      <div className="text-[11px] font-mono text-text-muted">{u.email}</div>
                    </td>

                    <td className="px-4 py-3">
                      {getRoleBadge(u.roleKey)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {u.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                      {u.mustChangePassword && (
                        <span className="block mt-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          Temp Password
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-text-muted">
                      {u.lastLoginAt ? (
                        new Date(u.lastLoginAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Can permission="users:manage">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditName(u.fullName);
                              setEditRole(u.roleKey);
                              setEditError(null);
                            }}
                            title={t('admin.editUser')}
                            className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setResetTarget(u)}
                            title={t('admin.resetPassword')}
                            className="p-1.5 text-text-muted hover:text-amber-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setRevokeTarget(u)}
                            title={t('admin.revokeSessions')}
                            className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setToggleTarget(u)}
                            title={u.isActive ? t('admin.deactivateUser') : t('admin.activateUser')}
                            className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {u.isActive ? (
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('admin.addUser')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                setCreateError(null);
                if (!createName.trim()) {
                  setCreateError('Full name is required');
                  return;
                }
                if (!createEmail.trim()) {
                  setCreateError('Email is required');
                  return;
                }
                createMutation.mutate({
                  fullName: createName.trim(),
                  email: createEmail.trim(),
                  roleKey: createRole,
                });
              }}
              isLoading={createMutation.isPending}
              loadingText="Creating..."
            >
              {t('admin.addUser')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <FormField label={t('admin.fullName')} required>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </FormField>

          <FormField label={t('admin.email')} required>
            <Input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="e.g. jdoe@stockwise.local"
              required
            />
          </FormField>

          <FormField label={t('admin.assignedRole')} required>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as RoleKey)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="VIEWER">VIEWER (Read-only catalog & reports)</option>
              <option value="INVENTORY_STAFF">INVENTORY_STAFF (Manage stock movements & scans)</option>
              <option value="MANAGER">MANAGER (Manage products, inventory, & purchasing)</option>
              <option value="ADMIN">ADMIN (Full unrestricted system control)</option>
            </select>
          </FormField>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-[6px] text-xs text-text-muted space-y-1">
            <span className="font-semibold text-text block">Temporary Password Security:</span>
            <p>
              A high-entropy 16-character temporary password will be cryptographically generated. The user will be required to change it on their first login.
            </p>
          </div>
        </div>
      </Modal>

      {/* Temporary Password Reveal Modal */}
      <Modal
        isOpen={!!revealedPassword}
        onClose={() => setRevealedPassword(null)}
        title={t('admin.tempPasswordTitle')}
        maxWidth="md"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setRevealedPassword(null)}>{t('actions.close')}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-[6px]">
            Credentials generated for <strong>{revealedPassword?.userName}</strong> ({revealedPassword?.email}).
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text block">
              One-Time Temporary Password
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={revealedPassword?.password || ''}
                className="w-full px-3 py-2 font-mono text-sm font-bold bg-slate-100 dark:bg-slate-800 rounded-[6px] border border-border text-accent select-all"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPassword}
                className="flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              {t('admin.tempPasswordHint')}
            </p>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`${t('admin.editUser')}: ${editingUser?.fullName}`}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                if (!editingUser) return;
                editMutation.mutate({
                  id: editingUser.id,
                  payload: { fullName: editName, roleKey: editRole },
                });
              }}
              isLoading={editMutation.isPending}
              loadingText="Saving..."
            >
              {t('actions.save')} Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <FormField label={t('admin.fullName')} required>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </FormField>

          <FormField label={t('admin.assignedRole')} required>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as RoleKey)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="VIEWER">VIEWER</option>
              <option value="INVENTORY_STAFF">INVENTORY_STAFF</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={() => {
          if (resetTarget) resetPasswordMutation.mutate(resetTarget.id);
        }}
        title={t('admin.resetPassword')}
        message={`Reset password for "${resetTarget?.fullName}" (${resetTarget?.email})? Active sessions will be terminated and a temporary password will be generated.`}
        confirmLabel="Generate New Password"
        variant="warning"
        isLoading={resetPasswordMutation.isPending}
      />

      {/* Revoke Sessions Modal */}
      <ConfirmModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) revokeMutation.mutate(revokeTarget.id);
        }}
        title={t('admin.revokeSessions')}
        message={`Revoke all active browser sessions for "${revokeTarget?.fullName}"? They will be signed out immediately.`}
        confirmLabel={t('admin.revokeSessions')}
        variant="danger"
        isLoading={revokeMutation.isPending}
      />

      {/* Toggle Status Modal */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate({ id: toggleTarget.id, activate: !toggleTarget.isActive });
          }
        }}
        title={toggleTarget?.isActive ? t('admin.deactivateUser') : t('admin.activateUser')}
        message={`Are you sure you want to ${toggleTarget?.isActive ? 'deactivate' : 'activate'} "${toggleTarget?.fullName}"?`}
        confirmLabel={toggleTarget?.isActive ? t('admin.deactivateUser') : t('admin.activateUser')}
        variant={toggleTarget?.isActive ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}
