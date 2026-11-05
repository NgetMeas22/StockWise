'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api-client';
import { useTranslation } from '../../i18n/i18n-context';
import { PublicCategoryDTO, PublicProductDTO } from '@stockwise/shared';
import { Search, ArrowRight, Layers, CheckCircle2, Shield, Box, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => apiRequest<PublicCategoryDTO[]>('/public/categories'),
  });

  const { data: productsData } = useQuery({
    queryKey: ['public-featured-products'],
    queryFn: () => apiRequest<PublicProductDTO[]>('/public/products?pageSize=8'),
  });

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalog');
    }
  };

  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-accent-soft/30 to-transparent border-b border-border py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            {t('catalog.heroBadge')}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text leading-tight sm:leading-tight">
            {t('catalog.heroTitle')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-text-muted max-w-2xl mx-auto">
            {t('catalog.heroSubtitle')}
          </p>

          {/* Catalog Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl mx-auto flex items-center shadow-md rounded-[8px] overflow-hidden border border-border">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('catalog.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors flex items-center gap-1.5"
            >
              <span>{t('catalog.searchBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted">
            <span className="font-medium text-text-muted">{t('catalog.popular')}:</span>
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/catalog?category=${c.slug}`}
                className="px-2.5 py-1 rounded-full bg-surface border border-border text-text hover:border-accent hover:text-accent hover:bg-surface-muted transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">{t('catalog.browseByCategory')}</h2>
            <p className="text-xs text-text-muted mt-0.5">{t('catalog.browseByCategorySubtitle')}</p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
          >
            {t('catalog.allCategories')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.slug}`}
              className="group p-5 bg-surface rounded-[8px] border border-border hover:border-accent hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-surface-muted text-accent flex items-center justify-center group-hover:bg-accent-soft transition-colors mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-text group-hover:text-accent transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted font-medium">
                <span>{cat.productCount} {t('catalog.productsCount')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">{t('catalog.featuredSupplies')}</h2>
            <p className="text-xs text-text-muted mt-0.5">{t('catalog.featuredSuppliesSubtitle')}</p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
          >
            {t('catalog.viewAllCatalog')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <Link
              key={prod.slug}
              href={`/p/${prod.slug}`}
              className="group bg-surface rounded-[8px] border border-border hover:border-accent hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              {/* Product 4:3 Image Area */}
              <div className="aspect-[4/3] bg-surface-muted flex items-center justify-center p-4 border-b border-border group-hover:bg-accent-soft/20 transition-colors">
                <Box className="w-12 h-12 text-text-muted group-hover:text-accent transition-colors" />
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
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  {prod.price ? (
                    <div className="text-base font-bold font-mono text-text">
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
      </section>

      {/* Assurance Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
        <div className="bg-surface rounded-[8px] border border-border p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-accent-soft text-accent shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">{t('catalog.accurateInventory')}</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {t('catalog.accurateInventoryDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-accent-soft text-accent shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">{t('catalog.qualitySourcing')}</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {t('catalog.qualitySourcingDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-accent-soft text-accent shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">{t('catalog.procurement')}</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {t('catalog.procurementDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
