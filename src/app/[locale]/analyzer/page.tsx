'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Brain, Upload, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { AnalysisResults } from '@/components/analyzer/AnalysisResults';
import { useAnalyzer } from '@/hooks/useAnalyzer';
import { useSession } from '@/hooks/useSession';

const ACCEPTED = '.pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.json,.md,.html';
const MAX_SIZE = 20 * 1024 * 1024;

export default function AnalyzerPage() {
  const t = useTranslations('analyzer');
  const { state, result, error, filename, analyze, reset } = useAnalyzer();
  const { sessionId, plan, isLoading } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isBusiness = plan === 'business';

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > MAX_SIZE) {
        toast.error(t('tooLarge'));
        return;
      }
      if (!sessionId) return;
      analyze(file, sessionId);
    },
    [sessionId, analyze, t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (e.target) e.target.value = '';
    },
    [handleFile],
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
      reset();
    }
  }, [error, reset]);

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-700">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Header />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFileInput}
      />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 p-3.5 text-white shadow-lg shadow-purple-500/20">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
        </div>

        {/* Business gate */}
        {!isBusiness && (
          <div className="mx-auto max-w-lg rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-10 text-center dark:border-purple-900 dark:bg-purple-950/20">
            <Lock className="mx-auto h-10 w-10 text-purple-400" />
            <p className="mt-4 text-sm font-medium text-purple-800 dark:text-purple-300">
              {t('businessOnly')}
            </p>
            <Link href="/pricing">
              <Button className="mt-4 bg-purple-600 text-white hover:bg-purple-700">
                {t('businessCta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Drop zone — Business only, idle state */}
        {isBusiness && state === 'idle' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mx-auto max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-purple-700'
            }`}
          >
            <Upload className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-300">
              {t('dropzone')}
            </p>
            <p className="mt-1.5 text-sm text-slate-500">{t('dropzoneFormats')}</p>
          </div>
        )}

        {/* Analyzing */}
        {state === 'analyzing' && (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('analyzing')}</p>
            <p className="mt-2 text-sm text-slate-500">{filename}</p>
            <div className="mx-auto mt-6 space-y-2">
              <Step label={t('stepExtract')} active />
              <Step label={t('stepAnalyze')} />
              <Step label={t('stepGenerate')} />
            </div>
          </div>
        )}

        {/* Results */}
        {state === 'done' && result && (
          <AnalysisResults result={result} filename={filename} onReset={reset} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function Step({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm ${
      active
        ? 'bg-purple-50 font-medium text-purple-700 dark:bg-purple-950/20 dark:text-purple-300'
        : 'text-slate-400'
    }`}>
      {active ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200 dark:border-slate-700" />
      )}
      {label}
    </div>
  );
}
