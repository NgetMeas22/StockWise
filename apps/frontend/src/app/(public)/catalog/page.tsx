'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { useTranslation } from '../../../i18n/i18n-context';
import { PublicCategoryDTO, PublicProductDTO } from '@stockwise/shared';
import { Search, Filter, Box, ArrowRight, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const sortParam = searchParams.get('sort') || 'name:asc';
  const pageParam = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(qParam);

  const { data: categoriesData } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => apiRequest<PublicCategoryDTO[]>('/public/categories'),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => apiRequest<string[]>('/public/brands'),
  });

  const queryString = new URLSearchParams({
    page: String(pageParam),
    pageSize: '16',
    ...(qParam ? { q: qParam } : {}),
    ...(categoryParam ? { categorySlug: categoryParam } : {}),
    ...(brandParam ? { brand: brandParam } : {}),
    ...(sortParam ? { sort: sortParam } : {}),
  }).toString();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['public-products', queryString],
    queryFn: () => apiRequest<PublicProductDTO[]>(`/public/products?${queryString}`),
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const products = productsData?.data || [];
  const meta = productsData?.meta || { page: 1, total: 0, totalPages: 1 };

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(newParams)) {
      if (val === null) params.delete(key);
      else params.set(key, val);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`/catalog?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim() ? searchInput.trim() : null });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-medium text-text">{t('catalog.browseTitle')}</span>
        {categoryParam && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-accent font-semibold">{categoryParam}</span>
          </>
        )}
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('catalog.browseTitle')}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {t('catalog.showingProducts')} {meta.total} {t('catalog.productsCount')} {qParam ? `${t('catalog.matching')} "${qParam}"` : ''}
          </p>
        </div>

        {/* Sort & Search Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('catalog.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-[6px] border border-border bg-surface text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent w-48 sm:w-64"
            />
          </form>

          <select
            value={sortParam}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="px-3 py-1.5 rounded-[6px] border border-border bg-surface text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="name:asc">{t('catalog.sortNameAsc')}</option>
            <option value="name:desc">{t('catalog.sortNameDesc')}</option>
            <option value="price:asc">{t('catalog.sortPriceAsc')}</option>
            <option value="price:desc">{t('catalog.sortPriceDesc')}</option>
            <option value="newest">{t('catalog.sortNewest')}</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Left Filter Panel */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-5 rounded-[8px] border border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-accent" /> {t('catalog.filters')}
              </span>
              {(categoryParam || brandParam || qParam) && (
                <button
                  onClick={() => router.push('/catalog')}
                  className="text-xs text-danger hover:underline font-medium"
                >
                  {t('catalog.clearAll')}
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">{t('catalog.categories')}</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateFilters({ category: null })}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-[4px] transition-colors ${
                    !categoryParam
                      ? 'bg-accent-soft text-accent font-semibold'
                      : 'text-text-muted hover:bg-surface-muted hover:text-text'
                  }`}
                >
                  {t('catalog.allCategories')}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateFilters({ category: c.slug })}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-[4px] transition-colors flex items-center justify-between ${
                      categoryParam === c.slug
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-muted hover:bg-surface-muted hover:text-text'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] text-text-muted">{c.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text uppercase tracking-wider">{t('catalog.brands')}</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilters({ brand: null })}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-[4px] transition-colors ${
                      !brandParam
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-muted hover:bg-surface-muted hover:text-text'
                    }`}
                  >
                    {t('catalog.allBrands')}
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => updateFilters({ brand: b })}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-[4px] transition-colors ${
                        brandParam === b
                          ? 'bg-accent-soft text-accent font-semibold'
                          : 'text-text-muted hover:bg-surface-muted hover:text-text'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface border border-border rounded-[8px] h-64"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-[8px]">
              <Box className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <h3 className="text-base font-semibold text-text">{t('catalog.noProducts')}</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                {t('catalog.noProductsDesc')}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push('/catalog')}
              >
                {t('catalog.resetFilters')}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <Link
                    key={prod.slug}
                    href={`/p/${prod.slug}`}
                    className="group bg-surface rounded-[8px] border border-border hover:border-accent hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    {/* 4:3 Image Area */}
                    <div className="relative aspect-[4/3] bg-surface-muted/60 flex items-center justify-center p-3 border-b border-border group-hover:bg-accent-soft/10 transition-colors overflow-hidden">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`flex-col items-center justify-center text-text-muted/60 group-hover:text-accent transition-colors ${
                          prod.imageUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        <Box className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-text-muted/70">
                          {prod.brand || 'Dental Systems'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {prod.brand && (
                          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                            {prod.brand}
                          </div>
                        )}
                        <h3 className="text-sm font-semibold text-text line-clamp-2 group-hover:text-accent transition-colors leading-snug">
                          {prod.name}
                        </h3>
                        <div className="text-[11px] text-text-muted mt-1">
                          {t('catalog.itemCode')}: <span className="text-text font-medium">{prod.sku}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        {prod.price ? (
                          <div className="text-base font-bold tabular-nums text-text">
                            ${prod.price}
                          </div>
                        ) : (
                          <div className="text-xs text-text-muted">{t('catalog.inquirePricing')}</div>
                        )}

                        {prod.availability && (
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                              prod.availability === 'IN_STOCK'
                                ? 'bg-emerald-500/10 text-ok border-emerald-500/30'
                                : 'bg-rose-500/10 text-danger border-rose-500/30'
                            }`}
                          >
                            {prod.availability === 'IN_STOCK' ? t('catalog.available') : t('catalog.outOfStock')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Bar */}
              {meta.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-between border-t border-border pt-4">
                  <div className="text-xs text-text-muted">
                    {t('common.page')} {meta.page} {t('common.of')} {meta.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => updateFilters({ page: String(meta.page - 1) })}
                    >
                      {t('common.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => updateFilters({ page: String(meta.page + 1) })}
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-text-muted">Loading catalog...</div>}>
      <CatalogContent />
    </React.Suspense>
  );
}
