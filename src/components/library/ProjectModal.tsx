'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LocalProject } from '@/lib/db';

type Phase = 'etudes' | 'dce' | 'exe' | 'reception' | 'chantier';
type Lot = 'plomberie' | 'electricite' | 'cvc' | 'menuiseries' | 'autre';

const PHASES: Phase[] = ['etudes', 'dce', 'exe', 'reception', 'chantier'];
const LOTS: Lot[] = ['plomberie', 'electricite', 'cvc', 'menuiseries', 'autre'];

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<LocalProject> & { name: string }) => Promise<void>;
  initial?: LocalProject;
}

export function ProjectModal({ open, onOpenChange, onSubmit, initial }: ProjectModalProps) {
  const t = useTranslations('library');
  const tCommon = useTranslations('common');

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [phase, setPhase] = useState<Phase | ''>(initial?.phase ?? '');
  const [moa, setMoa] = useState(initial?.moa ?? '');
  const [architect, setArchitect] = useState(initial?.architect ?? '');
  const [lot, setLot] = useState<Lot | ''>(initial?.lot ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      phase: phase || undefined,
      moa: moa.trim() || undefined,
      architect: architect.trim() || undefined,
      lot: lot || undefined,
    });
    setSaving(false);
    onOpenChange(false);
    // Reset form
    if (!initial) {
      setName('');
      setDescription('');
      setPhase('');
      setMoa('');
      setArchitect('');
      setLot('');
    }
  }, [name, description, phase, moa, architect, lot, onSubmit, onOpenChange, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? t('editProject') : t('newProject')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name (required) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('projectName')} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('projectNamePlaceholder')}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('projectDescription')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('projectDescriptionPlaceholder')}
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phase */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('phase')}
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as Phase | '')}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">{t('selectPhase')}</option>
                {PHASES.map((p) => (
                  <option key={p} value={p}>{t(`phases.${p}`)}</option>
                ))}
              </select>
            </div>

            {/* Lot */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('lot')}
              </label>
              <select
                value={lot}
                onChange={(e) => setLot(e.target.value as Lot | '')}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">{t('selectLot')}</option>
                {LOTS.map((l) => (
                  <option key={l} value={l}>{t(`lots.${l}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* MOA (Client) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('moa')}
              </label>
              <Input
                value={moa}
                onChange={(e) => setMoa(e.target.value)}
                placeholder={t('moaPlaceholder')}
              />
            </div>

            {/* Architect */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('architect')}
              </label>
              <Input
                value={architect}
                onChange={(e) => setArchitect(e.target.value)}
                placeholder={t('architectPlaceholder')}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || saving}>
            {initial ? tCommon('save') : t('createProject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
