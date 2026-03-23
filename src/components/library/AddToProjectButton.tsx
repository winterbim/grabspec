'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FolderPlus, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LocalProject, LocalProduct } from '@/lib/db';

interface AddToProjectButtonProps {
  product: {
    id: string;
    inputName: string;
    resolvedName: string | null;
    manufacturer: string | null;
    reference: string | null;
    category: string | null;
    photoUrl: string | null;
    photoBlobUrl: string | null;
    datasheetUrl: string | null;
    datasheetBlobUrl: string | null;
    specs: Record<string, string | null> | null;
    searchStatus: string;
  };
  onNewProject?: () => void;
}

export function AddToProjectButton({ product, onNewProject }: AddToProjectButtonProps) {
  const t = useTranslations('library');
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [addedTo, setAddedTo] = useState<string | null>(null);

  useEffect(() => {
    import('@/lib/db').then(({ db }) => db.projects.toArray()).then(setProjects);
  }, []);

  const handleAdd = useCallback(
    async (projectId: string | null) => {
      const { db } = await import('@/lib/db');
      const existing = await db.products.get(product.id);
      if (existing) {
        // Product already in library, just update projectId
        await db.products.update(product.id, { projectId });
      } else {
        // Add new product to library
        const localProduct: LocalProduct = {
          id: product.id,
          projectId,
          inputName: product.inputName,
          resolvedName: product.resolvedName,
          manufacturer: product.manufacturer,
          reference: product.reference,
          category: product.category,
          lot: null,
          photoUrl: product.photoUrl,
          photoBlobUrl: product.photoBlobUrl,
          datasheetUrl: product.datasheetUrl,
          datasheetBlobUrl: product.datasheetBlobUrl,
          specs: product.specs,
          searchStatus: product.searchStatus as LocalProduct['searchStatus'],
          createdAt: new Date().toISOString(),
          isDeleted: false,
        };
        await db.products.put(localProduct);
      }

      const project = projects.find((p) => p.id === projectId);
      setAddedTo(projectId);
      toast.success(t('addedToProject', { name: project?.name ?? t('allProducts') }));
    },
    [product, projects, t],
  );

  if (addedTo !== null) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-emerald-600">
        <Check className="mr-1.5 h-3.5 w-3.5" />
        {t('added')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
        {t('addToProject')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleAdd(null)}>
          {t('allProducts')}
        </DropdownMenuItem>
        {projects.length > 0 && <DropdownMenuSeparator />}
        {projects.map((proj) => (
          <DropdownMenuItem key={proj.id} onClick={() => handleAdd(proj.id)}>
            {proj.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNewProject}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newProject')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
