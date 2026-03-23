/**
 * Client-side PDF tools using pdf-lib.
 * Merge, split, compress, rotate, extract pages, add page numbers.
 * Runs entirely in the browser — no server needed.
 */
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export interface PdfToolResult {
  blob: Blob;
  filename: string;
  size: number;
  duration: number;
  pageCount?: number;
}

/** Create a PDF Blob from Uint8Array (TS strict compat) */
function pdfBlob(bytes: Uint8Array): Blob {
  // Copy into a clean ArrayBuffer to satisfy BlobPart typing
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], { type: 'application/pdf' });
}

// ─── Merge PDFs ───

export async function mergePdfs(files: File[]): Promise<PdfToolResult> {
  const t0 = performance.now();
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const pdfBytes = await merged.save();
  const blob = pdfBlob(pdfBytes);

  return {
    blob,
    filename: 'merged.pdf',
    size: blob.size,
    duration: performance.now() - t0,
    pageCount: merged.getPageCount(),
  };
}

// ─── Split PDF (one file per page) ───

export async function splitPdf(
  file: File,
): Promise<PdfToolResult[]> {
  const t0 = performance.now();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const baseName = file.name.replace(/\.pdf$/i, '');
  const results: PdfToolResult[] = [];

  for (let i = 0; i < source.getPageCount(); i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(source, [i]);
    doc.addPage(page);
    const pageBytes = await doc.save();
    const blob = pdfBlob(pageBytes);
    results.push({
      blob,
      filename: `${baseName}_page_${i + 1}.pdf`,
      size: blob.size,
      duration: performance.now() - t0,
      pageCount: 1,
    });
  }

  return results;
}

// ─── Extract specific pages ───

export async function extractPages(
  file: File,
  pageNumbers: number[], // 1-based
): Promise<PdfToolResult> {
  const t0 = performance.now();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const doc = await PDFDocument.create();
  const baseName = file.name.replace(/\.pdf$/i, '');

  // Convert 1-based to 0-based, clamp to valid range
  const indices = pageNumbers
    .map((n) => n - 1)
    .filter((i) => i >= 0 && i < source.getPageCount());

  const pages = await doc.copyPages(source, indices);
  pages.forEach((page) => doc.addPage(page));

  const pdfBytes = await doc.save();
  const blob = pdfBlob(pdfBytes);
  const label = pageNumbers.join('-');

  return {
    blob,
    filename: `${baseName}_pages_${label}.pdf`,
    size: blob.size,
    duration: performance.now() - t0,
    pageCount: doc.getPageCount(),
  };
}

// ─── Rotate all pages ───

export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270,
): Promise<PdfToolResult> {
  const t0 = performance.now();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  doc.getPages().forEach((page) => {
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  });

  const pdfBytes = await doc.save();
  const blob = pdfBlob(pdfBytes);

  return {
    blob,
    filename: file.name.replace(/\.pdf$/i, `_rotated_${angle}.pdf`),
    size: blob.size,
    duration: performance.now() - t0,
    pageCount: doc.getPageCount(),
  };
}

// ─── Compress PDF (strip metadata, flatten annotations) ───

export async function compressPdf(file: File): Promise<PdfToolResult> {
  const t0 = performance.now();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });

  // Create a fresh document and copy pages (strips unused objects)
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(source, source.getPageIndices());
  pages.forEach((page) => doc.addPage(page));

  // Copy metadata
  const title = source.getTitle();
  if (title) doc.setTitle(title);

  const pdfBytes = await doc.save({
    useObjectStreams: true,       // Better compression
    addDefaultPage: false,
  });

  const blob = pdfBlob(pdfBytes);

  return {
    blob,
    filename: file.name.replace(/\.pdf$/i, '_compressed.pdf'),
    size: blob.size,
    duration: performance.now() - t0,
    pageCount: doc.getPageCount(),
  };
}

// ─── Add page numbers ───

export async function addPageNumbers(
  file: File,
  position: 'bottom-center' | 'bottom-right' = 'bottom-center',
): Promise<PdfToolResult> {
  const t0 = performance.now();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const text = `${i + 1} / ${total}`;
    const textWidth = font.widthOfTextAtSize(text, 10);

    const x = position === 'bottom-center'
      ? (width - textWidth) / 2
      : width - textWidth - 40;

    page.drawText(text, {
      x,
      y: 25,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  const pdfBytes = await doc.save();
  const blob = pdfBlob(pdfBytes);

  return {
    blob,
    filename: file.name.replace(/\.pdf$/i, '_numbered.pdf'),
    size: blob.size,
    duration: performance.now() - t0,
    pageCount: total,
  };
}

// ─── Get PDF info ───

export async function getPdfInfo(file: File): Promise<{
  pageCount: number;
  title: string | undefined;
  author: string | undefined;
  size: number;
}> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle(),
    author: doc.getAuthor(),
    size: file.size,
  };
}
