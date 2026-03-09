'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { LocalProduct } from '@/lib/db';

interface ZipDownloaderProps {
  selectedProducts: LocalProduct[];
  template: string;
  projectName: string;
}

export function ZipDownloader({ selectedProducts, template, projectName }: ZipDownloaderProps) {
  const t = useTranslations('library.download');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

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
      await downloadExcelOnly({ products: selectedProducts, projectName });
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
