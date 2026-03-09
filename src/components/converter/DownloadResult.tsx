'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DownloadResultProps {
  filename: string;
  size: number;
  onDownload: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadResult({ filename, size, onDownload }: DownloadResultProps) {
  const t = useTranslations('converter');

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-5 py-8">
        <CheckCircle2 className="h-14 w-14 text-green-500" />

        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">{t('done')}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{filename}</p>
          <p className="text-sm text-slate-500">{formatFileSize(size)}</p>
        </div>

        <Button
          size="lg"
          onClick={onDownload}
          className="w-full bg-green-600 text-white hover:bg-green-700"
        >
          <Download className="mr-2 h-5 w-5" data-icon="inline-start" />
          {t('downloadResult')}
        </Button>
      </CardContent>
    </Card>
  );
}
