'use client';

import { useTranslations } from 'next-intl';
import { FileText, ImageIcon, ArrowRight, TableIcon } from 'lucide-react';
import type { ImageOutputFormat } from '@/lib/image-converter';

/** All conversion routes available */
interface ConversionRoute {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly category: 'document' | 'spreadsheet' | 'image';
  readonly outputMime?: ImageOutputFormat;
  readonly color: string;
  /** Whether this conversion runs client-side (instant) */
  readonly clientSide?: boolean;
}

const CONVERSION_ROUTES: ConversionRoute[] = [
  // ── Documents ──
  { from: 'pdf', to: 'docx', label: 'PDF → DOCX', category: 'document', color: '#3B82F6' },
  { from: 'docx', to: 'pdf', label: 'DOCX → PDF', category: 'document', color: '#EF4444', clientSide: true },
  { from: 'txt', to: 'pdf', label: 'TXT → PDF', category: 'document', color: '#EF4444', clientSide: true },
  { from: 'html', to: 'pdf', label: 'HTML → PDF', category: 'document', color: '#EF4444', clientSide: true },
  { from: 'htm', to: 'pdf', label: 'HTM → PDF', category: 'document', color: '#EF4444', clientSide: true },
  { from: 'md', to: 'pdf', label: 'MD → PDF', category: 'document', color: '#EF4444', clientSide: true },
  { from: 'md', to: 'html', label: 'MD → HTML', category: 'document', color: '#F97316', clientSide: true },

  // ── Spreadsheets ──
  { from: 'xlsx', to: 'csv', label: 'XLSX → CSV', category: 'spreadsheet', color: '#16A34A', clientSide: true },
  { from: 'xlsx', to: 'json', label: 'XLSX → JSON', category: 'spreadsheet', color: '#8B5CF6', clientSide: true },
  { from: 'xlsx', to: 'txt', label: 'XLSX → TXT', category: 'spreadsheet', color: '#64748B', clientSide: true },
  { from: 'xlsx', to: 'html', label: 'XLSX → HTML', category: 'spreadsheet', color: '#F97316', clientSide: true },
  { from: 'xlsx', to: 'pdf', label: 'XLSX → PDF', category: 'spreadsheet', color: '#EF4444', clientSide: true },
  { from: 'xls', to: 'csv', label: 'XLS → CSV', category: 'spreadsheet', color: '#16A34A', clientSide: true },
  { from: 'xls', to: 'json', label: 'XLS → JSON', category: 'spreadsheet', color: '#8B5CF6', clientSide: true },
  { from: 'xls', to: 'xlsx', label: 'XLS → XLSX', category: 'spreadsheet', color: '#16A34A', clientSide: true },
  { from: 'xls', to: 'pdf', label: 'XLS → PDF', category: 'spreadsheet', color: '#EF4444', clientSide: true },
  { from: 'csv', to: 'xlsx', label: 'CSV → XLSX', category: 'spreadsheet', color: '#16A34A', clientSide: true },
  { from: 'csv', to: 'json', label: 'CSV → JSON', category: 'spreadsheet', color: '#8B5CF6', clientSide: true },
  { from: 'tsv', to: 'xlsx', label: 'TSV → XLSX', category: 'spreadsheet', color: '#16A34A', clientSide: true },
  { from: 'tsv', to: 'csv', label: 'TSV → CSV', category: 'spreadsheet', color: '#64748B', clientSide: true },
  { from: 'tsv', to: 'json', label: 'TSV → JSON', category: 'spreadsheet', color: '#8B5CF6', clientSide: true },
  { from: 'json', to: 'csv', label: 'JSON → CSV', category: 'spreadsheet', color: '#64748B', clientSide: true },
  { from: 'json', to: 'xlsx', label: 'JSON → XLSX', category: 'spreadsheet', color: '#16A34A', clientSide: true },

  // ── JPG / JPEG ──
  { from: 'jpg', to: 'png', label: 'JPG → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'jpg', to: 'webp', label: 'JPG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },
  { from: 'jpeg', to: 'png', label: 'JPEG → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'jpeg', to: 'webp', label: 'JPEG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },
  { from: 'jpeg', to: 'jpg', label: 'JPEG → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },

  // ── PNG ──
  { from: 'png', to: 'jpg', label: 'PNG → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'png', to: 'webp', label: 'PNG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },

  // ── WEBP ──
  { from: 'webp', to: 'jpg', label: 'WEBP → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'webp', to: 'png', label: 'WEBP → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },

  // ── BMP ──
  { from: 'bmp', to: 'png', label: 'BMP → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'bmp', to: 'jpg', label: 'BMP → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'bmp', to: 'webp', label: 'BMP → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },

  // ── GIF ──
  { from: 'gif', to: 'png', label: 'GIF → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'gif', to: 'jpg', label: 'GIF → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'gif', to: 'webp', label: 'GIF → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },

  // ── TIFF ──
  { from: 'tiff', to: 'png', label: 'TIFF → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'tiff', to: 'jpg', label: 'TIFF → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'tif', to: 'png', label: 'TIF → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'tif', to: 'jpg', label: 'TIF → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },

  // ── SVG ──
  { from: 'svg', to: 'png', label: 'SVG → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'svg', to: 'jpg', label: 'SVG → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'svg', to: 'webp', label: 'SVG → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },

  // ── AVIF (from PixelForge) ──
  { from: 'avif', to: 'png', label: 'AVIF → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'avif', to: 'jpg', label: 'AVIF → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'avif', to: 'webp', label: 'AVIF → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },

  // ── ICO (from PixelForge) ──
  { from: 'ico', to: 'png', label: 'ICO → PNG', category: 'image', outputMime: 'image/png', color: '#10B981', clientSide: true },
  { from: 'ico', to: 'jpg', label: 'ICO → JPG', category: 'image', outputMime: 'image/jpeg', color: '#F59E0B', clientSide: true },
  { from: 'ico', to: 'webp', label: 'ICO → WEBP', category: 'image', outputMime: 'image/webp', color: '#8B5CF6', clientSide: true },
];

/** Total unique conversion count for display */
export const TOTAL_CONVERSIONS = CONVERSION_ROUTES.length;

/**
 * Get available conversion routes for a given file extension.
 */
export function getRoutesForFile(filename: string): ConversionRoute[] {
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  return CONVERSION_ROUTES.filter((r) => r.from === ext);
}

/**
 * Get ALL unique conversion routes grouped by source format for the grid.
 * Returns unique "from → to" combos, deduped (e.g. jpg and jpeg counted once).
 */
export function getAllConversionGroups(): { category: string; conversions: ConversionRoute[] }[] {
  const docRoutes = CONVERSION_ROUTES.filter((r) => r.category === 'document');
  const sheetRoutes = CONVERSION_ROUTES.filter((r) => r.category === 'spreadsheet');
  const imgRoutes = CONVERSION_ROUTES.filter((r) => r.category === 'image');

  // Deduplicate: treat jpeg/jpg as same, xls/xlsx as same, htm/html as same
  const dedupe = (routes: ConversionRoute[]): ConversionRoute[] => {
    const seen = new Set<string>();
    return routes.filter((r) => {
      const key = r.label
        .replace('JPEG', 'JPG')
        .replace('HTM →', 'HTML →')
        .replace('XLS →', 'XLSX →')
        .replace('TIF →', 'TIFF →');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return [
    { category: 'document', conversions: dedupe(docRoutes) },
    { category: 'spreadsheet', conversions: dedupe(sheetRoutes) },
    { category: 'image', conversions: dedupe(imgRoutes) },
  ];
}

// ── FormatSelector (shown after file upload) ──

interface FormatSelectorProps {
  readonly filename: string;
  readonly selectedFormat: string | null;
  readonly onSelect: (route: ConversionRoute) => void;
}

export function FormatSelector({ filename, selectedFormat, onSelect }: FormatSelectorProps) {
  const t = useTranslations('converter');
  const routes = getRoutesForFile(filename);

  if (routes.length === 0) return null;

  const documentRoutes = routes.filter((r) => r.category === 'document');
  const spreadsheetRoutes = routes.filter((r) => r.category === 'spreadsheet');
  const imageRoutes = routes.filter((r) => r.category === 'image');

  const renderGroup = (groupRoutes: ConversionRoute[], icon: React.ReactNode, labelKey: string) => {
    if (groupRoutes.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t(labelKey)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {groupRoutes.map((route) => (
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
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
          2
        </span>
        {t('chooseFormat')}
      </h3>

      {renderGroup(documentRoutes, <FileText className="h-3.5 w-3.5 text-slate-400" />, 'categoryDocument')}
      {renderGroup(spreadsheetRoutes, <TableIcon className="h-3.5 w-3.5 text-slate-400" />, 'categorySpreadsheet')}
      {renderGroup(imageRoutes, <ImageIcon className="h-3.5 w-3.5 text-slate-400" />, 'categoryImage')}
    </div>
  );
}

// ── ConversionGrid (ConvertX-style full grid shown on homepage) ──

interface ConversionGridProps {
  readonly onConversionClick: (route: ConversionRoute) => void;
}

export function ConversionGrid({ onConversionClick }: ConversionGridProps) {
  const t = useTranslations('converter');
  const groups = getAllConversionGroups();

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.category}>
          <div className="mb-3 flex items-center gap-2">
            {group.category === 'document' ? (
              <FileText className="h-4 w-4 text-slate-400" />
            ) : group.category === 'spreadsheet' ? (
              <TableIcon className="h-4 w-4 text-slate-400" />
            ) : (
              <ImageIcon className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t(group.category === 'document' ? 'categoryDocument' : group.category === 'spreadsheet' ? 'categorySpreadsheet' : 'categoryImage')}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">
              {group.conversions.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {group.conversions.map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                onClick={() => onConversionClick(route)}
                className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-500/5 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: route.color + '12' }}
                >
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: route.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {route.from.toUpperCase()} → {route.to.toUpperCase()}
                  </p>
                  {route.clientSide && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('instant')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type { ConversionRoute };
