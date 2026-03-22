'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
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
import {
  FormatSelector,
  ConversionGrid,
  getRoutesForFile,
  TOTAL_CONVERSIONS,
  type ConversionRoute,
} from '@/components/converter/FormatSelector';
import { Button } from '@/components/ui/button';
import { useConverter } from '@/hooks/useConverter';
import { isImageFile } from '@/lib/image-converter';

export default function ConverterPage() {
  const t = useTranslations('converter');
  const { state, result, error, mode, convert, reset, download } = useConverter();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ConversionRoute | null>(null);
  const [preselectedRoute, setPreselectedRoute] = useState<ConversionRoute | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      setCurrentFile(file);
      setSelectedRoute(null);

      const routes = getRoutesForFile(file.name);

      // If a conversion was pre-selected from the grid, auto-select & convert
      if (preselectedRoute) {
        const matchingRoute = routes.find((r) => r.to === preselectedRoute.to);
        if (matchingRoute) {
          setSelectedRoute(matchingRoute);
          convert(file, matchingRoute.outputMime);
          setPreselectedRoute(null);
          return;
        }
        setPreselectedRoute(null);
      }

      // PDF/Word with single target: auto-convert
      if (!isImageFile(file) && routes.length === 1) {
        convert(file);
      }
    },
    [convert, preselectedRoute],
  );

  const handleFormatSelect = useCallback((route: ConversionRoute) => {
    setSelectedRoute(route);
  }, []);

  const handleConvert = useCallback(() => {
    if (!currentFile || !selectedRoute) return;
    convert(currentFile, selectedRoute.outputMime);
  }, [currentFile, selectedRoute, convert]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setSelectedRoute(null);
    setPreselectedRoute(null);
  }, [reset]);

  // When user clicks a conversion card in the grid, open file picker
  const handleGridConversionClick = useCallback((route: ConversionRoute) => {
    setPreselectedRoute(route);
    // Build accept filter for this conversion's input format
    const ext = `.${route.from}`;
    if (fileInputRef.current) {
      fileInputRef.current.accept = ext;
      fileInputRef.current.click();
    }
  }, []);

  const handleHiddenFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      if (e.target) e.target.value = '';
    },
    [handleFileSelect],
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
      reset();
      setCurrentFile(null);
    }
  }, [error, reset]);

  const needsFormatSelection =
    currentFile && state === 'idle' && getRoutesForFile(currentFile.name).length > 1;
  const showDropZone =
    !currentFile ||
    (state === 'idle' && !needsFormatSelection && getRoutesForFile(currentFile.name).length === 0);
  const showGrid = !currentFile && state === 'idle';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />

      {/* Hidden file input for grid card clicks */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleHiddenFileChange}
      />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {/* Hero header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 p-3.5 text-white shadow-lg shadow-blue-500/20">
            <ArrowRightLeft className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</p>

          {/* Conversion count badge */}
          {showGrid && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 dark:border-blue-900 dark:bg-blue-950/30">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t('conversionCount', { count: TOTAL_CONVERSIONS })}
              </span>
            </div>
          )}
        </div>

        {/* ── IDLE: Show full conversion grid + drop zone ── */}
        {showGrid && (
          <>
            {/* Drop zone at top */}
            <div className="mb-10 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  1
                </span>
                {t('stepAddFile')}
              </h3>
              <DropZone onFileSelect={handleFileSelect} />
            </div>

            {/* Separator */}
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('orChoose')}
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Full conversion grid */}
            <ConversionGrid onConversionClick={handleGridConversionClick} />
          </>
        )}

        {/* ── File selected but needs format choice ── */}
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

            <FormatSelector
              filename={currentFile.name}
              selectedFormat={selectedRoute?.to ?? null}
              onSelect={handleFormatSelect}
            />

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

        {/* ── Drop zone fallback for unsupported formats ── */}
        {showDropZone && currentFile && (
          <div className="space-y-3">
            <DropZone onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* ── Converting ── */}
        {state === 'converting' && currentFile && (
          <ConversionProgress
            filename={currentFile.name}
            isClientSide={mode === 'client'}
          />
        )}

        {/* ── Done ── */}
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
