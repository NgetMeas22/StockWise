'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { PublicCategoryDTO, PublicProductDTO } from '@stockwise/shared';
import { Search, Filter, Box, ArrowRight, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        <span className="font-medium text-text">Browse Catalog</span>
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Browse Supplies Catalog</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Showing {meta.total} products {qParam ? `matching "${qParam}"` : ''}
          </p>
        </div>

        {/* Sort & Search Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in catalog..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-[6px] border border-border bg-white text-xs text-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent w-48 sm:w-64"
            />
          </form>

          <select
            value={sortParam}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="px-3 py-1.5 rounded-[6px] border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="name:asc">Name: A to Z</option>
            <option value="name:desc">Name: Z to A</option>
            <option value="price:asc">Price: Low to High</option>
            <option value="price:desc">Price: High to Low</option>
            <option value="newest">Newest Additions</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Left Filter Panel */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-5 rounded-[8px] border border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </span>
              {(categoryParam || brandParam || qParam) && (
                <button
                  onClick={() => router.push('/catalog')}
                  className="text-xs text-danger hover:underline font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Categories</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateFilters({ category: null })}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-[4px] transition-colors ${
                    !categoryParam
                      ? 'bg-accent-soft text-accent font-semibold'
                      : 'text-text-muted hover:bg-surface-muted hover:text-text'
                  }`}
                >
                  All Categories
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
                    <span className="text-[10px] text-slate-400">{c.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Brands</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilters({ brand: null })}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-[4px] transition-colors ${
                      !brandParam
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-muted hover:bg-surface-muted hover:text-text'
                    }`}
                  >
                    All Brands
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
            <div className="text-center py-16 bg-white border border-dashed border-border rounded-[8px]">
              <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-text">No products match your criteria</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Try modifying your category selection, removing brand filters, or searching with broader keywords.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push('/catalog')}
              >
                Reset Filters
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
                    <div className="aspect-[4/3] bg-surface-muted flex items-center justify-center p-4 border-b border-border group-hover:bg-teal-50/20 transition-colors">
                      <Box className="w-12 h-12 text-slate-300 group-hover:text-accent/60 transition-colors" />
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
                          SKU: <span className="font-mono text-slate-600">{prod.sku}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        {prod.price ? (
                          <div className="text-base font-bold font-mono text-text">
                            ${prod.price}
                          </div>
                        ) : (
                          <div className="text-xs text-text-muted">Inquire for pricing</div>
                        )}

                        {prod.availability && (
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              prod.availability === 'IN_STOCK'
                                ? 'bg-emerald-50 text-ok border border-emerald-200'
                                : 'bg-red-50 text-danger border border-red-200'
                            }`}
                          >
                            {prod.availability === 'IN_STOCK' ? 'Available' : 'Out of Stock'}
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
                    Page {meta.page} of {meta.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => updateFilters({ page: String(meta.page - 1) })}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => updateFilters({ page: String(meta.page + 1) })}
                    >
                      Next
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
