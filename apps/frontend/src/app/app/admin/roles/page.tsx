'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { PermissionKey, RoleKey } from '@stockwise/shared';
import { Can } from '../../../../components/auth/Can';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { TableSkeleton } from '../../../../components/ui/TableSkeleton';
import { useToast } from '../../../../lib/toast-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import {
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface RoleWithPermissions {
  id: string;
  key: RoleKey;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionKey[];
}

interface PermissionItem {
  key: PermissionKey;
  description: string;
  module: string;
}

export default function RolesMatrixPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const [rolePermissionsState, setRolePermissionsState] = useState<Record<string, Set<PermissionKey>>>({});
  const [dirtyRoles, setDirtyRoles] = useState<Set<string>>(new Set());

  // Fetch Roles
  const { data: rolesRes, isLoading: isRolesLoading } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => apiRequest<RoleWithPermissions[]>('/roles'),
  });
  const roles = rolesRes?.data || [];

  // Fetch Permissions
  const { data: permissionsRes, isLoading: isPermsLoading } = useQuery({
    queryKey: ['permissions-list'],
    queryFn: () => apiRequest<PermissionItem[]>('/permissions'),
  });
  const permissions = permissionsRes?.data || [];

  // Initialize local state when roles load
  useEffect(() => {
    if (roles.length > 0) {
      const initial: Record<string, Set<PermissionKey>> = {};
      roles.forEach((r) => {
        initial[r.key] = new Set(r.permissions);
      });
      setRolePermissionsState(initial);
      setDirtyRoles(new Set());
    }
  }, [rolesRes]);

  // Mutation to save a role's permissions
  const saveRoleMutation = useMutation({
    mutationFn: async ({ roleId, perms }: { roleId: string; perms: PermissionKey[] }) => {
      return apiRequest(`/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: perms }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      toast.success('Permissions successfully updated and synchronized across all active sessions.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update role permissions.');
    },
  });

  const togglePermission = (roleKey: RoleKey, permKey: PermissionKey) => {
    if (roleKey === 'ADMIN') return; // Immutable by architecture

    setRolePermissionsState((prev) => {
      const current = new Set(prev[roleKey] || []);
      if (current.has(permKey)) {
        current.delete(permKey);
      } else {
        current.add(permKey);
      }
      return {
        ...prev,
        [roleKey]: current,
      };
    });

    setDirtyRoles((prev) => new Set(prev).add(roleKey));
  };

  const handleSaveRole = (r: RoleWithPermissions) => {
    const currentSet = rolePermissionsState[r.key] || new Set();
    saveRoleMutation.mutate({
      roleId: r.id,
      perms: Array.from(currentSet),
    });
  };

  // Group permissions by category prefix
  const groupedPermissions: Record<string, PermissionItem[]> = {};
  permissions.forEach((p) => {
    const group = p.key.split(':')[0].toUpperCase();
    if (!groupedPermissions[group]) groupedPermissions[group] = [];
    groupedPermissions[group].push(p);
  });

  const isLoading = isRolesLoading || isPermsLoading;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.rolesTitle')}</h1>
          <p className="text-sm text-text-muted mt-1">
            {t('admin.rolesSubtitle')}
          </p>
        </div>
      </div>

      {/* Info / Alert banner */}
      <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-slate-800/50 border border-border flex items-start gap-3 text-xs text-text-muted">
        <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text font-semibold">Security Enforcement Rule P-1:</strong> The{' '}
          <Badge variant="danger">ADMIN</Badge> role permissions are cryptographically locked and
          cannot be revoked or altered to guarantee system recovery and business continuity.
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={12} columns={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-100 dark:bg-slate-800 text-text font-bold text-xs">
                  <th className="px-4 py-3 min-w-[280px]">Permission Name & Code</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-4 py-3 text-center min-w-[140px]">
                      <div className="font-semibold text-text">{r.name}</div>
                      <div className="text-[10px] font-mono text-text-muted mt-0.5">{r.key}</div>
                      {r.key !== 'ADMIN' && dirtyRoles.has(r.key) && (
                        <div className="mt-2">
                          <Can permission="roles:manage">
                            <Button
                              size="sm"
                              onClick={() => handleSaveRole(r)}
                              isLoading={saveRoleMutation.isPending}
                              loadingText="Saving..."
                              className="h-6 text-[11px] px-2"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          </Can>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <React.Fragment key={group}>
                    {/* Domain Category Header */}
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold text-[11px] text-text-muted uppercase tracking-wider">
                      <td colSpan={1 + roles.length} className="px-4 py-2 border-y border-border">
                        {group} Operations
                      </td>
                    </tr>

                    {/* Permissions in Domain */}
                    {perms.map((p) => (
                      <tr key={p.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-text">{p.description}</div>
                          <div className="font-mono text-[11px] text-text-muted mt-0.5">{p.key}</div>
                        </td>

                        {roles.map((r) => {
                          const isChecked =
                            r.key === 'ADMIN' ||
                            rolePermissionsState[r.key]?.has(p.key) ||
                            false;
                          const isLocked = r.key === 'ADMIN';

                          return (
                            <td key={r.id} className="px-4 py-3 text-center">
                              {isLocked ? (
                                <div className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(r.key, p.key)}
                                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
