'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProjectSelector } from '@/components/library/ProjectSelector';
import { LibraryGrid } from '@/components/library/LibraryGrid';
import { NomenclatureConfig } from '@/components/library/NomenclatureConfig';
import { ZipDownloader } from '@/components/library/ZipDownloader';
import { CompanySettings } from '@/components/library/CompanySettings';
import { ProjectDetailsForm } from '@/components/library/ProjectDetailsForm';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLibrary } from '@/hooks/useLibrary';
import { useLibraryStore } from '@/stores/libraryStore';
import { DEFAULT_TEMPLATE } from '@/lib/nomenclature';
import { getStoredPlan } from '@/lib/db';

export default function LibraryPage() {
  const t = useTranslations('library');

  const {
    products, projects, isLoading,
    addProject, deleteProject, updateProjectTemplate, getProductsByProject,
  } = useLibrary();

  const {
    selectedIds, currentProjectId, toggleSelect, selectAll, clearSelection, setCurrentProject,
  } = useLibraryStore();

  const filteredProducts = useMemo(
    () => getProductsByProject(currentProjectId),
    [getProductsByProject, currentProjectId]
  );

  const selectedProducts = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)),
    [filteredProducts, selectedIds]
  );

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const [localTemplate, setLocalTemplate] = useState<string | null>(null);
  const template = localTemplate ?? currentProject?.nomenclatureTemplate ?? DEFAULT_TEMPLATE;

  const handleTemplateChange = useCallback(
    (newTemplate: string) => {
      setLocalTemplate(newTemplate);
      if (currentProjectId) {
        updateProjectTemplate(currentProjectId, newTemplate);
      }
    },
    [currentProjectId, updateProjectTemplate]
  );

  const handleSelectAll = () => {
    selectAll(filteredProducts.map((p) => p.id));
  };

  const hasSelection = selectedIds.size > 0;
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    getStoredPlan().then((plan) => setIsBusiness(plan === 'business'));
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
            <div className="w-full sm:w-64">
              <ProjectSelector
                projects={projects}
                currentProjectId={currentProjectId}
                onSelectProject={setCurrentProject}
                onAddProject={async (name) => { await addProject(name); }}
                onDeleteProject={deleteProject}
              />
            </div>
          </div>

          {isBusiness && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <CompanySettings />
              {currentProjectId && (
                <ProjectDetailsForm projectId={currentProjectId} />
              )}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {t('download.selectAll')}
              </Button>
              {hasSelection && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  {t('download.selected', { count: selectedIds.size })}
                </Button>
              )}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <p className="max-w-md text-slate-500">{t('empty')}</p>
            </div>
          ) : (
            <LibraryGrid
              products={filteredProducts}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}
        </div>
      </main>

      {hasSelection && (
        <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-8">
              <div className="flex-1">
                <NomenclatureConfig
                  template={template}
                  onTemplateChange={handleTemplateChange}
                />
              </div>
              <Separator orientation="vertical" className="hidden h-24 lg:block" />
              <div className="shrink-0">
                <ZipDownloader
                  selectedProducts={selectedProducts}
                  template={template}
                  projectName={currentProject?.name ?? 'GrabSpec'}
                  projectId={currentProjectId}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
