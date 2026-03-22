'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_EXTENSIONS = [
  '.pdf', '.doc', '.docx',
  '.xlsx', '.xls', '.csv', '.tsv',
  '.txt', '.html', '.htm', '.md', '.json',
  '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff', '.tif', '.svg', '.ico', '.avif',
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

/** Format badges with colors */
const FORMAT_BADGES: { label: string; color: string }[] = [
  { label: 'PDF', color: '#EF4444' },
  { label: 'DOCX', color: '#3B82F6' },
  { label: 'XLSX', color: '#16A34A' },
  { label: 'CSV', color: '#64748B' },
  { label: 'JSON', color: '#8B5CF6' },
  { label: 'TXT', color: '#78716C' },
  { label: 'HTML', color: '#F97316' },
  { label: 'MD', color: '#0EA5E9' },
  { label: 'JPG', color: '#F59E0B' },
  { label: 'PNG', color: '#10B981' },
  { label: 'WEBP', color: '#8B5CF6' },
  { label: 'SVG', color: '#EC4899' },
];

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function DropZone({ onFileSelect }: DropZoneProps) {
  const t = useTranslations('converter');
  const [isDragOver, setIsDragOver] = useState(false);
  const [glowPos, setGlowPos] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const pasteShortcut = isMacPlatform() ? '\u2318V' : 'Ctrl+V';

  const validateAndSelect = useCallback(
    (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) return;
      if (file.size > MAX_SIZE_BYTES) return;
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setGlowPos(null);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (zoneRef.current) {
      const rect = zoneRef.current.getBoundingClientRect();
      setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (zoneRef.current && (related === null || !zoneRef.current.contains(related))) {
      setIsDragOver(false);
      setGlowPos(null);
    }
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [validateAndSelect],
  );

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        validateAndSelect(files[0]);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [validateAndSelect]);

  const glowStyle = isDragOver && glowPos
    ? { background: `radial-gradient(400px circle at ${glowPos.x}px ${glowPos.y}px, rgba(59,130,246,0.18) 0%, transparent 70%)` }
    : undefined;

  return (
    <div
      ref={zoneRef}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'relative min-h-80 cursor-pointer select-none overflow-hidden transition-all duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isDragOver
          ? 'drop-zone-border-active bg-blue-50/50 scale-[1.01] shadow-2xl shadow-blue-500/10 dark:bg-blue-950/20'
          : 'drop-zone-border bg-white hover:bg-slate-50/50 hover:shadow-xl hover:shadow-black/5 dark:bg-slate-900/50 dark:hover:bg-slate-800/50',
      )}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 animate-glow-pulse"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Radial glow following cursor during drag */}
      {isDragOver && glowStyle && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-150"
          style={glowStyle}
          aria-hidden="true"
        />
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleChange}
        className="hidden"
        aria-label={t('dropzone')}
      />

      <div className="relative flex flex-col items-center justify-center gap-6 px-8 py-14">
        {/* Animated icon */}
        <div
          className={cn(
            'relative flex h-24 w-24 items-center justify-center rounded-3xl transition-all duration-300',
            isDragOver
              ? 'scale-110 bg-blue-100 text-blue-500 dark:bg-blue-900/40'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
          )}
        >
          {isDragOver ? (
            <FileUp className="h-10 w-10 animate-bounce" />
          ) : (
            <Upload className="h-10 w-10 transition-transform duration-200" />
          )}

          {/* Sparkle decorations when dragging */}
          {isDragOver && (
            <>
              <Sparkles className="absolute -right-2 -top-2 h-4.5 w-4.5 animate-pulse text-blue-500" />
              <Sparkles
                className="absolute -bottom-1 -left-2 h-3 w-3 animate-pulse text-blue-400/60"
                style={{ animationDelay: '300ms' }}
              />
              <Sparkles
                className="absolute -left-3 top-0 h-3.5 w-3.5 animate-pulse text-blue-400/40"
                style={{ animationDelay: '600ms' }}
              />
            </>
          )}
        </div>

        {/* Title & subtitle */}
        <div className="space-y-2 text-center">
          {isDragOver ? (
            <p className="animate-pulse text-xl font-semibold text-blue-500">
              {t('dropzoneDrop')}
            </p>
          ) : (
            <>
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {t('dropzone')}
              </p>
              <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {t('dropzoneOr')}
              </p>
            </>
          )}
        </div>

        {/* Separator */}
        {!isDragOver && (
          <div className="h-px w-16 bg-slate-200/60 dark:bg-slate-700/40" aria-hidden="true" />
        )}

        {/* Format badges */}
        {!isDragOver && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FORMAT_BADGES.map(({ label, color }) => (
              <span
                key={label}
                className="format-badge rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: color,
                  borderColor: color + '30',
                  backgroundColor: color + '10',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Paste shortcut + size limit */}
        {!isDragOver && (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs text-slate-400/80">
              <kbd className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                {pasteShortcut}
              </kbd>
              {' '}{t('pasteHint')}
            </p>
            <p className="text-xs text-slate-400">{t('maxSize')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
