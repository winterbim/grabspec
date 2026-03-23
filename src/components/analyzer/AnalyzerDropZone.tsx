'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCEPTED = '.pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt';
const MAX_SIZE = 20 * 1024 * 1024;

interface AnalyzerDropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnalyzerDropZone({ onFile, disabled }: AnalyzerDropZoneProps) {
  const t = useTranslations('analyzer');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > MAX_SIZE) {
        setError(t('tooLarge'));
        return;
      }
      setSelectedFile(file);
      onFile(file);
    },
    [onFile, t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (e.target) e.target.value = '';
    },
    [handleFile],
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  // File preview state
  if (selectedFile && !error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500">
              {formatSize(selectedFile.size)}
            </p>
          </div>
          {!disabled && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={removeFile}
              aria-label={t('removeFile')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFileInput}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) fileInputRef.current?.click();
          }
        }}
        aria-label={t('dropzone')}
        className={`mx-auto max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
            : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-purple-700 dark:hover:bg-slate-800/50'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <Upload className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-300">
          {t('dropzone')}
        </p>
        <p className="mt-1.5 text-sm text-slate-500">{t('dropzoneFormats')}</p>
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </>
  );
}
