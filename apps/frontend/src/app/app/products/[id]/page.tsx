'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { ProductDTO, StockMovementDTO } from '@stockwise/shared';
import { useAuth } from '../../../../lib/auth-context';
import { useTranslation } from '../../../../i18n/i18n-context';
import { Can } from '../../../../components/auth/Can';
import { Button } from '../../../../components/ui/Button';
import { StockBadge } from '../../../../components/ui/StockBadge';
import { Badge } from '../../../../components/ui/Badge';
import { StatCard } from '../../../../components/ui/StatCard';
import {
  ArrowLeft,
  Edit2,
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  History,
  Building2,
  Clock,
  Barcode,
  Tag,
  AlertCircle,
} from 'lucide-react';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const canViewCost = hasPermission('products:view_cost');

  const { data: productRes, isLoading, error } = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => apiRequest<ProductDTO>(`/products/${productId}`),
  });

  const { data: movementsRes } = useQuery({
    queryKey: ['product-movements', productId],
    queryFn: () => apiRequest<StockMovementDTO[]>(`/inventory/movements?productId=${productId}&pageSize=10`),
    enabled: !!productId,
  });

  const product = productRes?.data;
  const movements = movementsRes?.data || [];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-text-muted">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-surface-muted rounded w-1/3"></div>
          <div className="h-64 bg-surface-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-xl font-bold text-text">Product not found</h2>
        <p className="text-sm text-text-muted">
          The requested product does not exist or you may not have permission to view it.
        </p>
        <Link href="/app/products">
          <Button variant="outline">{t('common.back')} to {t('nav.products')}</Button>
        </Link>
      </div>
    );
  }

  const qty = Number(product.totalQuantityOnHand || 0);
  const reorder = Number(product.reorderLevel || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/products"
            className="p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text">{product.name}</h1>
              <StockBadge quantity={qty} reorderLevel={reorder} />
              {product.status === 'ARCHIVED' && <Badge variant="neutral">{t('common.archived')}</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
              <span className="font-mono font-medium text-text">{product.sku}</span>
              <span>•</span>
              <span>{product.categoryName}</span>
              {product.brand && (
                <>
                  <span>•</span>
                  <span>{product.brand}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Can permission="products:update">
            <Link href={`/app/products/${product.id}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t('products.editProduct')}</span>
              </Button>
            </Link>
          </Can>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('products.stockOnHand')}
          value={`${qty} ${product.unit}`}
          subtext={`Reorder alert at ≤ ${reorder} ${product.unit}`}
          icon={Layers}
        />
        <StatCard
          label={t('products.sellingPrice')}
          value={`$${Number(product.sellingPrice).toFixed(2)}`}
          subtext="Per standard unit"
          icon={DollarSign}
        />
        {canViewCost ? (
          <StatCard
            label="Weighted Average Cost"
            value={product.averageCost ? `$${Number(product.averageCost).toFixed(2)}` : '—'}
            subtext={`Baseline cost: $${Number(product.costPrice || 0).toFixed(2)}`}
            icon={TrendingUp}
          />
        ) : (
          <StatCard
            label="Cost Masked"
            value="Confidential"
            subtext="Requires products:view_cost"
            icon={TrendingUp}
          />
        )}
        <StatCard
          label="Catalog Status"
          value={product.isPublished ? t('common.published') : 'Hidden'}
          subtext={product.isPublished ? 'Visible in buyer portal' : 'Internal only'}
          icon={Tag}
        />
      </div>

      {/* Main Grid: Details + Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Info & Warehouse Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Warehouse Breakdown */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                <h2 className="text-base font-semibold text-text">{t('products.stockDistribution')}</h2>
              </div>
              <span className="text-xs text-text-muted">
                {product.balances?.length || 0} locations active
              </span>
            </div>

            <div className="divide-y divide-border">
              {product.balances && product.balances.length > 0 ? (
                product.balances.map((b: any) => (
                  <div key={b.warehouseId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text">{b.warehouseName}</div>
                      <div className="text-[11px] font-mono text-text-muted">
                        Code: {b.warehouseCode || b.warehouseId.slice(0, 8)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-mono font-bold text-text">
                        {b.quantityOnHand} {product.unit}
                      </div>
                      <span className="text-[10px] text-text-muted">{t('products.stockOnHand')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-muted">
                  No warehouse inventory recorded yet for this product.
                </div>
              )}
            </div>
          </div>

          {/* Recent Stock Movement History */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-accent" />
                <h2 className="text-base font-semibold text-text">{t('products.recentMovements')}</h2>
              </div>
              <Link href={`/app/inventory/movements?productId=${product.id}`}>
                <span className="text-xs text-accent hover:underline font-medium">
                  View full ledger →
                </span>
              </Link>
            </div>

            {movements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-muted uppercase text-[10px]">
                      <th className="py-2">{t('common.timestamp')}</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">{t('inventory.reasonCode')}</th>
                      <th className="py-2 text-right">Delta</th>
                      <th className="py-2 text-right">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {movements.map((m) => {
                      const deltaNum = Number(m.quantityDelta);
                      return (
                        <tr key={m.id} className="hover:bg-surface-muted/50 transition-colors">
                          <td className="py-2.5 font-mono text-[11px] text-text-muted">
                            {new Date(m.createdAt).toLocaleDateString()}{' '}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-muted text-text border border-border">
                              {m.movementType}
                            </span>
                          </td>
                          <td className="py-2.5 text-text-muted truncate max-w-[140px]" title={m.reason}>
                            {m.reasonCode}
                          </td>
                          <td className={`py-2.5 text-right font-mono font-semibold ${
                            deltaNum > 0 ? 'text-ok' : 'text-danger'
                          }`}>
                            {deltaNum > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                          </td>
                          <td className="py-2.5 text-right font-mono text-text">
                            {m.quantityAfter}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-text-muted">
                No movements recorded for this product yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Product Metadata & Specs */}
        <div className="space-y-6">
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-semibold text-text border-b border-border pb-2">
              {t('products.overview')}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-muted block">{t('categories.description')}</span>
                <p className="text-text mt-1 leading-relaxed">
                  {product.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block">{t('products.sku')}</span>
                <span className="font-mono font-semibold text-text">{product.sku}</span>
              </div>

              {product.barcode && (
                <div className="pt-2 border-t border-border">
                  <span className="text-text-muted block">{t('products.barcode')}</span>
                  <span className="font-mono text-text">{product.barcode}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block">{t('products.urlSlug')}</span>
                <span className="font-mono text-text">{product.slug}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block">{t('products.category')}</span>
                <span className="text-text font-medium">{product.categoryName}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block">Version</span>
                <span className="font-mono text-text">v{product.version}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block">Created At</span>
                <span className="text-text">
                  {new Date(product.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
