'use client';

import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowRightLeft,
  FileText,
  ImageIcon,
  Zap,
  Shield,
  Sparkles,
  X,
  Download,
  RotateCcw,
  CheckCircle2,
  TableIcon,
  Pencil,
  Check,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DropZone } from '@/components/converter/DropZone';
import { ConversionProgress } from '@/components/converter/ConversionProgress';
import {
  getRoutesForFile,
  TOTAL_CONVERSIONS,
  type ConversionRoute,
} from '@/components/converter/FormatSelector';
import { Button } from '@/components/ui/button';
import { useConverter } from '@/hooks/useConverter';
import { isImageFile } from '@/lib/image-converter';

/** File type icon based on category */
function FileTypeIcon({ category }: { category: string }) {
  if (category === 'image') return <ImageIcon className="h-5 w-5 text-emerald-500" />;
  if (category === 'spreadsheet') return <TableIcon className="h-5 w-5 text-green-500" />;
  return <FileText className="h-5 w-5 text-blue-500" />;
}

/** Format badge color map */
function formatColor(ext: string): string {
  const map: Record<string, string> = {
    pdf: '#EF4444', docx: '#3B82F6', doc: '#3B82F6',
    jpg: '#F59E0B', jpeg: '#F59E0B', png: '#10B981', webp: '#8B5CF6',
    svg: '#EC4899', gif: '#F97316', bmp: '#64748B', tiff: '#0EA5E9', tif: '#0EA5E9',
    avif: '#14B8A6', ico: '#6366F1',
    csv: '#16A34A', xlsx: '#16A34A', xls: '#16A34A', json: '#8B5CF6',
    txt: '#64748B', html: '#F97316', htm: '#F97316', md: '#64748B',
    tsv: '#64748B',
  };
  return map[ext] ?? '#64748B';
}

export default function ConverterPage() {
  const t = useTranslations('converter');
  const { state, result, error, mode, convert, reset, download } = useConverter();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ConversionRoute | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Available routes for the current file
  const availableRoutes = useMemo(() => {
    if (!currentFile) return [];
    return getRoutesForFile(currentFile.name);
  }, [currentFile]);

  // Group routes by category
  const routeGroups = useMemo(() => {
    const groups: Record<string, ConversionRoute[]> = {};
    for (const route of availableRoutes) {
      if (!groups[route.category]) groups[route.category] = [];
      groups[route.category].push(route);
    }
    return groups;
  }, [availableRoutes]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setCurrentFile(file);
    setSelectedRoute(null);
    setCustomFilename('');
    setIsEditingName(false);

    const routes = getRoutesForFile(file.name);

    // Single target → auto-select it
    if (routes.length === 1) {
      setSelectedRoute(routes[0]);
    }
  }, []);

  // Handle format button click → select + auto-convert
  const handleFormatClick = useCallback((route: ConversionRoute) => {
    setSelectedRoute(route);
  }, []);

  // Handle convert
  const handleConvert = useCallback(() => {
    if (!currentFile || !selectedRoute) return;
    convert(currentFile, selectedRoute.outputMime ?? selectedRoute.to);
  }, [currentFile, selectedRoute, convert]);

  // Auto-convert when single route (documents)
  useEffect(() => {
    if (currentFile && availableRoutes.length === 1 && state === 'idle' && !isImageFile(currentFile)) {
      const route = availableRoutes[0];
      setSelectedRoute(route);
      convert(currentFile, route.outputMime ?? route.to);
    }
  }, [currentFile, availableRoutes, state, convert]);

  // Set default filename when result arrives
  useEffect(() => {
    if (result && !customFilename) {
      setCustomFilename(result.filename.replace(/\.[^.]+$/, ''));
    }
  }, [result, customFilename]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setSelectedRoute(null);
    setCustomFilename('');
    setIsEditingName(false);
  }, [reset]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const ext = result.filename.slice(result.filename.lastIndexOf('.'));
    const name = customFilename ? `${customFilename}${ext}` : result.filename;
    download(name);
  }, [result, customFilename, download]);

  const handleEditName = useCallback(() => {
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      reset();
      setCurrentFile(null);
    }
  }, [error, reset]);

  // File info
  const fileExt = currentFile
    ? currentFile.name.slice(currentFile.name.lastIndexOf('.') + 1).toLowerCase()
    : '';
  const fileSize = currentFile
    ? currentFile.size < 1024 * 1024
      ? `${(currentFile.size / 1024).toFixed(1)} KB`
      : `${(currentFile.size / (1024 * 1024)).toFixed(1)} MB`
    : '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3.5 text-white shadow-lg shadow-blue-500/20">
            <ArrowRightLeft className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            {t('subtitle')}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 dark:border-blue-900 dark:bg-blue-950/30">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t('conversionCount', { count: TOTAL_CONVERSIONS })}
            </span>
          </div>
        </div>

        {/* ═══ STATE: IDLE — Show DropZone ═══ */}
        {state === 'idle' && !currentFile && (
          <DropZone onFileSelect={handleFileSelect} />
        )}

        {/* ═══ STATE: File selected — Show file + output choices ═══ */}
        {state === 'idle' && currentFile && availableRoutes.length > 0 && (
          <div className="space-y-6">
            {/* File card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                {/* File type badge */}
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: formatColor(fileExt) }}
                >
                  <span className="text-xs font-bold">{fileExt.toUpperCase()}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {currentFile.name}
                  </p>
                  <p className="text-xs text-slate-500">{fileSize}</p>
                </div>

                <button
                  onClick={handleReset}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Output format choices */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('chooseFormat')}
                </p>

                {Object.entries(routeGroups).map(([category, routes]) => (
                  <div key={category} className="mb-3 last:mb-0">
                    {Object.keys(routeGroups).length > 1 && (
                      <div className="mb-2 flex items-center gap-1.5">
                        <FileTypeIcon category={category} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {t(
                            category === 'document'
                              ? 'categoryDocument'
                              : category === 'spreadsheet'
                                ? 'categorySpreadsheet'
                                : 'categoryImage',
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {routes.map((route) => {
                        const isSelected = selectedRoute?.to === route.to;
                        return (
                          <button
                            key={`${route.from}-${route.to}`}
                            onClick={() => handleFormatClick(route)}
                            className={`group relative flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600'
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white ${
                                isSelected ? 'bg-white/20' : ''
                              }`}
                              style={isSelected ? undefined : { backgroundColor: formatColor(route.to) }}
                            >
                              {isSelected ? <Check className="h-3.5 w-3.5" /> : route.to.toUpperCase().slice(0, 3)}
                            </span>
                            <span>.{route.to.toUpperCase()}</span>
                            {route.clientSide && (
                              <span
                                className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}
                              >
                                ⚡
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Convert button */}
              {selectedRoute && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <Button
                    size="lg"
                    onClick={handleConvert}
                    className="w-full bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                  >
                    <ArrowRightLeft className="mr-2 h-5 w-5" />
                    {fileExt.toUpperCase()} → {selectedRoute.to.toUpperCase()}
                  </Button>
                  {selectedRoute.clientSide && (
                    <p className="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400">
                      ⚡ {t('clientSide')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STATE: File unsupported ═══ */}
        {state === 'idle' && currentFile && availableRoutes.length === 0 && (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Format .{fileExt.toUpperCase()} non supporté
              </p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={handleReset}>
                {t('convertAnother')}
              </Button>
            </div>
          </div>
        )}

        {/* ═══ STATE: Converting ═══ */}
        {state === 'converting' && currentFile && (
          <ConversionProgress
            filename={currentFile.name}
            isClientSide={mode === 'client'}
          />
        )}

        {/* ═══ STATE: Done — Result with rename ═══ */}
        {state === 'done' && result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
              {/* Success header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {t('done')}
                  </p>
                  {result.duration !== undefined && (
                    <p className="text-xs text-slate-500">
                      {result.duration < 1000
                        ? `${Math.round(result.duration)} ms`
                        : `${(result.duration / 1000).toFixed(1)} s`}
                      {' · '}
                      {result.size < 1024 * 1024
                        ? `${(result.size / 1024).toFixed(1)} KB`
                        : `${(result.size / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  )}
                </div>
              </div>

              {/* Rename field */}
              <div className="mb-5">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Pencil className="h-3 w-3" />
                  {t('renameLabel')}
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    {isEditingName ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                        className="min-w-0 flex-1 border-none bg-transparent px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:text-slate-200"
                        spellCheck={false}
                      />
                    ) : (
                      <button
                        onClick={handleEditName}
                        className="flex min-w-0 flex-1 items-center px-3 py-2.5 text-left"
                      >
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {customFilename || result.filename.replace(/\.[^.]+$/, '')}
                        </span>
                      </button>
                    )}
                    <span className="shrink-0 border-l border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                      {result.filename.slice(result.filename.lastIndexOf('.'))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download button */}
              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
              >
                <Download className="mr-2 h-5 w-5" />
                {t('downloadResult')}
              </Button>
            </div>

            {/* Convert another */}
            <div className="text-center">
              <Button variant="ghost" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {t('convertAnother')}
              </Button>
            </div>
          </div>
        )}

        {/* Features grid */}
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

        {/* Cross-sell */}
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
