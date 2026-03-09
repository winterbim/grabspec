import type { LocalProduct } from '@/lib/db';

type SupportedLocale = 'fr' | 'en' | 'es' | 'de';

const COLUMN_HEADERS: Record<SupportedLocale, string[]> = {
  fr: ['Nom', 'Fabricant', 'Référence', 'Lot', 'Catégorie', 'Dimensions', 'Poids', 'Matériau', 'Couleur', 'Puissance'],
  en: ['Name', 'Manufacturer', 'Reference', 'Lot', 'Category', 'Dimensions', 'Weight', 'Material', 'Color', 'Power'],
  es: ['Nombre', 'Fabricante', 'Referencia', 'Lote', 'Categoría', 'Dimensiones', 'Peso', 'Material', 'Color', 'Potencia'],
  de: ['Name', 'Hersteller', 'Referenz', 'Los', 'Kategorie', 'Abmessungen', 'Gewicht', 'Material', 'Farbe', 'Leistung'],
};

function isValidLocale(locale: string): locale is SupportedLocale {
  return ['fr', 'en', 'es', 'de'].includes(locale);
}

export async function generateExcel(
  products: LocalProduct[],
  locale: string = 'fr'
): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('GrabSpec');

  const safeLocale: SupportedLocale = isValidLocale(locale) ? locale : 'fr';
  const headers = COLUMN_HEADERS[safeLocale];

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  products.forEach((product, index) => {
    const row = sheet.addRow([
      product.resolvedName ?? product.inputName,
      product.manufacturer ?? '',
      product.reference ?? '',
      product.lot ?? '',
      product.category ?? '',
      product.specs?.dimensions ?? '',
      product.specs?.poids ?? '',
      product.specs?.materiau ?? '',
      product.specs?.couleur ?? '',
      product.specs?.puissance ?? '',
    ]);

    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' },
        };
      });
    }
  });

  headers.forEach((_, i) => {
    const col = sheet.getColumn(i + 1);
    col.width = 18;
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: products.length + 1, column: headers.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
