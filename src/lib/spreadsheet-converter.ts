/**
 * Client-side spreadsheet and text document converters.
 * Uses ExcelJS for XLSX/XLS/CSV, jsPDF for PDF generation.
 * Runs entirely in the browser — no server needed.
 */

export interface DocConversionResult {
  blob: Blob;
  filename: string;
  size: number;
  duration: number;
}

// ─── File type detection ───

const SPREADSHEET_EXTS = new Set(['.xlsx', '.xls', '.csv', '.tsv']);
const TEXT_EXTS = new Set(['.txt', '.html', '.htm', '.md', '.json']);

export function isSpreadsheetFile(file: File): boolean {
  return SPREADSHEET_EXTS.has(extOf(file));
}

export function isTextFile(file: File): boolean {
  return TEXT_EXTS.has(extOf(file));
}

function extOf(file: File): string {
  return file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
}

function baseName(file: File): string {
  return file.name.replace(/\.[^.]+$/, '');
}

// ─── ExcelJS helpers ───

async function loadWorkbook(file: File) {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
  const wb = new ExcelJS.Workbook();
  const ext = extOf(file);

  if (ext === '.csv' || ext === '.tsv') {
    const text = await file.text();
    const sep = ext === '.tsv' ? '\t' : ',';
    const ws = wb.addWorksheet('Sheet1');
    text.split('\n').forEach((line) => {
      if (line.trim()) ws.addRow(parseCsvLine(line, sep));
    });
  } else if (ext === '.xls') {
    // XLS (BIFF) format: ExcelJS cannot read it directly.
    // We parse it using a lightweight approach via the binary content.
    const buffer = await file.arrayBuffer();
    try {
      // Try XLSX first in case it's misnamed
      await wb.xlsx.load(buffer);
    } catch {
      // Fallback: extract text content from XLS binary
      const rows = parseXlsBinary(new Uint8Array(buffer));
      const ws = wb.addWorksheet('Sheet1');
      rows.forEach((row) => ws.addRow(row));
    }
  } else {
    const buffer = await file.arrayBuffer();
    await wb.xlsx.load(buffer);
  }

  return wb;
}

/**
 * Lightweight XLS (BIFF) parser — extracts cell text from the binary stream.
 * Handles BIFF8 (Excel 97-2003) which is the most common XLS format.
 * For complex spreadsheets, some formatting will be lost but data is preserved.
 */
function parseXlsBinary(data: Uint8Array): string[][] {
  const rows: Map<number, Map<number, string>> = new Map();
  // Shared String Table for BIFF8
  const sst: string[] = [];
  let pos = 0;

  // Helper to read a 16-bit little-endian unsigned int
  const u16 = (offset: number) => data[offset] | (data[offset + 1] << 8);
  // Helper to read a 32-bit little-endian unsigned int
  const u32 = (offset: number) =>
    data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | ((data[offset + 3] << 24) >>> 0);

  // Read string from BIFF8 format
  function readBiff8String(offset: number, charCount: number): { text: string; bytesConsumed: number } {
    if (offset >= data.length) return { text: '', bytesConsumed: 0 };
    const flags = data[offset];
    const isUnicode = (flags & 0x01) !== 0;
    let bytesConsumed = 1; // flags byte
    let text = '';

    if (isUnicode) {
      for (let i = 0; i < charCount && offset + bytesConsumed + 1 < data.length; i++) {
        text += String.fromCharCode(u16(offset + bytesConsumed));
        bytesConsumed += 2;
      }
    } else {
      for (let i = 0; i < charCount && offset + bytesConsumed < data.length; i++) {
        text += String.fromCharCode(data[offset + bytesConsumed]);
        bytesConsumed += 1;
      }
    }
    return { text, bytesConsumed };
  }

  function setCell(row: number, col: number, value: string) {
    if (!rows.has(row)) rows.set(row, new Map());
    rows.get(row)!.set(col, value);
  }

  while (pos + 4 <= data.length) {
    const recordType = u16(pos);
    const recordLen = u16(pos + 2);
    const recordData = pos + 4;

    if (recordType === 0x00FC && recordLen >= 8) {
      // SST (Shared String Table)
      const totalStrings = u32(recordData + 4);
      let sstPos = recordData + 8;
      for (let i = 0; i < totalStrings && sstPos + 3 <= pos + 4 + recordLen; i++) {
        const charCount = u16(sstPos);
        sstPos += 2;
        const { text, bytesConsumed } = readBiff8String(sstPos, charCount);
        sst.push(text);
        sstPos += bytesConsumed;
      }
    } else if (recordType === 0x00FD && recordLen >= 10) {
      // LABELSST — string cell referencing SST
      const row = u16(recordData);
      const col = u16(recordData + 2);
      const sstIndex = u32(recordData + 6);
      if (sstIndex < sst.length) {
        setCell(row, col, sst[sstIndex]);
      }
    } else if (recordType === 0x0204 && recordLen >= 7) {
      // LABEL — inline string cell (BIFF2-BIFF5)
      const row = u16(recordData);
      const col = u16(recordData + 2);
      const strLen = u16(recordData + 6);
      let text = '';
      for (let i = 0; i < strLen && recordData + 8 + i < pos + 4 + recordLen; i++) {
        text += String.fromCharCode(data[recordData + 8 + i]);
      }
      setCell(row, col, text);
    } else if (recordType === 0x0203 && recordLen >= 14) {
      // NUMBER — numeric cell
      const row = u16(recordData);
      const col = u16(recordData + 2);
      // Read 64-bit IEEE 754 float
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      for (let i = 0; i < 8; i++) view.setUint8(i, data[recordData + 6 + i]);
      const num = view.getFloat64(0, true);
      setCell(row, col, Number.isInteger(num) ? num.toString() : num.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''));
    } else if (recordType === 0x027E && recordLen >= 10) {
      // RK — compact number cell
      const row = u16(recordData);
      const col = u16(recordData + 2);
      const rkVal = u32(recordData + 6);
      let num: number;
      if (rkVal & 0x02) {
        num = rkVal >> 2;
      } else {
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setUint32(4, rkVal & 0xFFFFFFFC, true);
        num = view.getFloat64(0, true);
      }
      if (rkVal & 0x01) num /= 100;
      setCell(row, col, Number.isInteger(num) ? num.toString() : num.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''));
    }

    pos += 4 + recordLen;
    if (recordLen === 0 && recordType === 0) break; // EOF safety
  }

  // Convert map to array
  if (rows.size === 0) return [];
  const maxRow = Math.max(...rows.keys());
  const maxCol = Math.max(...[...rows.values()].flatMap((cols) => [...cols.keys()]));
  const result: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    const rowData = rows.get(r);
    for (let c = 0; c <= maxCol; c++) {
      row.push(rowData?.get(c) ?? '');
    }
    result.push(row);
  }
  return result;
}

/** Simple CSV line parser — handles quoted fields */
function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Extract all rows from first worksheet as string[][] */
async function extractRows(file: File): Promise<string[][]> {
  const wb = await loadWorkbook(file);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: string[][] = [];
  ws.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(cell.text || stringifyCell(cell.value));
    });
    rows.push(cells);
  });
  return rows;
}

// ─── XLSX → CSV ───

export async function convertXlsxToCsv(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const rows = await extractRows(file);
  const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.csv`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → JSON ───

export async function convertXlsxToJson(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const rows = await extractRows(file);
  if (rows.length < 2) throw new Error('Spreadsheet must have at least a header row and one data row');

  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj;
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.json`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → TXT ───

export async function convertXlsxToTxt(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const rows = await extractRows(file);
  const txt = rows.map((r) => r.join('\t')).join('\n');
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.txt`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → HTML ───

export async function convertXlsxToHtml(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const rows = await extractRows(file);
  const headerRow = rows[0] ?? [];
  const dataRows = rows.slice(1);

  const thCells = headerRow.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const bodyRows = dataRows.map((r) => {
    const tdCells = r.map((c) => `<td>${escapeHtml(c)}</td>`).join('');
    return `<tr>${tdCells}</tr>`;
  }).join('\n');
  const tableHtml = `<table>\n<thead><tr>${thCells}</tr></thead>\n<tbody>${bodyRows}</tbody>\n</table>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(baseName(file))}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#222}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #ddd;padding:8px 12px;text-align:left}
th{background:#f8f9fa;font-weight:600;position:sticky;top:0}
tr:nth-child(even){background:#fafafa}tr:hover{background:#f0f7ff}</style>
</head><body><h1>${escapeHtml(baseName(file))}</h1>${tableHtml}</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.html`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLS → XLSX (binary Excel 97-2003 → modern Excel) ───

export async function convertXlsToXlsx(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const wb = await loadWorkbook(file); // loadWorkbook now handles XLS

  // Auto-width columns
  const ws = wb.worksheets[0];
  if (ws) {
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.((cell) => {
        const len = stringifyCell(cell.value).length;
        if (len > maxLen) maxLen = Math.min(len, 50);
      });
      col.width = maxLen + 2;
    });
    // Bold first row
    const firstRow = ws.getRow(1);
    firstRow.font = { bold: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `${baseName(file)}.xlsx`, size: blob.size, duration: performance.now() - t0 };
}

// ─── CSV → XLSX ───

export async function convertCsvToXlsx(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  const text = await file.text();
  const sep = extOf(file) === '.tsv' ? '\t' : ',';

  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    const values = parseCsvLine(line, sep);
    const row = ws.addRow(values);
    if (i === 0) row.font = { bold: true };
  });

  // Auto-width columns
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.((cell) => {
      const len = stringifyCell(cell.value).length;
      if (len > maxLen) maxLen = Math.min(len, 50);
    });
    col.width = maxLen + 2;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `${baseName(file)}.xlsx`, size: blob.size, duration: performance.now() - t0 };
}

// ─── CSV → JSON ───

export async function convertCsvToJson(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const text = await file.text();
  const sep = extOf(file) === '.tsv' ? '\t' : ',';
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('File must have at least a header row and one data row');

  const headers = parseCsvLine(lines[0], sep);
  const data = lines.slice(1).map((line) => {
    const vals = parseCsvLine(line, sep);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.json`, size: blob.size, duration: performance.now() - t0 };
}

// ─── JSON → CSV ───

export async function convertJsonToCsv(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const text = await file.text();
  const data: Record<string, unknown>[] = JSON.parse(text);
  if (!Array.isArray(data) || data.length === 0) throw new Error('JSON must be an array of objects');

  const headers = Object.keys(data[0]);
  const csv = [
    headers.map((h) => `"${h}"`).join(','),
    ...data.map((row) => headers.map((h) => {
      const s = stringifyCell(row[h]);
      return `"${s.replaceAll('"', '""')}"`;
    }).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.csv`, size: blob.size, duration: performance.now() - t0 };
}

// ─── JSON → XLSX ───

export async function convertJsonToXlsx(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
  const text = await file.text();
  const data: Record<string, unknown>[] = JSON.parse(text);
  if (!Array.isArray(data) || data.length === 0) throw new Error('JSON must be an array of objects');

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');

  const headers = Object.keys(data[0]);
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };

  data.forEach((row) => {
    ws.addRow(headers.map((h) => stringifyCell(row[h])));
  });

  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.((cell) => {
      const len = stringifyCell(cell.value).length;
      if (len > maxLen) maxLen = Math.min(len, 50);
    });
    col.width = maxLen + 2;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `${baseName(file)}.xlsx`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → PDF (ExcelJS → HTML → html2canvas → jsPDF) ───

export async function convertXlsxToPdf(file: File): Promise<DocConversionResult> {
  const htmlResult = await convertXlsxToHtml(file);
  const htmlFile = new File([htmlResult.blob], 'temp.html', { type: 'text/html' });
  const pdfResult = await convertHtmlToPdf(htmlFile);
  return { ...pdfResult, filename: `${baseName(file)}.pdf` };
}

// ─── TXT → PDF (jsPDF) ───

export async function convertTxtToPdf(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const { default: jsPDF } = await import('jspdf');
  const text = await file.text();
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 20;
  const pageWidth = 210 - margin * 2;
  const lineHeight = 5;
  const maxLines = Math.floor((297 - margin * 2) / lineHeight);

  pdf.setFont('Courier', 'normal');
  pdf.setFontSize(10);

  const wrappedLines = pdf.splitTextToSize(text, pageWidth);
  let currentLine = 0;

  for (const line of wrappedLines) {
    if (currentLine >= maxLines) {
      pdf.addPage();
      currentLine = 0;
    }
    pdf.text(line, margin, margin + currentLine * lineHeight);
    currentLine++;
  }

  const blob = pdf.output('blob');
  return { blob, filename: `${baseName(file)}.pdf`, size: blob.size, duration: performance.now() - t0 };
}

// ─── HTML → PDF (html2canvas + jsPDF) ───

export async function convertHtmlToPdf(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');
  const htmlContent = await file.text();

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;padding:40px 50px;' +
    'font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;' +
    'color:#000;background:#fff;';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794 });
  container.remove();

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= 297;

  while (heightLeft > 0) {
    position -= 297;
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
  }

  const blob = pdf.output('blob');
  return { blob, filename: `${baseName(file)}.pdf`, size: blob.size, duration: performance.now() - t0 };
}

// ─── Markdown → PDF ───

export async function convertMdToPdf(file: File): Promise<DocConversionResult> {
  const text = await file.text();
  const html = markdownToHtml(text);
  const wrappedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:700px;margin:0 auto}
h1{font-size:24px;border-bottom:2px solid #eee;padding-bottom:8px;margin:24px 0 12px}
h2{font-size:20px;margin:20px 0 10px}h3{font-size:16px;margin:16px 0 8px}
p{margin:0 0 10px}code{background:#f5f5f5;padding:2px 5px;border-radius:3px;font-size:13px}
pre{background:#f5f5f5;padding:14px;border-radius:4px;overflow-x:auto;font-size:13px}
pre code{background:none;padding:0}blockquote{border-left:3px solid #ddd;margin:0;padding:4px 16px;color:#555}
ul,ol{padding-left:24px}li{margin-bottom:4px}table{border-collapse:collapse;width:100%}
td,th{border:1px solid #ddd;padding:6px 10px}th{background:#f9f9f9;font-weight:600}
img{max-width:100%}a{color:#2563eb}hr{border:0;border-top:1px solid #eee;margin:20px 0}</style>
</head><body>${html}</body></html>`;

  const blob = new Blob([wrappedHtml], { type: 'text/html;charset=utf-8' });
  const htmlFile = new File([blob], 'temp.html', { type: 'text/html' });
  const result = await convertHtmlToPdf(htmlFile);
  return { ...result, filename: `${baseName(file)}.pdf` };
}

// ─── Markdown → HTML ───

export async function convertMdToHtml(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const text = await file.text();
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(baseName(file))}</title>
<style>body{font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:700px;margin:0 auto;padding:24px}
h1{border-bottom:2px solid #eee;padding-bottom:8px}code{background:#f5f5f5;padding:2px 5px;border-radius:3px}
pre{background:#f5f5f5;padding:14px;border-radius:4px;overflow-x:auto}blockquote{border-left:3px solid #ddd;margin:0;padding:4px 16px;color:#555}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px}th{background:#f9f9f9}</style>
</head><body>${markdownToHtml(text)}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.html`, size: blob.size, duration: performance.now() - t0 };
}

// ─── Helpers ───

/** Safely convert any cell value to string without [object Object] */
function stringifyCell(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string') return v;
  return `${v as string | number | boolean}`;
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function markdownToHtml(md: string): string {
  let html = md
    .replaceAll(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replaceAll(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replaceAll(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replaceAll(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replaceAll(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replaceAll(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replaceAll(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replaceAll(/^---+$/gm, '<hr>')
    .replaceAll(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
    .replaceAll(/`([^`]+)`/g, '<code>$1</code>')
    .replaceAll(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replaceAll(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replaceAll(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    .replaceAll(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replaceAll(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>');

  html = html.replaceAll(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  return html;
}
