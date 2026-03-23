'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Search,
  GripVertical,
  Pencil,
  Trash2,
  Package,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExportMenu } from '@/components/library/ExportMenu';
import { ProjectModal } from '@/components/library/ProjectModal';
import { useLibrary } from '@/hooks/useLibrary';
import { DEFAULT_TEMPLATE } from '@/lib/nomenclature';
import type { LocalProduct, LocalProject } from '@/lib/db';

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const t = useTranslations('library');
  const router = useRouter();
  const {
    products: allProducts,
    projects,
    isLoading,
    updateProject,
    deleteProduct,
    reorderProducts,
    refresh,
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [lotFilter, setLotFilter] = useState('all');
  const [editOpen, setEditOpen] = useState(false);

  const project = projects.find((p) => p.id === params.projectId) ?? null;

  const projectProducts = useMemo(() => {
    const prods = allProducts
      .filter((p) => p.projectId === params.projectId && !p.isDeleted);

    // Respect saved order
    if (project?.productOrder && project.productOrder.length > 0) {
      const orderMap = new Map(project.productOrder.map((id, i) => [id, i]));
      return [...prods].sort((a, b) => {
        const oa = orderMap.get(a.id) ?? 9999;
        const ob = orderMap.get(b.id) ?? 9999;
        return oa - ob;
      });
    }
    return prods;
  }, [allProducts, params.projectId, project?.productOrder]);

  const filtered = useMemo(() => {
    let result = projectProducts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.inputName.toLowerCase().includes(q) ||
          p.resolvedName?.toLowerCase().includes(q) ||
          p.manufacturer?.toLowerCase().includes(q) ||
          p.reference?.toLowerCase().includes(q),
      );
    }
    if (lotFilter !== 'all') {
      result = result.filter((p) => p.lot === lotFilter);
    }
    return result;
  }, [projectProducts, search, lotFilter]);

  const lots = useMemo(() => {
    const set = new Set<string>();
    for (const p of projectProducts) {
      if (p.lot) set.add(p.lot);
    }
    return Array.from(set).sort();
  }, [projectProducts]);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = projectProducts.findIndex((p) => p.id === active.id);
      const newIndex = projectProducts.findIndex((p) => p.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(projectProducts, oldIndex, newIndex);
      reorderProducts(params.projectId, reordered.map((p) => p.id));
    },
    [projectProducts, reorderProducts, params.projectId],
  );

  const handleEditProject = useCallback(
    async (data: Partial<LocalProject> & { name: string }) => {
      await updateProject(params.projectId, data);
      toast.success(t('projectUpdated'));
    },
    [updateProject, params.projectId, t],
  );

  const handleAddProducts = useCallback(() => {
    router.push('/finder');
  }, [router]);

  const template = project?.nomenclatureTemplate ?? DEFAULT_TEMPLATE;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">{t('title')}...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              {t('projectNotFound')}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/library')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToLibrary')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Back + Project header */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/library')} className="mb-4">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              {t('backToLibrary')}
            </Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {project.name}
                  </h1>
                  {project.phase && (
                    <Badge variant="secondary">{t(`phases.${project.phase}`)}</Badge>
                  )}
                  <Button variant="ghost" size="icon-xs" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-slate-500">{project.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                  {project.moa && <span>MOA: {project.moa}</span>}
                  {project.architect && <span>Architecte: {project.architect}</span>}
                  {project.lot && <span>Lot: {t(`lots.${project.lot}`)}</span>}
                  <span>{projectProducts.length} {t('products')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ExportMenu products={filtered} project={project} template={template} />
                <Button size="sm" onClick={handleAddProducts}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t('addProducts')}
                </Button>
              </div>
            </div>
          </div>

          {/* Search + filter bar */}
          {projectProducts.length > 0 && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchProducts')}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              {lots.length > 0 && (
                <select
                  value={lotFilter}
                  onChange={(e) => setLotFilter(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="all">{t('allLots')}</option>
                  {lots.map((l) => (
                    <option key={l} value={l}>{t(`lots.${l}`)}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Product grid with drag & drop */}
          {filtered.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filtered.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((product) => (
                    <SortableProductCard
                      key={product.id}
                      product={product}
                      onDelete={() => {
                        deleteProduct(product.id);
                        toast.success(t('productDeleted'));
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : projectProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
              <Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-300">
                {t('noProducts')}
              </p>
              <p className="mt-2 text-sm text-slate-500">{t('noProductsHelp')}</p>
              <Button className="mt-6" onClick={handleAddProducts}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addProducts')}
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              {t('noProductsFilter')}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <ProjectModal
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEditProject}
        initial={project}
      />
    </div>
  );
}

// ─── Sortable product card ───────────────────────────────────

function SortableProductCard({
  product,
  onDelete,
}: {
  product: LocalProduct;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 z-10 cursor-grab rounded-lg p-1 opacity-0 transition-opacity hover:bg-slate-100 group-hover:opacity-100 dark:hover:bg-slate-700"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      {/* Photo */}
      <div className="aspect-square bg-slate-100 dark:bg-slate-700">
        {product.photoBlobUrl || product.photoUrl ? (
          <img
            src={product.photoBlobUrl ?? product.photoUrl ?? ''}
            alt={product.resolvedName ?? product.inputName}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-slate-300 dark:text-slate-500" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {product.resolvedName ?? product.inputName}
        </p>
        {product.manufacturer && (
          <p className="mt-0.5 text-xs text-slate-500">{product.manufacturer}</p>
        )}
        {product.reference && (
          <p className="mt-0.5 font-mono text-xs text-slate-400">{product.reference}</p>
        )}
        {product.lot && (
          <Badge variant="outline" className="mt-2 text-[10px]">
            {product.lot}
          </Badge>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="absolute right-1.5 top-1.5 rounded-lg bg-white/80 p-1 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 dark:bg-slate-800/80 dark:hover:bg-red-900/20"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </button>
    </div>
  );
}
