'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductInput } from '@/components/finder/ProductInput';
import { SearchProgress } from '@/components/finder/SearchProgress';
import { ResultsGrid } from '@/components/finder/ResultsGrid';
import { useFinder } from '@/hooks/useFinder';
import { useSession } from '@/hooks/useSession';

export default function FinderPage() {
  const t = useTranslations('finder');
  const { products, isSearching, doneCount, search } = useFinder();
  const { sessionId } = useSession();

  const handleSearch = useCallback(
    (queries: string[]) => {
      if (!sessionId) return;
      search(queries, sessionId);
    },
    [sessionId, search]
  );

  const hasProducts = products.length > 0;

  return (
    <div className="animate-in fade-in duration-500">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">
          {t('title')}
        </h1>

        <ProductInput onSearch={handleSearch} isSearching={isSearching} />

        {hasProducts && (
          <div className="mt-8 space-y-8">
            {isSearching && (
              <SearchProgress products={products} doneCount={doneCount} />
            )}
            <ResultsGrid products={products} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
