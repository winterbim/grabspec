/**
 * Client-side spreadsheet and text document converters.
 * XLSX ↔ CSV, TXT/HTML/MD → PDF, XLSX → PDF — runs entirely in the browser.
 */

export interface DocConversionResult {
  blob: Blob;
  filename: string;
  size: number;
  duration: number;
}

// ─── File type detection ───

const SPREADSHEET_EXTS = new Set(['.xlsx', '.xls', '.csv', '.tsv', '.ods']);
const TEXT_EXTS = new Set(['.txt', '.html', '.htm', '.md', '.rtf', '.xml', '.json']);

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

// ─── XLSX → CSV (client-side, SheetJS) ───

export async function convertXlsxToCsv(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const XLSX = await import('xlsx');
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.csv`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → JSON (client-side, SheetJS) ───

export async function convertXlsxToJson(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const XLSX = await import('xlsx');
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws);
  const text = JSON.stringify(json, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.json`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → TXT (client-side, SheetJS) ───

export async function convertXlsxToTxt(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const XLSX = await import('xlsx');
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const txt = XLSX.utils.sheet_to_txt(ws);
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.txt`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → HTML (client-side, SheetJS) ───

export async function convertXlsxToHtml(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const XLSX = await import('xlsx');
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName(file)}</title>
<style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5;font-weight:600}tr:hover{background:#f9f9f9}</style>
</head><body>${XLSX.utils.sheet_to_html(ws)}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.html`, size: blob.size, duration: performance.now() - t0 };
}

// ─── CSV → XLSX (client-side, SheetJS) ───

export async function convertCsvToXlsx(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const XLSX = await import('xlsx');
  const text = await file.text();
  const ws = XLSX.utils.aoa_to_sheet(
    text.split('\n').map((row) => row.split(isTsv(file) ? '\t' : ',')),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `${baseName(file)}.xlsx`, size: blob.size, duration: performance.now() - t0 };
}

// ─── CSV → JSON (client-side) ───

export async function convertCsvToJson(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const text = await file.text();
  const sep = isTsv(file) ? '\t' : ',';
  const lines = text.trim().split('\n');
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(sep);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim().replace(/^"|"$/g, ''); });
    return obj;
  });
  const json = JSON.stringify(rows, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.json`, size: blob.size, duration: performance.now() - t0 };
}

// ─── TXT → PDF (client-side, jsPDF) ───

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

  for (let i = 0; i < wrappedLines.length; i++) {
    if (currentLine >= maxLines) {
      pdf.addPage();
      currentLine = 0;
    }
    pdf.text(wrappedLines[i], margin, margin + currentLine * lineHeight);
    currentLine++;
  }

  const blob = pdf.output('blob');
  return { blob, filename: `${baseName(file)}.pdf`, size: blob.size, duration: performance.now() - t0 };
}

// ─── HTML → PDF (client-side, html2canvas + jsPDF) ───

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
  document.body.removeChild(container);

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

// ─── Markdown → PDF (parse → HTML → PDF) ───

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
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName(file)}</title>
<style>body{font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:700px;margin:0 auto;padding:24px}
h1{border-bottom:2px solid #eee;padding-bottom:8px}code{background:#f5f5f5;padding:2px 5px;border-radius:3px}
pre{background:#f5f5f5;padding:14px;border-radius:4px;overflow-x:auto}blockquote{border-left:3px solid #ddd;margin:0;padding:4px 16px;color:#555}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px}th{background:#f9f9f9}</style>
</head><body>${markdownToHtml(text)}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.html`, size: blob.size, duration: performance.now() - t0 };
}

// ─── JSON → CSV ───

export async function convertJsonToCsv(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const text = await file.text();
  const data: Record<string, unknown>[] = JSON.parse(text);
  if (!Array.isArray(data) || data.length === 0) throw new Error('JSON must be an array of objects');
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  return { blob, filename: `${baseName(file)}.csv`, size: blob.size, duration: performance.now() - t0 };
}

// ─── JSON → XLSX ───

export async function convertJsonToXlsx(file: File): Promise<DocConversionResult> {
  const t0 = performance.now();
  const XLSX = await import('xlsx');
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('JSON must be an array of objects');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `${baseName(file)}.xlsx`, size: blob.size, duration: performance.now() - t0 };
}

// ─── XLSX → PDF (SheetJS → HTML table → html2canvas → jsPDF) ───

export async function convertXlsxToPdf(file: File): Promise<DocConversionResult> {
  const result = await convertXlsxToHtml(file);
  const htmlFile = new File([result.blob], 'temp.html', { type: 'text/html' });
  const pdfResult = await convertHtmlToPdf(htmlFile);
  return { ...pdfResult, filename: `${baseName(file)}.pdf` };
}

// ─── Helpers ───

function isTsv(file: File): boolean {
  return file.name.toLowerCase().endsWith('.tsv');
}

/** Minimal Markdown parser — covers 90% of common use cases */
function markdownToHtml(md: string): string {
  let html = md
    // Code blocks (fenced)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Headings
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  return html;
}
