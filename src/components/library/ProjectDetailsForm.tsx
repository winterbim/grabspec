'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProjectDetails, setProjectDetails } from '@/lib/db';
import type { ProjectDetails } from '@/types';

const EMPTY_DETAILS: ProjectDetails = {
  projectNumber: '', siteAddress: '', client: '', architect: '', phase: '',
};

interface ProjectDetailsFormProps {
  projectId: string;
}

export function ProjectDetailsForm({ projectId }: ProjectDetailsFormProps) {
  const t = useTranslations('library.projectDetails');
  const [details, setDetails] = useState<ProjectDetails>(EMPTY_DETAILS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    getProjectDetails(projectId).then((d) => {
      setDetails(d ?? EMPTY_DETAILS);
      setLoaded(true);
    });
  }, [projectId]);

  const save = useCallback(async (updated: ProjectDetails) => {
    setDetails(updated);
    await setProjectDetails(projectId, updated);
  }, [projectId]);

  const handleField = (field: keyof ProjectDetails, value: string) => {
    const updated = { ...details, [field]: value };
    save(updated);
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={t('projectNumber')}
            value={details.projectNumber}
            onChange={(e) => handleField('projectNumber', e.target.value)}
          />
          <Input
            placeholder={t('phase')}
            value={details.phase}
            onChange={(e) => handleField('phase', e.target.value)}
          />
        </div>
        <Input
          placeholder={t('siteAddress')}
          value={details.siteAddress}
          onChange={(e) => handleField('siteAddress', e.target.value)}
        />
        <Input
          placeholder={t('client')}
          value={details.client}
          onChange={(e) => handleField('client', e.target.value)}
        />
        <Input
          placeholder={t('architect')}
          value={details.architect}
          onChange={(e) => handleField('architect', e.target.value)}
        />
      </CardContent>
    </Card>
  );
}
