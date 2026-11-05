'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../../lib/api-client';
import { useTranslation } from '../../../../i18n/i18n-context';
import { PublicProductDTO } from '@stockwise/shared';
import { ChevronRight, Box, CheckCircle2, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

export default function PublicProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-product', slug],
    queryFn: () => apiRequest<PublicProductDTO>(`/public/products/${slug}`),
    enabled: Boolean(slug),
  });

  const product = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="h-4 w-48 bg-surface-muted rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[4/3] bg-surface-muted rounded-[8px]"></div>
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-surface-muted rounded"></div>
            <div className="h-4 w-1/4 bg-surface-muted rounded"></div>
            <div className="h-24 bg-surface-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Box className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text">{t('catalog.productNotFound')}</h2>
        <p className="text-xs text-text-muted mt-2 mb-6">
          {t('catalog.productNotFoundDesc')}
        </p>
        <Link href="/catalog">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('catalog.backToCatalog')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-8">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/catalog" className="hover:text-accent transition-colors">Catalog</Link>
        {product.category?.breadcrumb?.map((b) => (
          <React.Fragment key={b.slug}>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/catalog?category=${b.slug}`} className="hover:text-accent transition-colors">
              {b.name}
            </Link>
          </React.Fragment>
        ))}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-text truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-surface p-8 rounded-[8px] border border-border shadow-sm">
        {/* Media / Image Display */}
        <div className="aspect-[4/3] bg-surface-muted rounded-[8px] border border-border flex items-center justify-center p-8">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-text-muted">
              <Box className="w-20 h-20 mb-2 stroke-[1.5]" />
              <span className="text-xs font-medium">Product Image Placeholder</span>
            </div>
          )}
        </div>

        {/* Product Attributes & Description */}
        <div className="flex flex-col justify-between">
          <div>
            {product.brand && (
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
                {product.brand}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text leading-tight">
              {product.name}
            </h1>

            {product.sku && (
              <div className="mt-2 text-xs text-text-muted">
                {t('catalog.itemCode')}: <span className="text-text font-semibold">{product.sku}</span>
              </div>
            )}

            {/* Price & Availability Banner */}
            <div className="mt-6 p-4 rounded-[6px] bg-surface-muted border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-text-muted block">{t('catalog.referencePrice')}</span>
                {product.price ? (
                  <span className="text-2xl font-bold tabular-nums text-text">
                    ${product.price} {product.currency || 'USD'}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-text-muted">{t('catalog.inquirePricing')}</span>
                )}
              </div>

              {product.availability && (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    product.availability === 'IN_STOCK'
                      ? 'bg-emerald-500/10 text-ok border-emerald-500/30'
                      : 'bg-rose-500/10 text-danger border-rose-500/30'
                  }`}
                >
                  {product.availability === 'IN_STOCK' ? t('catalog.available') : t('catalog.outOfStock')}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-2">{t('catalog.overview')}</h3>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description provided for this catalog product.'}
              </p>
            </div>
          </div>

          {/* Institutional Procurement Assurance */}
          <div className="mt-8 pt-6 border-t border-border flex items-center gap-4 text-xs text-text-muted">
            <Shield className="w-5 h-5 text-accent shrink-0" />
            <span>Verified Medical-Grade Supply Chain & ISO 13485 Compliant Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
