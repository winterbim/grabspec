'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowRightLeft,
  FileText,
  ImageIcon,
  Zap,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DropZone } from '@/components/converter/DropZone';
import { ConversionProgress } from '@/components/converter/ConversionProgress';
import { DownloadResult } from '@/components/converter/DownloadResult';
import { FormatSelector, getRoutesForFile, type ConversionRoute } from '@/components/converter/FormatSelector';
import { Button } from '@/components/ui/button';
import { useConverter } from '@/hooks/useConverter';
import { isImageFile } from '@/lib/image-converter';

/** Quick tool cards shown before file selection */
const QUICK_TOOLS = [
  { icon: FileText, from: 'PDF', to: 'Word', color: '#EF4444', key: 'pdfToWord' },
  { icon: FileText, from: 'Word', to: 'PDF', color: '#3B82F6', key: 'wordToPdf' },
  { icon: ImageIcon, from: 'JPG', to: 'PNG', color: '#F59E0B', key: 'jpgToPng' },
  { icon: ImageIcon, from: 'PNG', to: 'WEBP', color: '#8B5CF6', key: 'pngToWebp' },
  { icon: ImageIcon, from: 'WEBP', to: 'JPG', color: '#10B981', key: 'webpToJpg' },
  { icon: ImageIcon, from: 'PNG', to: 'JPG', color: '#F59E0B', key: 'pngToJpg' },
] as const;

export default function ConverterPage() {
  const t = useTranslations('converter');
  const { state, result, error, mode, convert, reset, download } = useConverter();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ConversionRoute | null>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      setCurrentFile(file);
      setSelectedRoute(null);

      // If PDF/Word: auto-convert immediately (only one target)
      const routes = getRoutesForFile(file.name);
      if (!isImageFile(file) && routes.length === 1) {
        convert(file);
      }
      // For images or files with multiple routes: wait for format selection
    },
    [convert],
  );

  const handleFormatSelect = useCallback(
    (route: ConversionRoute) => {
      setSelectedRoute(route);
    },
    [],
  );

  const handleConvert = useCallback(() => {
    if (!currentFile || !selectedRoute) return;
    convert(currentFile, selectedRoute.outputMime);
  }, [currentFile, selectedRoute, convert]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setSelectedRoute(null);
  }, [reset]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      reset();
      setCurrentFile(null);
    }
  }, [error, reset]);

  // Auto-convert when only one route (PDF/Word)
  const needsFormatSelection = currentFile && state === 'idle' && getRoutesForFile(currentFile.name).length > 1;
  const showDropZone = !currentFile || (state === 'idle' && !needsFormatSelection && getRoutesForFile(currentFile.name).length === 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* Hero header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 p-3.5 text-white shadow-lg shadow-blue-500/20">
            <ArrowRightLeft className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
        </div>

        {/* Quick tools grid — only shown when no file is selected */}
        {!currentFile && state === 'idle' && (
          <div className="mb-8">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('quickTools')}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {QUICK_TOOLS.map((tool) => (
                <button
                  key={tool.key}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all duration-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
                  onClick={() => {
                    // Open file picker — user will select the file
                    // This is just a visual hint
                  }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: tool.color + '12' }}
                  >
                    <tool.icon className="h-4 w-4" style={{ color: tool.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {tool.from} → {tool.to}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Drop zone */}
        {(showDropZone || (!currentFile && state === 'idle')) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                1
              </span>
              {t('stepAddFile')}
            </h3>
            <DropZone onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* Step 2: Format selection (for images with multiple targets) */}
        {needsFormatSelection && currentFile && (
          <div className="space-y-6">
            {/* File preview */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                {isImageFile(currentFile) ? (
                  <ImageIcon className="h-5 w-5 text-slate-500" />
                ) : (
                  <FileText className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {currentFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {currentFile.size < 1024 * 1024
                    ? `${(currentFile.size / 1024).toFixed(1)} KB`
                    : `${(currentFile.size / (1024 * 1024)).toFixed(1)} MB`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                {t('changeFile')}
              </Button>
            </div>

            {/* Format selector */}
            <FormatSelector
              filename={currentFile.name}
              selectedFormat={selectedRoute?.to ?? null}
              onSelect={handleFormatSelect}
            />

            {/* Convert button */}
            {selectedRoute && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                    3
                  </span>
                  {t('stepConvert')}
                </h3>
                <Button
                  size="lg"
                  onClick={handleConvert}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <ArrowRightLeft className="mr-2 h-5 w-5" />
                  {t('convertTo', { format: selectedRoute.to.toUpperCase() })}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Converting state */}
        {state === 'converting' && currentFile && (
          <ConversionProgress
            filename={currentFile.name}
            isClientSide={mode === 'client'}
          />
        )}

        {/* Done state */}
        {state === 'done' && result && (
          <div className="flex flex-col items-center gap-4">
            <DownloadResult
              filename={result.filename}
              size={result.size}
              onDownload={download}
              duration={result.duration}
            />
            <Button variant="ghost" onClick={handleReset}>
              {t('convertAnother')}
            </Button>
          </div>
        )}

        {/* Info section */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <Zap className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('featureInstant')}</p>
            <p className="text-xs text-slate-500">{t('featureInstantDesc')}</p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <Shield className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('featureSecure')}</p>
            <p className="text-xs text-slate-500">{t('featureSecureDesc')}</p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('featureFree')}</p>
            <p className="text-xs text-slate-500">{t('featureFreeDesc')}</p>
          </div>
        </div>

        {/* Cross-sell banner */}
        <div className="mt-10 rounded-xl bg-blue-50 p-5 text-center dark:bg-blue-950/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {t('crossSell')}{' '}
            <Link href="/finder" className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-200">
              {t('crossSellCta')}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
