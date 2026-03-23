'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Plus, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EmptyLibrary } from '@/components/library/EmptyLibrary';
import { ProjectCard } from '@/components/library/ProjectCard';
import { ProjectModal } from '@/components/library/ProjectModal';
import { Button } from '@/components/ui/button';
import { useLibrary } from '@/hooks/useLibrary';
import type { LocalProject } from '@/lib/db';

type SortMode = 'recent' | 'alpha' | 'products';

export default function LibraryPage() {
  const t = useTranslations('library');
  const {
    products,
    projects,
    isLoading,
    addProject,
    deleteProject,
  } = useLibrary();

  const [modalOpen, setModalOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const sorted = useMemo(() => {
    const withCount = projects.map((p) => ({
      project: p,
      count: products.filter((pr) => pr.projectId === p.id && !pr.isDeleted).length,
    }));

    switch (sortMode) {
      case 'alpha':
        return withCount.sort((a, b) => a.project.name.localeCompare(b.project.name));
      case 'products':
        return withCount.sort((a, b) => b.count - a.count);
      case 'recent':
      default:
        return withCount.sort(
          (a, b) =>
            new Date(b.project.updatedAt ?? b.project.createdAt).getTime() -
            new Date(a.project.updatedAt ?? a.project.createdAt).getTime(),
        );
    }
  }, [projects, products, sortMode]);

  const handleCreate = useCallback(
    async (data: Partial<LocalProject> & { name: string }) => {
      await addProject(data);
      toast.success(t('projectCreated'));
    },
    [addProject, t],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t('confirmDelete'))) return;
      await deleteProject(id);
      toast.success(t('projectDeleted'));
    },
    [deleteProject, t],
  );

  const handleDuplicate = useCallback(
    async (project: LocalProject) => {
      await addProject({
        name: `${project.name} (copy)`,
        description: project.description,
        phase: project.phase,
        moa: project.moa,
        architect: project.architect,
        lot: project.lot,
      });
      toast.success(t('projectDuplicated'));
    },
    [addProject, t],
  );

  const cycleSortMode = useCallback(() => {
    setSortMode((m) => {
      if (m === 'recent') return 'alpha';
      if (m === 'alpha') return 'products';
      return 'recent';
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">{t('title')}...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/20">
                <BookOpen className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('title')}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
            </div>
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={cycleSortMode}>
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
                  {t(`sort.${sortMode}`)}
                </Button>
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t('newProject')}
                </Button>
              </div>
            )}
          </div>

          {/* Empty state or grid */}
          {projects.length === 0 ? (
            <EmptyLibrary onCreateProject={() => setModalOpen(true)} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map(({ project }) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  products={products.filter((p) => p.projectId === project.id)}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <ProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
