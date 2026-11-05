'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { AuditLogDTO } from '@stockwise/shared';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { TableSkeleton } from '../../../../components/ui/TableSkeleton';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { useTranslation } from '../../../../i18n/i18n-context';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log for JSON Drawer/Modal
  const [inspectLog, setInspectLog] = useState<AuditLogDTO | null>(null);

  // Query audit logs
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(entityTypeFilter ? { entityType: entityTypeFilter } : {}),
    ...(dateFrom ? { from: dateFrom } : {}),
    ...(dateTo ? { to: dateTo } : {}),
  }).toString();

  const { data: auditRes, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs-list', queryParams],
    queryFn: () => apiRequest<AuditLogDTO[]>(`/audit?${queryParams}`),
  });

  const logs = auditRes?.data || [];
  const meta = auditRes?.meta || { total: 0, page: 1, pageSize: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.auditLogsTitle')}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {t('admin.immutable')}
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            {t('admin.auditLogsSubtitle')}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-[8px] border border-border p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              placeholder="Filter by Action code..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <select
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Entity Types</option>
              <option value="USER">USER</option>
              <option value="ROLE">ROLE</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="CATEGORY">CATEGORY</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
              <option value="SUPPLIER">SUPPLIER</option>
              <option value="INVENTORY">INVENTORY</option>
              <option value="PURCHASE_ORDER">PURCHASE_ORDER</option>
              <option value="SETTING">SETTING</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
          <div>
            {(actionFilter || entityTypeFilter || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setActionFilter('');
                  setEntityTypeFilter('');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="text-accent hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />}
            <span>{meta.total} audit records total</span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('common.noData')}
            description="Audit events are automatically recorded upon every system action."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Seq #</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">{t('admin.targetEntity')}</th>
                  <th className="px-4 py-3">{t('admin.actorIdentity')}</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                      #{log.seq}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-text whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      <span className="text-text-muted">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-text">{log.entityType}</span>
                      <span className="block font-mono text-[10px] text-text-muted truncate max-w-[140px]" title={log.entityId || ''}>
                        {log.entityId}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{log.actorName || 'System'}</div>
                      <div className="font-mono text-[10px] text-text-muted truncate max-w-[140px]">
                        {log.actorUserId || 'Internal System'}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                      {log.ip || '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        title="View JSON State"
                        className="p-1.5 text-text-muted hover:text-accent rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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

      {/* JSON Inspector Modal */}
      <Modal
        isOpen={!!inspectLog}
        onClose={() => setInspectLog(null)}
        title={`Audit Event #${inspectLog?.seq}: ${inspectLog?.action}`}
        maxWidth="xl"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setInspectLog(null)}>
              {t('actions.close')}
            </Button>
          </div>
        }
      >
        {inspectLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-[6px] bg-slate-50 dark:bg-slate-800/50 border border-border">
              <div>
                <span className="text-text-muted block">Timestamp</span>
                <span className="text-text font-medium">{new Date(inspectLog.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-text-muted block">{t('admin.actorIdentity')}</span>
                <span className="text-text font-medium">{inspectLog.actorName || 'System'}</span>
                {inspectLog.actorUserId && (
                  <span className="text-text-muted block font-mono text-[10px]">({inspectLog.actorUserId})</span>
                )}
              </div>
              <div>
                <span className="text-text-muted block">{t('admin.targetEntity')}</span>
                <span className="font-mono text-text">{inspectLog.entityType} : {inspectLog.entityId}</span>
              </div>
              <div>
                <span className="text-text-muted block">Network Context</span>
                <span className="font-mono text-text">{inspectLog.ip || 'Localhost'}</span>
              </div>
            </div>

            {/* Before vs After States */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  {t('admin.beforeState')}
                </label>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-[6px] font-mono text-[11px] overflow-auto max-h-72 border border-slate-800">
                  {inspectLog.before ? JSON.stringify(inspectLog.before, null, 2) : 'null (Created or no prior state)'}
                </pre>
              </div>

              <div>
                <label className="text-xs font-semibold text-text block mb-1">
                  {t('admin.afterState')}
                </label>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-[6px] font-mono text-[11px] overflow-auto max-h-72 border border-slate-800">
                  {inspectLog.after ? JSON.stringify(inspectLog.after, null, 2) : 'null (Deleted)'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
