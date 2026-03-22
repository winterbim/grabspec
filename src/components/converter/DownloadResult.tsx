'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Download, FileText, ImageIcon, ArrowRight, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadResultProps {
  readonly filename: string;
  readonly size: number;
  readonly onDownload: (customFilename: string) => void;
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

/** Split filename into base name and extension */
function splitFilename(filename: string): { baseName: string; ext: string } {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) return { baseName: filename, ext: '' };
  return {
    baseName: filename.slice(0, dotIndex),
    ext: filename.slice(dotIndex),
  };
}

export function DownloadResult({ filename, size, onDownload, duration }: DownloadResultProps) {
  const t = useTranslations('converter');
  const format = getFormatInfo(filename);
  const Icon = format.icon === 'img' ? ImageIcon : FileText;

  const { baseName, ext } = splitFilename(filename);
  const [customName, setCustomName] = useState(baseName);
  const [isEditing, setIsEditing] = useState(false);

  const handleDownload = useCallback(() => {
    const finalName = customName.trim() || baseName;
    onDownload(`${finalName}${ext}`);
  }, [customName, baseName, ext, onDownload]);

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

      {/* File info + rename */}
      <div className="space-y-4 px-6 py-5">
        {/* Editable filename */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <PenLine className="h-3 w-3" />
              {t('renameLabel')}
            </label>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-blue-500 hover:text-blue-600"
              >
                {t('renameEdit')}
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/30 dark:border-blue-800 dark:bg-slate-800">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none dark:text-slate-200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditing(false);
                    handleDownload();
                  }
                }}
                onBlur={() => setIsEditing(false)}
              />
              <span className="shrink-0 text-sm font-medium text-slate-400">{ext}</span>
            </div>
          ) : (
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-900"
              onClick={() => setIsEditing(true)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-700">
                <Icon className="h-5 w-5 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {customName}{ext}
                </p>
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
            </button>
          )}
        </div>

        <Button
          size="lg"
          onClick={handleDownload}
          className="w-full bg-green-600 text-white hover:bg-green-700"
        >
          <Download className="mr-2 h-5 w-5" data-icon="inline-start" />
          {t('downloadResult')}
        </Button>
      </div>
    </div>
  );
}
