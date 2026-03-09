'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LocalProduct, LocalProject } from '@/lib/db';

export function useLibrary() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { db } = await import('@/lib/db');
    const [prods, projs] = await Promise.all([
      db.products.toArray(),
      db.projects.toArray(),
    ]);
    setProducts(prods);
    setProjects(projs);
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addProject = useCallback(async (name: string) => {
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
  }, [refresh]);

  const deleteProject = useCallback(async (id: string) => {
    const { db } = await import('@/lib/db');
    await db.projects.delete(id);
    await db.products.where('projectId').equals(id).modify({ projectId: null });
    await refresh();
  }, [refresh]);

  const updateProduct = useCallback(async (id: string, updates: Partial<LocalProduct>) => {
    const { db } = await import('@/lib/db');
    await db.products.update(id, updates);
    await refresh();
  }, [refresh]);

  const deleteProduct = useCallback(async (id: string) => {
    const { db } = await import('@/lib/db');
    await db.products.delete(id);
    await refresh();
  }, [refresh]);

  const updateProjectTemplate = useCallback(async (id: string, template: string) => {
    const { db } = await import('@/lib/db');
    await db.projects.update(id, { nomenclatureTemplate: template });
    await refresh();
  }, [refresh]);

  const getProductsByProject = useCallback((projectId: string | null) => {
    if (!projectId) return products;
    return products.filter((p) => p.projectId === projectId);
  }, [products]);

  return {
    products, projects, isLoading,
    addProject, deleteProject, updateProduct, deleteProduct,
    updateProjectTemplate, getProductsByProject, refresh,
  };
}
