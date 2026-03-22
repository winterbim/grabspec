'use client';

import { useTranslations } from 'next-intl';
import { Loader2, FileText, ImageIcon } from 'lucide-react';

interface ConversionProgressProps {
  readonly filename: string;
  /** 0-100 for determinate, undefined for indeterminate */
  readonly progress?: number;
  /** Whether this is a client-side (instant) conversion */
  readonly isClientSide?: boolean;
}

function getFileIcon(filename: string) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext)) {
    return <ImageIcon className="h-5 w-5" />;
  }
  return <FileText className="h-5 w-5" />;
}

function getFormatBadge(filename: string): { label: string; color: string } {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const map: Record<string, { label: string; color: string }> = {
    '.pdf': { label: 'PDF', color: '#EF4444' },
    '.doc': { label: 'DOC', color: '#3B82F6' },
    '.docx': { label: 'DOCX', color: '#3B82F6' },
    '.jpg': { label: 'JPG', color: '#F59E0B' },
    '.jpeg': { label: 'JPEG', color: '#F59E0B' },
    '.png': { label: 'PNG', color: '#10B981' },
    '.webp': { label: 'WEBP', color: '#8B5CF6' },
    '.bmp': { label: 'BMP', color: '#64748B' },
    '.gif': { label: 'GIF', color: '#EC4899' },
  };
  return map[ext] ?? { label: ext.replace('.', '').toUpperCase(), color: '#64748B' };
}

export function ConversionProgress({ filename, progress, isClientSide }: ConversionProgressProps) {
  const t = useTranslations('converter');
  const badge = getFormatBadge(filename);
  const isDeterminate = progress !== undefined && progress >= 0;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-lg shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900">
      {/* Spinning loader */}
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>

      {/* Progress bar with shimmer */}
      <div className="w-full max-w-md">
        {isDeterminate ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{t('converting')}</span>
              <span className="text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="progress-shimmer h-full rounded-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-xs text-slate-500">{t('converting')}</span>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="progress-indeterminate bg-linear-to-r from-blue-500 to-blue-400" />
            </div>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          {getFileIcon(filename)}
        </div>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: badge.color + '15',
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
        <p className="max-w-50 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
          {filename}
        </p>
      </div>

      {isClientSide && (
        <p className="text-xs text-slate-400">{t('clientSide')}</p>
      )}
    </div>
  );
}
