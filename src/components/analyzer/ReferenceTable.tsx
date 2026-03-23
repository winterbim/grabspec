'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown, Download, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ExtractedReference } from '@/lib/analyzer/referenceExtractor';

type SortField = 'value' | 'manufacturer' | 'confidence' | 'line';
type SortDir = 'asc' | 'desc';

interface ReferenceTableProps {
  references: ExtractedReference[];
  onSearchSelected: (refs: string[]) => void;
}

export function ReferenceTable({ references, onSearchSelected }: ReferenceTableProps) {
  const t = useTranslations('analyzer');

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(references.filter((r) => r.confidence >= 50).map((r) => r.id)),
  );
  const [search, setSearch] = useState('');
  const [manufacturer, setManufacturer] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('line');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Unique manufacturers for filter
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    for (const ref of references) {
      if (ref.manufacturer) set.add(ref.manufacturer);
    }
    return Array.from(set).sort();
  }, [references]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = references;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.value.toLowerCase().includes(q) ||
          r.manufacturer?.toLowerCase().includes(q) ||
          r.context.toLowerCase().includes(q),
      );
    }

    if (manufacturer !== 'all') {
      result = result.filter((r) => r.manufacturer === manufacturer);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'value':
          cmp = a.value.localeCompare(b.value);
          break;
        case 'manufacturer':
          cmp = (a.manufacturer ?? '').localeCompare(b.manufacturer ?? '');
          break;
        case 'confidence':
          cmp = a.confidence - b.confidence;
          break;
        case 'line':
          cmp = a.line - b.line;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [references, search, manufacturer, sortField, sortDir]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const selectedCount = filtered.filter((r) => selected.has(r.id)).length;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const r of filtered) next.delete(r.id);
      } else {
        for (const r of filtered) next.add(r.id);
      }
      return next;
    });
  }, [filtered, allSelected]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const handleSearch = useCallback(() => {
    const selectedRefs = references
      .filter((r) => selected.has(r.id))
      .map((r) => r.manufacturer ? `${r.manufacturer} ${r.value}` : r.value);
    if (selectedRefs.length > 0) {
      onSearchSelected(selectedRefs);
    }
  }, [references, selected, onSearchSelected]);

  const handleExportCsv = useCallback(() => {
    const header = 'Reference,Manufacturer,Confidence,Line,Context';
    const rows = filtered.map(
      (r) =>
        `"${r.value}","${r.manufacturer ?? ''}",${r.confidence},${r.line},"${r.context.replace(/"/g, '""')}"`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'references.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-8 w-56 pl-8 text-sm"
            />
          </div>
          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:border-slate-700 dark:bg-slate-800"
            aria-label={t('filterManufacturer')}
          >
            <option value="all">{t('allManufacturers')}</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {t('referencesFound', { count: references.length })}
            {' — '}
            {t('selected', { count: selectedCount })}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label={allSelected ? t('deselectAll') : t('selectAll')}
                />
              </th>
              <SortHeader field="value" current={sortField} dir={sortDir} onSort={handleSort}>
                {t('columns.reference')}
              </SortHeader>
              <SortHeader field="manufacturer" current={sortField} dir={sortDir} onSort={handleSort}>
                {t('columns.manufacturer')}
              </SortHeader>
              <SortHeader field="confidence" current={sortField} dir={sortDir} onSort={handleSort}>
                {t('columns.confidence')}
              </SortHeader>
              <SortHeader field="line" current={sortField} dir={sortDir} onSort={handleSort}>
                {t('columns.line')}
              </SortHeader>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ref) => (
              <tr
                key={ref.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30"
              >
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selected.has(ref.id)}
                    onCheckedChange={() => toggleOne(ref.id)}
                    aria-label={`Select ${ref.value}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {ref.value}
                  </span>
                  <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400" title={ref.context}>
                    {ref.context}
                  </p>
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {ref.manufacturer ?? (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <ConfidenceBadge confidence={ref.confidence} />
                </td>
                <td className="px-3 py-2 font-mono text-slate-500">
                  {ref.line}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                  {search || manufacturer !== 'all'
                    ? t('noResultsFilter')
                    : t('noReferences')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {allSelected ? t('deselectAll') : t('selectAll')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('exportCsv')}
          </Button>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={selectedCount === 0}
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            {t('searchSelected', { count: selectedCount })}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort header helper ──────────────────────────────────────

function SortHeader({
  field,
  current,
  dir,
  onSort,
  children,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = current === field;
  return (
    <th className="px-3 py-2.5 text-left">
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {children}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`}
        />
        {isActive && (
          <span className="text-[10px] text-purple-600 dark:text-purple-400">
            {dir === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    </th>
  );
}
