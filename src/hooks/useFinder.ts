'use client';

import { useCallback } from 'react';
import { useFinderStore } from '@/stores/finderStore';
import type { ProductResult } from '@/types';

const MAX_CONCURRENT = 3;

export function useFinder() {
  const { products, isSearching, setProducts, updateProduct, setIsSearching, reset } =
    useFinderStore();

  const search = useCallback(
    async (queries: string[], sessionId: string) => {
      const items = queries.map((query) => ({
        query,
        status: 'pending' as const,
        result: null,
      }));
      setProducts(items);
      setIsSearching(true);

      let currentIndex = 0;

      async function processNext() {
        while (currentIndex < queries.length) {
          const idx = currentIndex++;
          updateProduct(idx, { status: 'searching' });

          try {
            const res = await fetch('/api/finder/search-single', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: queries[idx], sessionId }),
            });

            if (!res.ok) {
              updateProduct(idx, { status: 'error', result: null });
              if (res.status === 429) break;
              continue;
            }

            const json: { data: ProductResult } = await res.json();
            const result = json.data;
            updateProduct(idx, {
              status: result.searchStatus,
              result,
            });

            try {
              const { db } = await import('@/lib/db');
              await db.products.put({
                id: result.id,
                projectId: null,
                inputName: result.inputName,
                resolvedName: result.resolvedName,
                manufacturer: result.manufacturer,
                reference: result.reference,
                category: result.category,
                lot: result.lot,
                photoUrl: result.photoUrl,
                photoBlobUrl: result.photoBlobUrl,
                datasheetUrl: result.datasheetUrl,
                datasheetBlobUrl: result.datasheetBlobUrl,
                specs: result.specs as Record<string, string | null> | null,
                searchStatus: result.searchStatus,
                createdAt: result.createdAt,
              });
            } catch {
              // IndexedDB save failed, continue anyway
            }
          } catch {
            updateProduct(idx, { status: 'error' });
          }
        }
      }

      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENT, queries.length) },
        () => processNext()
      );
      await Promise.all(workers);
      setIsSearching(false);
    },
    [setProducts, updateProduct, setIsSearching]
  );

  const doneCount = products.filter(
    (p) => p.status !== 'pending' && p.status !== 'searching'
  ).length;

  return { products, isSearching, doneCount, search, reset };
}
