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
  Combine,
  Scissors,
  Minimize2,
  RotateCw,
  FileOutput,
  Hash,
  ChevronLeft,
  Plus,
  Trash2,
  ArrowUpDown,
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
import type { LucideIcon } from 'lucide-react';

// ─── Types ───

type ActiveView =
  | { type: 'home' }
  | { type: 'convert' }
  | { type: 'merge' }
  | { type: 'split' }
  | { type: 'compress' }
  | { type: 'rotate' }
  | { type: 'extract' }
  | { type: 'number' };

interface PdfTool {
  id: ActiveView['type'];
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const PDF_TOOLS: PdfTool[] = [
  { id: 'merge', icon: Combine, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'split', icon: Scissors, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  { id: 'compress', icon: Minimize2, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  { id: 'rotate', icon: RotateCw, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
  { id: 'extract', icon: FileOutput, color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950/30' },
  { id: 'number', icon: Hash, color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800' },
];

// ─── Format color map ───

function formatColor(ext: string): string {
  const map: Record<string, string> = {
    pdf: '#EF4444', docx: '#3B82F6', doc: '#3B82F6',
    jpg: '#F59E0B', jpeg: '#F59E0B', png: '#10B981', webp: '#8B5CF6',
    svg: '#EC4899', gif: '#F97316', bmp: '#64748B', tiff: '#0EA5E9', tif: '#0EA5E9',
    avif: '#14B8A6', ico: '#6366F1',
    csv: '#16A34A', xlsx: '#16A34A', xls: '#16A34A', json: '#8B5CF6',
    txt: '#64748B', html: '#F97316', htm: '#F97316', md: '#64748B', tsv: '#64748B',
  };
  return map[ext] ?? '#64748B';
}

function FileTypeIcon({ category }: { category: string }) {
  if (category === 'image') return <ImageIcon className="h-5 w-5 text-emerald-500" />;
  if (category === 'spreadsheet') return <TableIcon className="h-5 w-5 text-green-500" />;
  return <FileText className="h-5 w-5 text-blue-500" />;
}

// ═══════════════════════════════════════════
// Main converter page
// ═══════════════════════════════════════════

export default function ConverterPage() {
  const t = useTranslations('converter');
  const { state, result, error, mode, convert, reset, download } = useConverter();
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' });
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ConversionRoute | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // PDF tools state
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [pdfToolResult, setPdfToolResult] = useState<{
    blob: Blob; filename: string; size: number; duration: number; pageCount?: number;
  } | null>(null);
  const [splitResults, setSplitResults] = useState<{
    blob: Blob; filename: string; size: number;
  }[] | null>(null);
  const [pdfToolWorking, setPdfToolWorking] = useState(false);
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [extractInput, setExtractInput] = useState('');

  // Available routes for the current file
  const availableRoutes = useMemo(() => {
    if (!currentFile) return [];
    return getRoutesForFile(currentFile.name);
  }, [currentFile]);

  const routeGroups = useMemo(() => {
    const groups: Record<string, ConversionRoute[]> = {};
    for (const route of availableRoutes) {
      if (!groups[route.category]) groups[route.category] = [];
      groups[route.category].push(route);
    }
    return groups;
  }, [availableRoutes]);

  // ── Convert flow ──

  const handleFileSelect = useCallback((file: File) => {
    setCurrentFile(file);
    setSelectedRoute(null);
    setCustomFilename('');
    setIsEditingName(false);
    setActiveView({ type: 'convert' });

    const routes = getRoutesForFile(file.name);
    if (routes.length === 1) {
      setSelectedRoute(routes[0]);
    }
  }, []);

  const handleFormatClick = useCallback((route: ConversionRoute) => {
    setSelectedRoute(route);
  }, []);

  const handleConvert = useCallback(() => {
    if (!currentFile || !selectedRoute) return;
    convert(currentFile, selectedRoute.outputMime ?? selectedRoute.to);
  }, [currentFile, selectedRoute, convert]);

  // Auto-convert when single route (documents: PDF→DOCX, DOCX→PDF)
  useEffect(() => {
    if (
      activeView.type === 'convert' &&
      currentFile &&
      availableRoutes.length === 1 &&
      state === 'idle' &&
      !isImageFile(currentFile)
    ) {
      const route = availableRoutes[0];
      setSelectedRoute(route);
      convert(currentFile, route.outputMime ?? route.to);
    }
  }, [activeView, currentFile, availableRoutes, state, convert]);

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
    setPdfToolResult(null);
    setSplitResults(null);
    setPdfToolWorking(false);
    setMergeFiles([]);
    setExtractInput('');
  }, [reset]);

  const goHome = useCallback(() => {
    handleReset();
    setActiveView({ type: 'home' });
  }, [handleReset]);

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
      // Reset converter state but keep the file and view so user can retry
      reset();
    }
  }, [error, reset]);

  // ── PDF tools handlers ──

  const handlePdfToolFile = useCallback((file: File) => {
    setCurrentFile(file);
  }, []);

  const handleMergeAdd = useCallback((file: File) => {
    setMergeFiles((prev) => [...prev, file]);
  }, []);

  const handleMergeMultiple = useCallback((files: File[]) => {
    setMergeFiles((prev) => [...prev, ...files]);
  }, []);

  const runPdfTool = useCallback(async () => {
    setPdfToolWorking(true);
    setPdfToolResult(null);
    setSplitResults(null);

    try {
      const tools = await import('@/lib/pdf-tools');

      switch (activeView.type) {
        case 'merge': {
          if (mergeFiles.length < 2) {
            toast.error('Ajoutez au moins 2 fichiers PDF');
            setPdfToolWorking(false);
            return;
          }
          const r = await tools.mergePdfs(mergeFiles);
          setPdfToolResult(r);
          break;
        }
        case 'split': {
          if (!currentFile) return;
          const results = await tools.splitPdf(currentFile);
          setSplitResults(results.map((r) => ({ blob: r.blob, filename: r.filename, size: r.size })));
          break;
        }
        case 'compress': {
          if (!currentFile) return;
          const r = await tools.compressPdf(currentFile);
          setPdfToolResult(r);
          break;
        }
        case 'rotate': {
          if (!currentFile) return;
          const r = await tools.rotatePdf(currentFile, rotateAngle);
          setPdfToolResult(r);
          break;
        }
        case 'extract': {
          if (!currentFile || !extractInput.trim()) return;
          const pages = parsePageRange(extractInput, 1000);
          if (pages.length === 0) {
            toast.error('Entrez des numéros de page valides (ex: 1,3,5-8)');
            setPdfToolWorking(false);
            return;
          }
          const r = await tools.extractPages(currentFile, pages);
          setPdfToolResult(r);
          break;
        }
        case 'number': {
          if (!currentFile) return;
          const r = await tools.addPageNumbers(currentFile);
          setPdfToolResult(r);
          break;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du traitement');
    } finally {
      setPdfToolWorking(false);
    }
  }, [activeView, currentFile, mergeFiles, rotateAngle, extractInput]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Back button when in a tool view */}
        {activeView.type !== 'home' && (
          <button
            onClick={goHome}
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('convertAnother')}
          </button>
        )}

        {/* ═══ HOME VIEW — Tool hub ═══ */}
        {activeView.type === 'home' && (
          <>
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

            {/* Drop zone — universal entry point */}
            <div className="mb-10">
              <DropZone onFileSelect={handleFileSelect} />
            </div>

            {/* PDF Tools grid */}
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  {t('pdfTools')}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PDF_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveView({ type: tool.id as ActiveView['type'] })}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.bgColor}`}>
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {t(`tool_${tool.id}`)}
                        </p>
                        <p className="text-[11px] text-slate-400">{t(`tool_${tool.id}_desc`)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-3">
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
          </>
        )}

        {/* ═══ CONVERT VIEW — File conversion ═══ */}
        {activeView.type === 'convert' && (
          <>
            {/* IDLE: no file — show dropzone fallback */}
            {state === 'idle' && !currentFile && (
              <DropZone onFileSelect={handleFileSelect} />
            )}

            {/* IDLE: file selected, choose format */}
            {state === 'idle' && currentFile && availableRoutes.length > 1 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {/* File info */}
                <div className="flex items-center gap-4">
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
                  <button onClick={goHome} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Format choices */}
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
                            {t(category === 'document' ? 'categoryDocument' : category === 'spreadsheet' ? 'categorySpreadsheet' : 'categoryImage')}
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
                              className={`group flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white ${isSelected ? 'bg-white/20' : ''}`}
                                style={isSelected ? undefined : { backgroundColor: formatColor(route.to) }}
                              >
                                {isSelected ? <Check className="h-3.5 w-3.5" /> : route.to.toUpperCase().slice(0, 3)}
                              </span>
                              <span>.{route.to.toUpperCase()}</span>
                              {route.clientSide && (
                                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
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
                    <Button size="lg" onClick={handleConvert} className="w-full bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700">
                      <ArrowRightLeft className="mr-2 h-5 w-5" />
                      {fileExt.toUpperCase()} → {selectedRoute.to.toUpperCase()}
                    </Button>
                    {selectedRoute.clientSide && (
                      <p className="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400">⚡ {t('clientSide')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* IDLE: unsupported format */}
            {state === 'idle' && currentFile && availableRoutes.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Format .{fileExt.toUpperCase()} non supporté
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={goHome}>{t('convertAnother')}</Button>
              </div>
            )}

            {/* CONVERTING */}
            {state === 'converting' && currentFile && (
              <ConversionProgress filename={currentFile.name} isClientSide={mode === 'client'} />
            )}

            {/* DONE */}
            {state === 'done' && result && (
              <ResultCard
                result={result}
                customFilename={customFilename}
                isEditingName={isEditingName}
                nameInputRef={nameInputRef}
                onCustomFilenameChange={setCustomFilename}
                onEditName={handleEditName}
                onStopEdit={() => setIsEditingName(false)}
                onDownload={handleDownload}
                onReset={goHome}
                t={t}
              />
            )}
          </>
        )}

        {/* ═══ PDF TOOL VIEWS ═══ */}

        {/* MERGE */}
        {activeView.type === 'merge' && !pdfToolResult && (
          <PdfToolView
            icon={Combine}
            title={t('tool_merge')}
            desc={t('tool_merge_desc')}
            color="blue"
          >
            <DropZone onFileSelect={handleMergeAdd} onMultipleFiles={handleMergeMultiple} accept={['.pdf']} multiple />
            {mergeFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {mergeFiles.length} fichier(s)
                </p>
                {mergeFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                      <FileText className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">{f.name}</span>
                    <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => setMergeFiles((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {i > 0 && (
                      <button onClick={() => {
                        setMergeFiles((prev) => {
                          const arr = [...prev];
                          [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                          return arr;
                        });
                      }} className="text-slate-400 hover:text-blue-500">
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button size="lg" onClick={runPdfTool} disabled={mergeFiles.length < 2 || pdfToolWorking} className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700">
                  <Combine className="mr-2 h-5 w-5" />
                  {pdfToolWorking ? 'Fusion en cours...' : `Fusionner ${mergeFiles.length} PDFs`}
                </Button>
              </div>
            )}
          </PdfToolView>
        )}

        {/* SPLIT */}
        {activeView.type === 'split' && !splitResults && (
          <PdfToolView icon={Scissors} title={t('tool_split')} desc={t('tool_split_desc')} color="purple">
            {!currentFile ? (
              <DropZone onFileSelect={handlePdfToolFile} accept={['.pdf']} />
            ) : (
              <div className="space-y-4">
                <FileCard name={currentFile.name} size={currentFile.size} onRemove={() => setCurrentFile(null)} />
                <Button size="lg" onClick={runPdfTool} disabled={pdfToolWorking} className="w-full bg-purple-600 text-white hover:bg-purple-700">
                  <Scissors className="mr-2 h-5 w-5" />
                  {pdfToolWorking ? 'Division en cours...' : 'Diviser en pages individuelles'}
                </Button>
              </div>
            )}
          </PdfToolView>
        )}

        {/* COMPRESS */}
        {activeView.type === 'compress' && !pdfToolResult && (
          <PdfToolView icon={Minimize2} title={t('tool_compress')} desc={t('tool_compress_desc')} color="green">
            {!currentFile ? (
              <DropZone onFileSelect={handlePdfToolFile} accept={['.pdf']} />
            ) : (
              <div className="space-y-4">
                <FileCard name={currentFile.name} size={currentFile.size} onRemove={() => setCurrentFile(null)} />
                <Button size="lg" onClick={runPdfTool} disabled={pdfToolWorking} className="w-full bg-green-600 text-white hover:bg-green-700">
                  <Minimize2 className="mr-2 h-5 w-5" />
                  {pdfToolWorking ? 'Compression...' : 'Compresser le PDF'}
                </Button>
              </div>
            )}
          </PdfToolView>
        )}

        {/* ROTATE */}
        {activeView.type === 'rotate' && !pdfToolResult && (
          <PdfToolView icon={RotateCw} title={t('tool_rotate')} desc={t('tool_rotate_desc')} color="orange">
            {!currentFile ? (
              <DropZone onFileSelect={handlePdfToolFile} accept={['.pdf']} />
            ) : (
              <div className="space-y-4">
                <FileCard name={currentFile.name} size={currentFile.size} onRemove={() => setCurrentFile(null)} />
                <div className="flex gap-2">
                  {([90, 180, 270] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setRotateAngle(a)}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                        rotateAngle === a
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {a}°
                    </button>
                  ))}
                </div>
                <Button size="lg" onClick={runPdfTool} disabled={pdfToolWorking} className="w-full bg-orange-600 text-white hover:bg-orange-700">
                  <RotateCw className="mr-2 h-5 w-5" />
                  {pdfToolWorking ? 'Rotation...' : `Rotation ${rotateAngle}°`}
                </Button>
              </div>
            )}
          </PdfToolView>
        )}

        {/* EXTRACT */}
        {activeView.type === 'extract' && !pdfToolResult && (
          <PdfToolView icon={FileOutput} title={t('tool_extract')} desc={t('tool_extract_desc')} color="teal">
            {!currentFile ? (
              <DropZone onFileSelect={handlePdfToolFile} accept={['.pdf']} />
            ) : (
              <div className="space-y-4">
                <FileCard name={currentFile.name} size={currentFile.size} onRemove={() => setCurrentFile(null)} />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Pages à extraire
                  </label>
                  <input
                    type="text"
                    value={extractInput}
                    onChange={(e) => setExtractInput(e.target.value)}
                    placeholder="Ex: 1,3,5-8"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <Button size="lg" onClick={runPdfTool} disabled={pdfToolWorking || !extractInput.trim()} className="w-full bg-teal-600 text-white hover:bg-teal-700">
                  <FileOutput className="mr-2 h-5 w-5" />
                  {pdfToolWorking ? 'Extraction...' : 'Extraire les pages'}
                </Button>
              </div>
            )}
          </PdfToolView>
        )}

        {/* NUMBER */}
        {activeView.type === 'number' && !pdfToolResult && (
          <PdfToolView icon={Hash} title={t('tool_number')} desc={t('tool_number_desc')} color="slate">
            {!currentFile ? (
              <DropZone onFileSelect={handlePdfToolFile} accept={['.pdf']} />
            ) : (
              <div className="space-y-4">
                <FileCard name={currentFile.name} size={currentFile.size} onRemove={() => setCurrentFile(null)} />
                <Button size="lg" onClick={runPdfTool} disabled={pdfToolWorking} className="w-full bg-slate-700 text-white hover:bg-slate-800">
                  <Hash className="mr-2 h-5 w-5" />
                  {pdfToolWorking ? 'Numérotation...' : 'Ajouter les numéros de page'}
                </Button>
              </div>
            )}
          </PdfToolView>
        )}

        {/* ═══ PDF Tool Results ═══ */}

        {pdfToolResult && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('done')}</p>
                  <p className="text-xs text-slate-500">
                    {Math.round(pdfToolResult.duration)} ms
                    {pdfToolResult.pageCount !== undefined && ` · ${pdfToolResult.pageCount} pages`}
                    {' · '}
                    {pdfToolResult.size < 1024 * 1024
                      ? `${(pdfToolResult.size / 1024).toFixed(1)} KB`
                      : `${(pdfToolResult.size / (1024 * 1024)).toFixed(1)} MB`}
                    {currentFile && activeView.type === 'compress' && (
                      <span className="ml-2 font-semibold text-emerald-600">
                        ({Math.round((1 - pdfToolResult.size / currentFile.size) * 100)}% réduit)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => downloadBlob(pdfToolResult.blob, pdfToolResult.filename)}
                className="w-full bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
              >
                <Download className="mr-2 h-5 w-5" />
                {t('downloadResult')}
              </Button>
            </div>
            <div className="text-center">
              <Button variant="ghost" onClick={goHome} className="gap-2">
                <RotateCcw className="h-4 w-4" /> {t('convertAnother')}
              </Button>
            </div>
          </div>
        )}

        {splitResults && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {splitResults.length} pages extraites
                </p>
              </div>
              <div className="space-y-2">
                {splitResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">{r.filename}</span>
                    <span className="text-xs text-slate-400">{(r.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={() => downloadBlob(r.blob, r.filename)}
                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <Button variant="ghost" onClick={goHome} className="gap-2">
                <RotateCcw className="h-4 w-4" /> {t('convertAnother')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── Reusable sub-components ───

function PdfToolView({
  icon: Icon,
  title,
  desc,
  color,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    green: 'from-green-500 to-green-600 shadow-green-500/20',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/20',
    teal: 'from-teal-500 to-teal-600 shadow-teal-500/20',
    slate: 'from-slate-500 to-slate-600 shadow-slate-500/20',
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className={`mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${colorMap[color] ?? colorMap.blue} p-3.5 text-white shadow-lg`}>
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function FileCard({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  const sizeStr = size < 1024 * 1024
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
        <FileText className="h-5 w-5 text-red-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</p>
        <p className="text-xs text-slate-500">{sizeStr}</p>
      </div>
      <button onClick={onRemove} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ResultCard({
  result,
  customFilename,
  isEditingName,
  nameInputRef,
  onCustomFilenameChange,
  onEditName,
  onStopEdit,
  onDownload,
  onReset,
  t,
}: {
  result: { blob: Blob; filename: string; size: number; duration?: number };
  customFilename: string;
  isEditingName: boolean;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onCustomFilenameChange: (v: string) => void;
  onEditName: () => void;
  onStopEdit: () => void;
  onDownload: () => void;
  onReset: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('done')}</p>
            {result.duration !== undefined && (
              <p className="text-xs text-slate-500">
                {result.duration < 1000 ? `${Math.round(result.duration)} ms` : `${(result.duration / 1000).toFixed(1)} s`}
                {' · '}
                {result.size < 1024 * 1024 ? `${(result.size / 1024).toFixed(1)} KB` : `${(result.size / (1024 * 1024)).toFixed(1)} MB`}
              </p>
            )}
          </div>
        </div>

        {/* Rename */}
        <div className="mb-5">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Pencil className="h-3 w-3" />
            {t('renameLabel')}
          </label>
          <div className="flex items-stretch rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={customFilename}
                onChange={(e) => onCustomFilenameChange(e.target.value)}
                onBlur={onStopEdit}
                onKeyDown={(e) => e.key === 'Enter' && onStopEdit()}
                className="min-w-0 flex-1 border-none bg-transparent px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:text-slate-200"
                spellCheck={false}
              />
            ) : (
              <button onClick={onEditName} className="flex min-w-0 flex-1 items-center px-3 py-2.5 text-left">
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

        <Button size="lg" onClick={onDownload} className="w-full bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">
          <Download className="mr-2 h-5 w-5" />
          {t('downloadResult')}
        </Button>
      </div>
      <div className="text-center">
        <Button variant="ghost" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> {t('convertAnother')}
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ───

function parsePageRange(input: string, maxPage: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(',').map((s) => s.trim());

  for (const part of parts) {
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = Math.max(1, start); i <= Math.min(end, maxPage); i++) {
        pages.add(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPage) {
        pages.add(num);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
