'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { LocalProduct } from '@/lib/db';
import { getCompanyProfile, getProjectDetails, getStoredPlan } from '@/lib/db';
import type { CompanyProfile, ProjectDetails } from '@/types';

interface ZipDownloaderProps {
  selectedProducts: LocalProduct[];
  template: string;
  projectName: string;
  projectId?: string | null;
}

export function ZipDownloader({ selectedProducts, template, projectName, projectId }: ZipDownloaderProps) {
  const t = useTranslations('library.download');
  const locale = useLocale();
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    getStoredPlan().then((plan) => {
      setIsBusiness(plan === 'business');
    });
  }, []);

  useEffect(() => {
    if (!isBusiness) return;
    getCompanyProfile().then(setCompany);
    if (projectId) {
      getProjectDetails(projectId).then(setDetails);
    }
  }, [isBusiness, projectId]);

  const handleDownloadZip = async () => {
    if (selectedProducts.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    try {
      const { downloadZip } = await import('@/lib/download');
      await downloadZip({
        products: selectedProducts,
        template,
        projectName,
        locale,
        company: isBusiness ? company : null,
        projectDetails: isBusiness ? details : null,
        onProgress: (pct) => setProgress(pct),
      });
    } catch {
      toast.error(t('error') ?? 'Download failed');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleDownloadExcel = async () => {
    if (selectedProducts.length === 0) return;
    setIsGenerating(true);
    try {
      const { downloadExcelOnly } = await import('@/lib/download');
      await downloadExcelOnly({
        products: selectedProducts,
        projectName,
        locale,
        company: isBusiness ? company : null,
        projectDetails: isBusiness ? details : null,
      });
    } catch {
      toast.error(t('error') ?? 'Download failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const count = selectedProducts.length;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">
        {t('selected', { count })}
      </p>

      {isGenerating && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">{t('generating')}</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          disabled={count === 0 || isGenerating}
          onClick={handleDownloadZip}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t('zipButton', { count })}
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={count === 0 || isGenerating}
          onClick={handleDownloadExcel}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {t('excelOnly')}
        </Button>
      </div>
    </div>
  );
}
