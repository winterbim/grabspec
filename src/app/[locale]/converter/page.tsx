'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowRightLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DropZone } from '@/components/converter/DropZone';
import { ConversionProgress } from '@/components/converter/ConversionProgress';
import { DownloadResult } from '@/components/converter/DownloadResult';
import { Button } from '@/components/ui/button';
import { HelpTip } from '@/components/ui/help-tip';
import { useConverter } from '@/hooks/useConverter';

export default function ConverterPage() {
  const t = useTranslations('converter');
  const { state, result, error, convert, reset, download } = useConverter();
  const [currentFilename, setCurrentFilename] = useState('');

  const handleFileSelect = useCallback(
    (file: File) => {
      setCurrentFilename(file.name);
      convert(file);
    },
    [convert],
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
      reset();
    }
  }, [error, reset]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-blue-100 p-3">
            <ArrowRightLeft className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-slate-600">{t('subtitle')}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
            <span>{t('help_label')}</span>
            <HelpTip content={t('usageTip')} />
          </div>
        </div>

        {state === 'idle' && <DropZone onFileSelect={handleFileSelect} />}

        {state === 'converting' && (
          <ConversionProgress filename={currentFilename} />
        )}

        {state === 'done' && result && (
          <div className="flex flex-col items-center gap-4">
            <DownloadResult
              filename={result.filename}
              size={result.size}
              onDownload={download}
            />
            <Button variant="ghost" onClick={reset}>
              {t('convertAnother')}
            </Button>
          </div>
        )}

        <div className="mt-16 space-y-4 text-center">
          <p className="text-sm text-slate-500">{t('autoDetect')}</p>
          <p className="text-sm text-slate-500">{t('secure')}</p>

          <div className="flex items-center justify-center gap-6 pt-4 text-sm font-medium text-slate-600">
            <span>{t('pdfToWord')}</span>
            <ArrowRightLeft className="h-4 w-4 text-slate-400" />
            <span>{t('wordToPdf')}</span>
          </div>
        </div>

        <div className="mt-10 rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-sm text-blue-800">
            {t('crossSell')}{' '}
            <Link href="/finder" className="font-semibold underline hover:text-blue-600">
              {t('crossSellCta')}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
