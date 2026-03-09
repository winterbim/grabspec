'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FolderOpen, Plus, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { LocalProject } from '@/lib/db';

interface ProjectSelectorProps {
  projects: LocalProject[];
  currentProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectSelector({
  projects,
  currentProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const t = useTranslations('library');
  const tCommon = useTranslations('common');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const displayLabel = currentProject ? currentProject.name : t('allProducts');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    await onAddProject(newName.trim());
    setNewName('');
    setDialogOpen(false);
    setIsCreating(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between gap-2" />}>
          <span className="flex items-center gap-2 truncate">
            <FolderOpen className="h-4 w-4 shrink-0" />
            {displayLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem onClick={() => onSelectProject(null)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            {t('allProducts')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className="flex items-center justify-between"
              onClick={() => onSelectProject(project.id)}
            >
              <span className="truncate">{project.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newProject')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('newProject')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('projectName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isCreating}>
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
