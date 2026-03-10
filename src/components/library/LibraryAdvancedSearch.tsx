'use client';

import { useCallback, useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { SearchFilter, SortBy } from '@/lib/library-search';
import { getAllCategories, type ProductCategory } from '@/lib/smart-categories';

const STATUS_OPTIONS = ['found', 'partial', 'pending', 'error'] as const;

interface LibrarySearchProps {
  onSearch: (filters: SearchFilter, sortBy?: SortBy) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function LibraryAdvancedSearch({ onSearch, onClear, isLoading }: LibrarySearchProps) {
  const t = useTranslations('library');
  const [filters, setFilters] = useState<SearchFilter>({
    excludeDeleted: true,
  });
  const [sortBy, setSortBy] = useState<SortBy>('date-newest');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleSearch = useCallback(() => {
    onSearch(filters, sortBy);

    // Count active filters
    const count =
      (filters.query ? 1 : 0) +
      (filters.category ? 1 : 0) +
      (filters.manufacturer ? 1 : 0) +
      (filters.hasPhoto ? 1 : 0) +
      (filters.hasDatasheet ? 1 : 0) +
      (filters.minConfidence ? 1 : 0) +
      (filters.excludeDeleted === false ? 1 : 0);

    setActiveFiltersCount(count);
  }, [filters, sortBy, onSearch]);

  const handleClear = useCallback(() => {
    setFilters({ excludeDeleted: true });
    setSortBy('date-newest');
    setActiveFiltersCount(0);
    onClear();
  }, [onClear]);

  return (
    <Dialog>
      <div className="flex gap-2 items-center mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('search_products')}
            value={filters.query || ''}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        <DialogTrigger>
          <Button
            variant="outline"
            size="sm"
            className="relative"
            disabled={isLoading}
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            {t('filters')}
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-blue-500" variant="secondary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {t('search')}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('advanced_search')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('category')}</label>
            <select
              value={filters.category || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value ? (e.target.value as ProductCategory) : undefined,
                })
              }
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">{t('all_categories')}</option>
              {getAllCategories().map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('manufacturer')}</label>
            <Input
              placeholder="e.g., Siemens, Bosch..."
              value={filters.manufacturer || ''}
              onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('status')}</label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <label key={status} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const current = filters.status || [];
                      const updated = e.target.checked
                        ? [...current, status]
                        : current.filter((s) => s !== status);
                      setFilters({
                        ...filters,
                        status: updated.length > 0 ? updated : undefined,
                      });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Media Filters */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasPhoto || false}
                onChange={(e) => setFilters({ ...filters, hasPhoto: e.target.checked || undefined })}
                className="rounded"
              />
              <span className="text-sm">{t('has_photos')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.hasDatasheet || false}
                onChange={(e) =>
                  setFilters({ ...filters, hasDatasheet: e.target.checked || undefined })
                }
                className="rounded"
              />
              <span className="text-sm">{t('has_datasheets')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.excludeDeleted === false}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    excludeDeleted: e.target.checked ? false : true,
                  })
                }
                className="rounded"
              />
              <span className="text-sm">{t('show_deleted')}</span>
            </label>
          </div>

          {/* Confidence Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('min_confidence')} ({filters.minConfidence || 0}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minConfidence || 0}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minConfidence: Number.parseInt(e.target.value) || undefined,
                })
              }
              className="w-full"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('sort_by')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="date-newest">{t('date_newest')}</option>
              <option value="date-oldest">{t('date_oldest')}</option>
              <option value="name-asc">{t('name_ascending')}</option>
              <option value="name-desc">{t('name_descending')}</option>
              <option value="manufacturer-asc">{t('manufacturer')}</option>
              <option value="category-asc">{t('category')}</option>
              <option value="confidence-high">{t('confidence_high')}</option>
              <option value="status-pending">{t('pending_first')}</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSearch} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {t('apply_filters')}
            </Button>
            <Button onClick={handleClear} variant="outline" className="flex-1">
              {t('clear_filters')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
