'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LocalProduct, LocalProject } from '@/lib/db';
import {
  searchProducts,
  sortProducts,
  type SearchFilter,
  type SortBy,
  getLibraryStats,
  type LibraryStats,
} from '@/lib/library-search';
import { autoDetectCategory } from '@/lib/smart-categories';

export function useLibrary() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LibraryStats | null>(null);

  const refresh = useCallback(async () => {
    const { db } = await import('@/lib/db');
    const [prods, projs] = await Promise.all([db.products.toArray(), db.projects.toArray()]);
    setProducts(prods);
    setProjects(projs);
    setStats(getLibraryStats(prods));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProject = useCallback(
    async (name: string) => {
      const { db } = await import('@/lib/db');
      const { nanoid } = await import('nanoid');
      const project: LocalProject = {
        id: nanoid(),
        name,
        nomenclatureTemplate: '{PROJET}_{LOT}_{FABRICANT}_{REF}_{TYPE}',
        createdAt: new Date().toISOString(),
      };
      await db.projects.put(project);
      await refresh();
      return project;
    },
    [refresh]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const { db } = await import('@/lib/db');
      await db.projects.delete(id);
      await db.products.where('projectId').equals(id).modify({ projectId: null });
      await refresh();
    },
    [refresh]
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<LocalProduct>) => {
      const { db } = await import('@/lib/db');
      await db.products.update(id, updates);
      await refresh();
    },
    [refresh]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const { db } = await import('@/lib/db');
      // Soft delete - mark as deleted instead of removing
      await db.products.update(id, { isDeleted: true });
      await refresh();
    },
    [refresh]
  );

  const permanentlyDeleteProduct = useCallback(
    async (id: string) => {
      const { db } = await import('@/lib/db');
      // Hard delete - remove from database
      await db.products.delete(id);
      await refresh();
    },
    [refresh]
  );

  const restoreProduct = useCallback(
    async (id: string) => {
      const { db } = await import('@/lib/db');
      await db.products.update(id, { isDeleted: false });
      await refresh();
    },
    [refresh]
  );

  const bulkDeleteProducts = useCallback(
    async (ids: string[]) => {
      const { db } = await import('@/lib/db');
      await Promise.all(ids.map((id) => db.products.update(id, { isDeleted: true })));
      await refresh();
    },
    [refresh]
  );

  const updateProjectTemplate = useCallback(
    async (id: string, template: string) => {
      const { db } = await import('@/lib/db');
      await db.projects.update(id, { nomenclatureTemplate: template });
      await refresh();
    },
    [refresh]
  );

  const getProductsByProject = useCallback(
    (projectId: string | null, includeDeleted = false) => {
      let filtered = projectId ? products.filter((p) => p.projectId === projectId) : products;
      if (!includeDeleted) {
        filtered = filtered.filter((p) => !p.isDeleted);
      }
      return filtered;
    },
    [products]
  );

  const searchProductsLib = useCallback(
    (filters: SearchFilter, sortBy?: SortBy) => {
      const results = searchProducts(products, filters);
      let sorted = results.products;
      if (sortBy) {
        sorted = sortProducts(sorted, sortBy);
      }
      return { ...results, products: sorted };
    },
    [products]
  );

  const assignCategoryToProduct = useCallback(
    async (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const detected = autoDetectCategory(
        product.inputName,
        product.manufacturer,
        product.specs || {}
      );
      await updateProduct(productId, {
        category: detected.category,
        confidence: detected.confidence,
      });
    },
    [products, updateProduct]
  );

  const bulkAssignCategories = useCallback(
    async (productIds: string[]) => {
      const { db } = await import('@/lib/db');
      for (const id of productIds) {
        const product = products.find((p) => p.id === id);
        if (!product) continue;
        const detected = autoDetectCategory(
          product.inputName,
          product.manufacturer,
          product.specs || {}
        );
        await db.products.update(id, {
          category: detected.category,
          confidence: detected.confidence,
        });
      }
      await refresh();
    },
    [products, refresh]
  );

  return {
    products,
    projects,
    isLoading,
    stats,
    addProject,
    deleteProject,
    updateProduct,
    deleteProduct,
    permanentlyDeleteProduct,
    restoreProduct,
    bulkDeleteProducts,
    updateProjectTemplate,
    getProductsByProject,
    searchProducts: searchProductsLib,
    assignCategoryToProduct,
    bulkAssignCategories,
    refresh,
  };
}
