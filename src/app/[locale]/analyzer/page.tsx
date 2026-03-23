'use client';

import { useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { FileSearch, Loader2, RotateCcw, FileText, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { AnalyzerDropZone } from '@/components/analyzer/AnalyzerDropZone';
import { ReferenceTable } from '@/components/analyzer/ReferenceTable';
import { useAnalyzer } from '@/hooks/useAnalyzer';

export default function AnalyzerPage() {
  const t = useTranslations('analyzer');
  const router = useRouter();
  const { state, result, error, filename, analyze, reset } = useAnalyzer();

  useEffect(() => {
    if (error) {
      toast.error(t(error as 'tooLarge' | 'unsupportedFormat') || error);
    }
  }, [error, t]);

  const handleFile = useCallback(
    (file: File) => {
      analyze(file);
    },
    [analyze],
  );

  const handleSearchSelected = useCallback(
    (refs: string[]) => {
      const encoded = encodeURIComponent(refs.join('\n'));
      router.push(`/finder?refs=${encoded}`);
    },
    [router],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 p-3.5 text-white shadow-lg shadow-purple-500/20">
            <FileSearch className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Drop zone — idle or error state */}
        {(state === 'idle' || state === 'error') && (
          <AnalyzerDropZone onFile={handleFile} disabled={false} />
        )}

        {/* Parsing / extracting */}
        {(state === 'parsing' || state === 'extracting') && (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {t('parsing')}
            </p>
            <p className="mt-2 text-sm text-slate-500">{filename}</p>
            <div className="mx-auto mt-6 space-y-2">
              <Step
                label={t('stepRead')}
                active={state === 'parsing'}
                done={state === 'extracting'}
              />
              <Step
                label={t('stepExtract')}
                active={state === 'extracting'}
                done={false}
              />
              <Step label={t('stepMatch')} active={false} done={false} />
            </div>
          </div>
        )}

        {/* Results */}
        {state === 'done' && result && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span>{filename}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t('parseTime', { time: result.parseTimeMs })}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {t('analyzeAnother')}
              </Button>
            </div>

            {result.references.length > 0 ? (
              <ReferenceTable
                references={result.references}
                onSearchSelected={handleSearchSelected}
              />
            ) : (
              /* Empty state */
              <div className="mx-auto max-w-lg rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
                <FileSearch className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-300">
                  {t('noReferences')}
                </p>
                <p className="mt-2 text-sm text-slate-500">{t('noReferencesHelp')}</p>
                <Button variant="outline" className="mt-6" onClick={reset}>
                  {t('tryAnother')}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────

function Step(props: Readonly<{ label: string; active: boolean; done: boolean }>) {
  const { label, active, done } = props;

  let colorClass = 'text-slate-400';
  if (active) colorClass = 'bg-purple-50 font-medium text-purple-700 dark:bg-purple-950/20 dark:text-purple-300';
  else if (done) colorClass = 'text-emerald-600 dark:text-emerald-400';

  let icon: React.ReactNode = (
    <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200 dark:border-slate-700" />
  );
  if (active) icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  else if (done) icon = <div className="h-3.5 w-3.5 rounded-full bg-emerald-500" />;

  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm ${colorClass}`}>
      {icon}
      {label}
    </div>
  );
}
