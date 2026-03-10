import type { LocalProduct } from '@/lib/db';
import type { CompanyProfile, ProjectDetails } from '@/types';

type SupportedLocale = 'fr' | 'en' | 'es' | 'de';

const COLUMN_HEADERS: Record<SupportedLocale, string[]> = {
  fr: ['Nom', 'Fabricant', 'Référence', 'Lot', 'Catégorie', 'Dimensions', 'Poids', 'Matériau', 'Couleur', 'Puissance'],
  en: ['Name', 'Manufacturer', 'Reference', 'Lot', 'Category', 'Dimensions', 'Weight', 'Material', 'Color', 'Power'],
  es: ['Nombre', 'Fabricante', 'Referencia', 'Lote', 'Categoría', 'Dimensiones', 'Peso', 'Material', 'Color', 'Potencia'],
  de: ['Name', 'Hersteller', 'Referenz', 'Los', 'Kategorie', 'Abmessungen', 'Gewicht', 'Material', 'Farbe', 'Leistung'],
};

const PROJECT_LABELS: Record<SupportedLocale, Record<string, string>> = {
  fr: { project: 'Projet', number: 'N° Projet', site: 'Adresse chantier', client: 'Maître d\'ouvrage', architect: 'Architecte', phase: 'Phase', date: 'Date' },
  en: { project: 'Project', number: 'Project No.', site: 'Site address', client: 'Client', architect: 'Architect', phase: 'Phase', date: 'Date' },
  es: { project: 'Proyecto', number: 'N° Proyecto', site: 'Dirección obra', client: 'Cliente', architect: 'Arquitecto', phase: 'Fase', date: 'Fecha' },
  de: { project: 'Projekt', number: 'Projekt-Nr.', site: 'Baustellenadresse', client: 'Bauherr', architect: 'Architekt', phase: 'Phase', date: 'Datum' },
};

function isValidLocale(locale: string): locale is SupportedLocale {
  return ['fr', 'en', 'es', 'de'].includes(locale);
}

// GrabSpec default logo (blue square with document+magnifier icon) as inline SVG → PNG via canvas
const GRABSPEC_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#2563EB"/><rect x="14" y="10" width="22" height="30" rx="2.5" fill="white" opacity="0.9"/><rect x="19" y="17" width="12" height="2" rx="1" fill="#2563EB" opacity="0.5"/><rect x="19" y="22" width="9" height="2" rx="1" fill="#2563EB" opacity="0.4"/><rect x="19" y="27" width="11" height="2" rx="1" fill="#2563EB" opacity="0.3"/><path d="M27 10 L36 10 L36 17 L30 17 C28.5 17 27 15.5 27 14 Z" fill="#DBEAFE"/><circle cx="40" cy="38" r="12" fill="#1D4ED8" stroke="white" stroke-width="2.5"/><circle cx="40" cy="38" r="7" fill="#2563EB" stroke="white" stroke-width="1.5" opacity="0.8"/><line x1="49" y1="47" x2="54" y2="52" stroke="white" stroke-width="3" stroke-linecap="round"/><path d="M36 38 L39 41 L45 35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function svgToBase64Png(): string {
  // Return as SVG data URI — ExcelJS can handle this if we encode as base64
  const b64 = typeof Buffer !== 'undefined'
    ? Buffer.from(GRABSPEC_LOGO_SVG).toString('base64')
    : btoa(GRABSPEC_LOGO_SVG);
  return b64;
}

export interface ExcelOptions {
  products: LocalProduct[];
  locale?: string;
  projectName?: string;
  company?: CompanyProfile | null;
  projectDetails?: ProjectDetails | null;
}

export async function generateExcel({
  products,
  locale = 'fr',
  projectName,
  company,
  projectDetails,
}: ExcelOptions): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('GrabSpec');

  const safeLocale: SupportedLocale = isValidLocale(locale) ? locale : 'fr';
  const headers = COLUMN_HEADERS[safeLocale];
  const labels = PROJECT_LABELS[safeLocale];
  const hasCompanyData = company && (company.name || company.logo);
  const hasProjectDetails = projectDetails && (projectDetails.projectNumber || projectDetails.client);

  let dataStartRow = 1;

  // Always show header section (with GrabSpec branding at minimum)
  {
    // --- Company logo or GrabSpec default logo ---
    let logoEndCol = 1;
    if (company?.logo) {
      try {
        const base64Data = company.logo.split(',')[1];
        const ext = company.logo.startsWith('data:image/png') ? 'png' : 'jpeg';
        const imageId = workbook.addImage({ base64: base64Data, extension: ext });
        sheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 120, height: 60 },
        });
        logoEndCol = 2;
      } catch {
        // Skip logo if invalid
      }
    } else {
      // Use GrabSpec default logo
      try {
        const imageId = workbook.addImage({ base64: svgToBase64Png(), extension: 'png' });
        sheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 60, height: 60 },
        });
        logoEndCol = 1;
      } catch {
        // Skip if SVG not supported
      }
    }

    // --- Company info (col C-D, rows 1-4) ---
    const infoCol = logoEndCol + 1;
    const companyLines: string[] = [];
    if (company?.name) companyLines.push(company.name);
    else companyLines.push('GrabSpec');
    if (company?.address) companyLines.push(company.address);
    const cityLine = [company?.zipCode, company?.city].filter(Boolean).join(' ');
    if (cityLine) companyLines.push(cityLine);
    if (company?.country) companyLines.push(company.country);

    const contactLines: string[] = [];
    if (company?.phone) contactLines.push(company.phone);
    if (company?.email) contactLines.push(company.email);
    else contactLines.push('grabspec@proton.me');
    if (company?.website) contactLines.push(company.website);
    else contactLines.push('https://grabspec.vercel.app');

    companyLines.forEach((line, i) => {
      const cell = sheet.getCell(i + 1, infoCol);
      cell.value = line;
      cell.font = i === 0
        ? { bold: true, size: 13, color: { argb: 'FF1E3A5F' } }
        : { size: 10, color: { argb: 'FF475569' } };
    });

    contactLines.forEach((line, i) => {
      const cell = sheet.getCell(i + 1, infoCol + 2);
      cell.value = line;
      cell.font = { size: 9, color: { argb: 'FF64748B' } };
    });

    // --- Project details (col G-H, rows 1-5) ---
    const projCol = 7;
    let projRow = 1;

    if (projectName) {
      const labelCell = sheet.getCell(projRow, projCol);
      labelCell.value = labels.project;
      labelCell.font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
      const valCell = sheet.getCell(projRow, projCol + 1);
      valCell.value = projectName;
      valCell.font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
      projRow++;
    }

    if (projectDetails?.projectNumber) {
      sheet.getCell(projRow, projCol).value = labels.number;
      sheet.getCell(projRow, projCol).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
      sheet.getCell(projRow, projCol + 1).value = projectDetails.projectNumber;
      sheet.getCell(projRow, projCol + 1).font = { size: 10 };
      projRow++;
    }

    if (projectDetails?.client) {
      sheet.getCell(projRow, projCol).value = labels.client;
      sheet.getCell(projRow, projCol).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
      sheet.getCell(projRow, projCol + 1).value = projectDetails.client;
      sheet.getCell(projRow, projCol + 1).font = { size: 10 };
      projRow++;
    }

    if (projectDetails?.architect) {
      sheet.getCell(projRow, projCol).value = labels.architect;
      sheet.getCell(projRow, projCol).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
      sheet.getCell(projRow, projCol + 1).value = projectDetails.architect;
      sheet.getCell(projRow, projCol + 1).font = { size: 10 };
      projRow++;
    }

    if (projectDetails?.siteAddress) {
      sheet.getCell(projRow, projCol).value = labels.site;
      sheet.getCell(projRow, projCol).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
      sheet.getCell(projRow, projCol + 1).value = projectDetails.siteAddress;
      sheet.getCell(projRow, projCol + 1).font = { size: 10 };
      projRow++;
    }

    if (projectDetails?.phase) {
      sheet.getCell(projRow, projCol).value = labels.phase;
      sheet.getCell(projRow, projCol).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
      sheet.getCell(projRow, projCol + 1).value = projectDetails.phase;
      sheet.getCell(projRow, projCol + 1).font = { size: 10 };
      projRow++;
    }

    // Date
    sheet.getCell(projRow, projCol).value = labels.date;
    sheet.getCell(projRow, projCol).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
    sheet.getCell(projRow, projCol + 1).value = new Date().toLocaleDateString(safeLocale === 'en' ? 'en-GB' : safeLocale);
    sheet.getCell(projRow, projCol + 1).font = { size: 10 };

    // Row heights for header section
    for (let r = 1; r <= 5; r++) {
      sheet.getRow(r).height = 18;
    }

    // Separator line
    dataStartRow = 7;
    const sepRow = sheet.getRow(6);
    for (let c = 1; c <= headers.length; c++) {
      const cell = sepRow.getCell(c);
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF2563EB' } } };
    }
  }

  // --- Data table ---
  const headerRow = sheet.getRow(dataStartRow);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  products.forEach((product, index) => {
    const row = sheet.getRow(dataStartRow + 1 + index);
    const values = [
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
    ];
    values.forEach((v, i) => { row.getCell(i + 1).value = v; });

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
    from: { row: dataStartRow, column: 1 },
    to: { row: dataStartRow + products.length, column: headers.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
