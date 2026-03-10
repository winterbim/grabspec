/**
 * Advanced export service - Generate exports with smart filtering, sorting, and categorization
 */

import type { LocalProduct, LocalProject } from './db';
import { searchProducts, getLibraryStats, type SearchFilter } from './library-search';
import { getCategoryLabel, type ProductCategory } from './smart-categories';
import type { Worksheet } from 'exceljs';

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json' | 'pdf';
  includePhotos?: boolean;
  includeDatasheets?: boolean;
  includeThumbnails?: boolean;
  groupByCategory?: boolean;
  groupByManufacturer?: boolean;
  searchFilter?: SearchFilter;
  sortBy?: string;
  locale?: string;
}

/**
 * Generate advanced Excel export with smart categorization and search results
 */
export async function generateAdvancedExcelExport(
  products: LocalProduct[],
  project: LocalProject,
  options: ExportOptions
): Promise<Buffer> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();

  // Apply filters if provided
  let filteredProducts = products;
  if (options.searchFilter) {
    const result = searchProducts(products, options.searchFilter);
    filteredProducts = result.products;
  }

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  addSummarySheet(summarySheet, filteredProducts, project);

  // Products sheet (main)
  const productsSheet = workbook.addWorksheet('Products');
  await addProductsSheet(productsSheet, filteredProducts, options);

  // Category breakdown sheet
  if (options.groupByCategory) {
    const categorySheet = workbook.addWorksheet('By Category');
    addCategoryBreakdown(categorySheet, filteredProducts);
  }

  // Manufacturer breakdown sheet
  if (options.groupByManufacturer) {
    const manufacturerSheet = workbook.addWorksheet('By Manufacturer');
    addManufacturerBreakdown(manufacturerSheet, filteredProducts);
  }

  // Statistics sheet
  const statsSheet = workbook.addWorksheet('Statistics');
  addStatisticsSheet(statsSheet, filteredProducts);

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

function addSummarySheet(
  sheet: Worksheet,
  products: LocalProduct[],
  project: LocalProject
): void {
  sheet.columns = [{ header: 'Metric', key: 'metric' }, { header: 'Value', key: 'value' }];

  const stats = getLibraryStats(products);

  sheet.addRows([
    { metric: 'Project Name', value: project.name },
    { metric: 'Generated At', value: new Date().toISOString() },
    { metric: 'Total Products', value: stats.active },
    { metric: 'With Photos', value: stats.withPhotos },
    { metric: 'With Datasheets', value: stats.withDatasheets },
    { metric: 'Categorized', value: stats.categorized },
    { metric: 'Average Confidence', value: `${(stats.averageConfidence * 100).toFixed(1)}%` },
  ]);

  sheet.getColumn('metric').width = 20;
  sheet.getColumn('value').width = 30;
}

async function addProductsSheet(
  sheet: Worksheet,
  products: LocalProduct[],
  options: ExportOptions
): Promise<void> {
  const columns: any[] = [
    { header: 'Product Name', key: 'inputName' },
    { header: 'Resolved Name', key: 'resolvedName' },
    { header: 'Manufacturer', key: 'manufacturer' },
    { header: 'Reference', key: 'reference' },
    { header: 'Category', key: 'category' },
    { header: 'Confidence', key: 'confidence' },
    { header: 'Status', key: 'searchStatus' },
  ];

  if (options.includeDatasheets) {
    columns.push({ header: 'Datasheet URL', key: 'datasheetUrl' });
  }

  if (options.includePhotos) {
    columns.push({ header: 'Photo URL', key: 'photoUrl' });
  }

  columns.push({ header: 'Notes', key: 'notes' }, { header: 'Tags', key: 'tags' });

  sheet.columns = columns;

  const rows = products.map((p) => ({
    inputName: p.inputName,
    resolvedName: p.resolvedName,
    manufacturer: p.manufacturer,
    reference: p.reference,
    category: p.category ? getCategoryLabel(p.category as ProductCategory) : '',
    confidence: p.confidence ? `${(p.confidence * 100).toFixed(0)}%` : '',
    searchStatus: p.searchStatus,
    datasheetUrl: p.datasheetUrl || '',
    photoUrl: p.photoUrl || '',
    notes: p.notes || '',
    tags: (p.tags || []).join(', '),
  }));

  sheet.addRows(rows);

  // Format headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Auto-fit columns
  sheet.columns.forEach((col) => {
    col.width = 15;
  });
}

function addCategoryBreakdown(sheet: Worksheet, products: LocalProduct[]): void {
  const categories = new Map<string, LocalProduct[]>();

  for (const product of products) {
    const cat = product.category ? getCategoryLabel(product.category as ProductCategory) : 'Other';
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)?.push(product);
  }

  sheet.columns = [
    { header: 'Category', key: 'category' },
    { header: 'Count', key: 'count' },
    { header: 'With Photos', key: 'photos' },
    { header: 'With Datasheets', key: 'datasheets' },
  ];

  const rows = Array.from(categories.entries()).map(([cat, prods]) => ({
    category: cat,
    count: prods.length,
    photos: prods.filter((p) => p.photoUrl).length,
    datasheets: prods.filter((p) => p.datasheetUrl).length,
  }));

  sheet.addRows(rows);

  // Format
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
}

function addManufacturerBreakdown(sheet: Worksheet, products: LocalProduct[]): void {
  const manufacturers = new Map<string, LocalProduct[]>();

  for (const product of products) {
    const mfg = product.manufacturer || 'Unknown';
    if (!manufacturers.has(mfg)) {
      manufacturers.set(mfg, []);
    }
    manufacturers.get(mfg)!.push(product);
  }

  sheet.columns = [
    { header: 'Manufacturer', key: 'manufacturer' },
    { header: 'Count', key: 'count' },
    { header: 'Found', key: 'found' },
    { header: 'Success Rate', key: 'successRate' },
  ];

  const rows = Array.from(manufacturers.entries())
    .map(([mfg, prods]) => {
      const found = prods.filter((p) => p.searchStatus === 'found').length;
      return {
        manufacturer: mfg,
        count: prods.length,
        found,
        successRate: `${((found / prods.length) * 100).toFixed(1)}%`,
      };
    })
    .sort((a, b) => b.count - a.count);

  sheet.addRows(rows);

  // Format
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
}

function addStatisticsSheet(sheet: Worksheet, products: LocalProduct[]): void {
  const stats = getLibraryStats(products);

  sheet.columns = [{ header: 'Statistic', key: 'stat' }, { header: 'Value', key: 'value' }];

  const rows = [
    { stat: 'Total Products', value: stats.total },
    { stat: 'Active Products', value: stats.active },
    { stat: 'Deleted Products', value: stats.deleted },
    { stat: 'With Photos', value: stats.withPhotos },
    { stat: 'With Datasheets', value: stats.withDatasheets },
    { stat: 'Average Confidence', value: `${(stats.averageConfidence * 100).toFixed(1)}%` },
    { stat: '', value: '' },
  ];

  // Add by category stats
  rows.push({ stat: '=== BY CATEGORY ===', value: '' });
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    rows.push({ stat: cat, value: count });
  });

  // Add by status stats
  rows.push({ stat: '', value: '' });
  rows.push({ stat: '=== BY STATUS ===', value: '' });
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    rows.push({ stat: status, value: count });
  });

  sheet.addRows(rows);

  // Format headers
  sheet.getColumn('stat').width = 25;
  sheet.getColumn('value').width = 15;
}

/**
 * Export to CSV format with smart filtering
 */
export async function generateCSVExport(
  products: LocalProduct[],
  options: ExportOptions
): Promise<string> {
  let filteredProducts = products;
  if (options.searchFilter) {
    const result = searchProducts(products, options.searchFilter);
    filteredProducts = result.products;
  }

  const headers = [
    'Product Name',
    'Resolved Name',
    'Manufacturer',
    'Reference',
    'Category',
    'Confidence',
    'Status',
  ];

  if (options.includeDatasheets) headers.push('Datasheet URL');
  if (options.includePhotos) headers.push('Photo URL');

  headers.push('Notes', 'Tags');

  const lines = [headers.join(',')];

  for (const p of filteredProducts) {
    const row = [
      escapeCSV(p.inputName),
      escapeCSV(p.resolvedName || ''),
      escapeCSV(p.manufacturer || ''),
      escapeCSV(p.reference || ''),
      escapeCSV(p.category ? getCategoryLabel(p.category as ProductCategory) : ''),
      p.confidence ? `${(p.confidence * 100).toFixed(0)}%` : '',
      p.searchStatus,
    ];

    if (options.includeDatasheets) row.push(escapeCSV(p.datasheetUrl || ''));
    if (options.includePhotos) row.push(escapeCSV(p.photoUrl || ''));

    row.push(escapeCSV(p.notes || ''), escapeCSV((p.tags || []).join(';')));

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export to JSON format with metadata
 */
export function generateJSONExport(
  products: LocalProduct[],
  project: LocalProject,
  options: ExportOptions
): string {
  let filteredProducts = products;
  if (options.searchFilter) {
    const result = searchProducts(products, options.searchFilter);
    filteredProducts = result.products;
  }

  const stats = getLibraryStats(filteredProducts);

  return JSON.stringify(
    {
      metadata: {
        exportedAt: new Date().toISOString(),
        projectName: project.name,
        productCount: filteredProducts.length,
        stats,
      },
      products: filteredProducts.map((p) => ({
        id: p.id,
        inputName: p.inputName,
        resolvedName: p.resolvedName,
        manufacturer: p.manufacturer,
        reference: p.reference,
        category: p.category,
        confidence: p.confidence,
        status: p.searchStatus,
        ...(options.includePhotos && { photoUrl: p.photoUrl }),
        ...(options.includeDatasheets && { datasheetUrl: p.datasheetUrl }),
        notes: p.notes,
        tags: p.tags,
        createdAt: p.createdAt,
      })),
    },
    null,
    2
  );
}
