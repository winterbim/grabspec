/**
 * Client-side document parser.
 * Extracts raw text from PDF, Excel, CSV, Word, and plain text files.
 * Zero server upload — everything runs in the browser.
 */

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.xlsx', '.xls', '.csv', '.tsv',
  '.docx', '.doc', '.txt',
];

export function isSupportedFormat(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

/**
 * Parse any supported document and return its text content.
 */
export async function parseDocument(file: File): Promise<string> {
  const ext = getFileExtension(file.name);

  switch (ext) {
    case '.pdf':
      return parsePdf(file);
    case '.xlsx':
    case '.xls':
      return parseExcel(file);
    case '.csv':
    case '.tsv':
      return parseCsv(file);
    case '.docx':
    case '.doc':
      return parseWord(file);
    case '.txt':
      return file.text();
    default:
      throw new Error(`Unsupported format: ${ext}`);
  }
}

// ─── PDF via pdfjs-dist ──────────────────────────────────────

async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Use CDN worker matching the installed version
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 200);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item) => 'str' in item)
      .map((item) => (item as { str: string }).str);
    pages.push(strings.join(' '));
  }

  return pages.join('\n');
}

// ─── Excel via ExcelJS (already installed) ───────────────────

async function parseExcel(file: File): Promise<string> {
  const excelMod = await import('exceljs');
  const ExcelJS = 'default' in excelMod ? (excelMod.default as typeof excelMod) : excelMod;
  const wb = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await wb.xlsx.load(buffer);

  const lines: string[] = [];
  for (const ws of wb.worksheets.slice(0, 10)) {
    let rowCount = 0;
    ws.eachRow((row) => {
      if (rowCount >= 5000) return;
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        const val = cell.text || String(cell.value ?? '');
        if (val.trim()) cells.push(val.trim());
      });
      if (cells.length > 0) lines.push(cells.join(' | '));
      rowCount++;
    });
  }

  return lines.join('\n');
}

// ─── CSV via papaparse ───────────────────────────────────────

async function parseCsv(file: File): Promise<string> {
  const Papa = await import('papaparse');
  const text = await file.text();
  const result = Papa.default.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  });

  return result.data
    .map((row) => row.filter((cell) => cell.trim()).join(' | '))
    .filter((line) => line.length > 0)
    .join('\n');
}

// ─── Word via mammoth ────────────────────────────────────────

async function parseWord(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}
