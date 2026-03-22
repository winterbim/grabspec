'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, Download, FileText, ImageIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadResultProps {
  readonly filename: string;
  readonly size: number;
  readonly onDownload: () => void;
  readonly duration?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFormatInfo(filename: string): { label: string; color: string; icon: 'doc' | 'img' } {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const map: Record<string, { label: string; color: string; icon: 'doc' | 'img' }> = {
    '.pdf': { label: 'PDF', color: '#EF4444', icon: 'doc' },
    '.doc': { label: 'DOC', color: '#3B82F6', icon: 'doc' },
    '.docx': { label: 'DOCX', color: '#3B82F6', icon: 'doc' },
    '.jpg': { label: 'JPG', color: '#F59E0B', icon: 'img' },
    '.jpeg': { label: 'JPEG', color: '#F59E0B', icon: 'img' },
    '.png': { label: 'PNG', color: '#10B981', icon: 'img' },
    '.webp': { label: 'WEBP', color: '#8B5CF6', icon: 'img' },
  };
  return map[ext] ?? { label: ext.replace('.', '').toUpperCase(), color: '#64748B', icon: 'doc' };
}

export function DownloadResult({ filename, size, onDownload, duration }: DownloadResultProps) {
  const t = useTranslations('converter');
  const format = getFormatInfo(filename);
  const Icon = format.icon === 'img' ? ImageIcon : FileText;

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-green-200 bg-white shadow-lg shadow-green-500/5 dark:border-green-900 dark:bg-slate-900">
      {/* Success gradient header */}
      <div className="flex items-center justify-center gap-3 bg-linear-to-r from-green-50 to-emerald-50 px-6 py-5 dark:from-green-950/30 dark:to-emerald-950/30">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('done')}</p>
          {duration !== undefined && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {duration < 1000 ? `${Math.round(duration)} ms` : `${(duration / 1000).toFixed(1)} s`}
            </p>
          )}
        </div>
      </div>

      {/* File info */}
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-700">
            <Icon className="h-5 w-5 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{filename}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: format.color + '15',
                  color: format.color,
                }}
              >
                {format.label}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-300" />
              <span className="text-xs text-slate-500">{formatFileSize(size)}</span>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          onClick={onDownload}
          className="w-full bg-green-600 text-white hover:bg-green-700"
        >
          <Download className="mr-2 h-5 w-5" data-icon="inline-start" />
          {t('downloadResult')}
        </Button>
      </div>
    </div>
  );
}
