'use client';

import { useTranslations } from 'next-intl';
import { ProductCard } from '@/components/finder/ProductCard';
import type { FinderProduct } from '@/stores/finderStore';

interface ResultsGridProps {
  products: FinderProduct[];
}

export function ResultsGrid({ products }: ResultsGridProps) {
  const t = useTranslations('finder');

  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">
        {t('productCount', { count: products.length })}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product, idx) => (
          <ProductCard key={`${product.query}-${idx}`} product={product} />
        ))}
      </div>
    </section>
  );
}
