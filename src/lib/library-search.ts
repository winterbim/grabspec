/**
 * Advanced search and filtering engine for product library
 */

import type { LocalProduct } from './db';
import type { ProductCategory } from './smart-categories';

export interface SearchFilter {
  query?: string;
  category?: ProductCategory;
  manufacturer?: string;
  status?: string[];
  tags?: string[];
  dateRange?: { from: Date; to: Date };
  hasPhoto?: boolean;
  hasDatasheet?: boolean;
  minConfidence?: number;
  excludeDeleted?: boolean;
}

export interface SearchResult {
  products: LocalProduct[];
  total: number;
  matchedCount: number;
}

function hasPhoto(product: LocalProduct): boolean {
  return Boolean(product.photoBlobUrl || product.photoUrl);
}

function hasDatasheet(product: LocalProduct): boolean {
  return Boolean(product.datasheetBlobUrl || product.datasheetUrl);
}

function normalizeConfidence(value: number): number {
  return value > 1 ? value / 100 : value;
}

/**
 * Advanced search with fuzzy matching and multi-criteria filtering
 */
export function searchProducts(products: LocalProduct[], filters: SearchFilter): SearchResult {
  let filtered = [...products];

  // Exclude deleted by default
  if (filters.excludeDeleted !== false) {
    filtered = filtered.filter((p) => !p.isDeleted);
  }

  // Text search (query) - fuzzy matching
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter((p) => {
      const searchableText = [
        p.inputName,
        p.resolvedName,
        p.manufacturer,
        p.reference,
        p.category,
        (p.tags || []).join(' '),
        p.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Fuzzy match: all characters in query must appear in order
      let queryIndex = 0;
      for (let i = 0; i < searchableText.length && queryIndex < query.length; i++) {
        if (searchableText[i] === query[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === query.length;
    });
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  // Manufacturer filter
  if (filters.manufacturer) {
    filtered = filtered.filter((p) =>
      p.manufacturer?.toLowerCase().includes(filters.manufacturer!.toLowerCase())
    );
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((p) => filters.status!.includes(p.searchStatus));
  }

  // Tags filter (any tag match)
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((p) => {
      const productTags = p.tags || [];
      return filters.tags!.some((tag) => productTags.includes(tag));
    });
  }

  // Date range filter
  if (filters.dateRange) {
    filtered = filtered.filter((p) => {
      const date = new Date(p.createdAt);
      return date >= filters.dateRange!.from && date <= filters.dateRange!.to;
    });
  }

  // Has photo filter
  if (filters.hasPhoto !== undefined) {
    filtered = filtered.filter((p) => hasPhoto(p) === filters.hasPhoto);
  }

  // Has datasheet filter
  if (filters.hasDatasheet !== undefined) {
    filtered = filtered.filter((p) => hasDatasheet(p) === filters.hasDatasheet);
  }

  // Confidence score filter
  if (filters.minConfidence !== undefined) {
    const minConfidence = normalizeConfidence(filters.minConfidence);
    filtered = filtered.filter((p) => (p.confidence || 0) >= minConfidence);
  }

  return {
    products: filtered,
    total: products.length,
    matchedCount: filtered.length,
  };
}

/**
 * Sort products by various criteria
 */
export type SortBy =
  | 'name-asc'
  | 'name-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'manufacturer-asc'
  | 'category-asc'
  | 'confidence-high'
  | 'status-pending';

export function sortProducts(products: LocalProduct[], sortBy: SortBy): LocalProduct[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => (a.inputName || '').localeCompare(b.inputName || ''));
      break;
    case 'name-desc':
      sorted.sort((a, b) => (b.inputName || '').localeCompare(a.inputName || ''));
      break;
    case 'date-newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'date-oldest':
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'manufacturer-asc':
      sorted.sort((a, b) => (a.manufacturer || '').localeCompare(b.manufacturer || ''));
      break;
    case 'category-asc':
      sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      break;
    case 'confidence-high':
      sorted.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      break;
    case 'status-pending':
      sorted.sort(
        (a, b) =>
          Number(b.searchStatus === 'pending') - Number(a.searchStatus === 'pending')
      );
      break;
  }

  return sorted;
}

/**
 * Get available manufacturers from product list
 */
export function getAvailableManufacturers(products: LocalProduct[]): string[] {
  const manufacturers = new Set(
    products.filter((p) => p.manufacturer && !p.isDeleted).map((p) => p.manufacturer!)
  );
  return Array.from(manufacturers).sort();
}

/**
 * Get statistics about products
 */
export interface LibraryStats {
  total: number;
  deleted: number;
  active: number;
  categorized: number;
  withPhotos: number;
  withDatasheets: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  averageConfidence: number;
}

export function getLibraryStats(products: LocalProduct[]): LibraryStats {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  let withPhotos = 0;
  let withDatasheets = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const p of products) {
    if (!p.isDeleted) {
      if (p.photoUrl) withPhotos++;
      if (p.datasheetUrl) withDatasheets++;
      if (p.confidence !== undefined) {
        totalConfidence += p.confidence;
        confidenceCount++;
      }
    }

    const catKey = p.category || 'unassigned';
    byCategory[catKey] = (byCategory[catKey] || 0) + 1;

    const statusKey = p.searchStatus;
    byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
  }

  return {
    total: products.length,
    deleted: products.filter((p) => p.isDeleted).length,
    active: products.filter((p) => !p.isDeleted).length,
    categorized: products.filter((p) => p.category && p.category !== 'other' && !p.isDeleted).length,
    withPhotos,
    withDatasheets,
    byCategory,
    byStatus,
    averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
  };
}
