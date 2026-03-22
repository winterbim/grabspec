'use client';

import { useTranslations } from 'next-intl';
import { FileText, ImageIcon } from 'lucide-react';
import type { ImageOutputFormat } from '@/lib/image-converter';

/** All conversion routes available */
interface ConversionRoute {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly category: 'document' | 'image';
  readonly outputMime?: ImageOutputFormat;
  readonly color: string;
}

const CONVERSION_ROUTES: ConversionRoute[] = [
  // PDF/Word (server-side)
  { from: 'pdf', to: 'docx', label: 'PDF → DOCX', category: 'document', color: '#3B82F6' },
  { from: 'docx', to: 'pdf', label: 'DOCX → PDF', category: 'document', color: '#EF4444' },
  { from: 'doc', to: 'pdf', label: 'DOC → PDF', category: 'document', color: '#EF4444' },
  // Image (client-side)
  { from: 'jpg', to: 'png', label: 'JPG → PNG', category: 'image', outputMime: 'image/png', color: '#10B981' },
  { from: 'jpg', to: 'webp', label: 'JPG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6' },
  { from: 'jpeg', to: 'png', label: 'JPEG → PNG', category: 'image', outputMime: 'image/png', color: '#10B981' },
  { from: 'jpeg', to: 'webp', label: 'JPEG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6' },
  { from: 'png', to: 'jpg', label: 'PNG → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B' },
  { from: 'png', to: 'webp', label: 'PNG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6' },
  { from: 'webp', to: 'jpg', label: 'WEBP → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B' },
  { from: 'webp', to: 'png', label: 'WEBP → PNG', category: 'image', outputMime: 'image/png', color: '#10B981' },
  { from: 'bmp', to: 'png', label: 'BMP → PNG', category: 'image', outputMime: 'image/png', color: '#10B981' },
  { from: 'bmp', to: 'jpg', label: 'BMP → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B' },
  { from: 'bmp', to: 'webp', label: 'BMP → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6' },
  { from: 'gif', to: 'png', label: 'GIF → PNG', category: 'image', outputMime: 'image/png', color: '#10B981' },
  { from: 'gif', to: 'jpg', label: 'GIF → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B' },
];

/**
 * Get available conversion routes for a given file extension.
 */
export function getRoutesForFile(filename: string): ConversionRoute[] {
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  return CONVERSION_ROUTES.filter((r) => r.from === ext);
}

interface FormatSelectorProps {
  readonly filename: string;
  readonly selectedFormat: string | null;
  readonly onSelect: (route: ConversionRoute) => void;
}

export function FormatSelector({ filename, selectedFormat, onSelect }: FormatSelectorProps) {
  const t = useTranslations('converter');
  const routes = getRoutesForFile(filename);

  if (routes.length === 0) return null;

  // Group by category
  const documentRoutes = routes.filter((r) => r.category === 'document');
  const imageRoutes = routes.filter((r) => r.category === 'image');

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
          2
        </span>
        {t('chooseFormat')}
      </h3>

      {documentRoutes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t('categoryDocument')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {documentRoutes.map((route) => (
              <button
                key={route.to}
                onClick={() => onSelect(route)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  selectedFormat === route.to
                    ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700'
                }`}
              >
                .{route.to.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {imageRoutes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t('categoryImage')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {imageRoutes.map((route) => (
              <button
                key={route.to}
                onClick={() => onSelect(route)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  selectedFormat === route.to
                    ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700'
                }`}
              >
                .{route.to.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { ConversionRoute };
