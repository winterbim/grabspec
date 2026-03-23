'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { FolderOpen, Package, MoreVertical, Pencil, Copy, Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LocalProject, LocalProduct } from '@/lib/db';

const PHASE_COLORS: Record<string, string> = {
  etudes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  dce: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  exe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  reception: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  chantier: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

interface ProjectCardProps {
  project: LocalProject;
  products: LocalProduct[];
  onDelete: (id: string) => void;
  onDuplicate: (project: LocalProject) => void;
}

export function ProjectCard({ project, products, onDelete, onDuplicate }: ProjectCardProps) {
  const t = useTranslations('library');

  const productCount = products.filter((p) => !p.isDeleted).length;
  const coverPhoto = useMemo(() => {
    const withPhoto = products.find((p) => p.photoBlobUrl && !p.isDeleted);
    return withPhoto?.photoBlobUrl ?? null;
  }, [products]);

  const updatedAt = project.updatedAt ?? project.createdAt;
  const relativeDate = useMemo(() => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t('today');
    if (days === 1) return t('yesterday');
    return t('daysAgo', { count: days });
  }, [updatedAt, t]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      {/* Cover */}
      <Link href={`/library/${project.id}`}>
        <div className="relative h-36 bg-slate-100 dark:bg-slate-700">
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FolderOpen className="h-10 w-10 text-slate-300 dark:text-slate-500" />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/library/${project.id}`} className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {project.name}
            </h3>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 group-hover:opacity-100"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(project)}>
                <Copy className="mr-2 h-4 w-4" /> {t('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description}</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          {project.phase && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${PHASE_COLORS[project.phase] ?? ''}`}>
              {t(`phases.${project.phase}`)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Package className="h-3 w-3" />
            {productCount}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400">{relativeDate}</span>
        </div>
      </div>
    </div>
  );
}
