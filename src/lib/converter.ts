import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak,
} from 'docx';
import * as cheerio from 'cheerio';

// ─── Font/style constants for PDF rendering ───
const HEADING_SIZES: Record<string, number> = {
  h1: 22, h2: 18, h3: 15, h4: 13, h5: 11.5, h6: 11,
};
const BODY_SIZE = 11;
const LINE_HEIGHT = 1.3;
const LIST_INDENT = 20;
const TABLE_CELL_PAD = 6;

// Font names for pdfkit (standard 14 PDF fonts)
const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  boldItalic: 'Helvetica-BoldOblique',
};

interface RenderState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  listDepth: number;
  listCounter: number[];
  isOrderedList: boolean[];
}

function defaultState(): RenderState {
  return {
    bold: false, italic: false, underline: false,
    fontSize: BODY_SIZE, listDepth: 0,
    listCounter: [], isOrderedList: [],
  };
}

function pickFont(state: RenderState): string {
  if (state.bold && state.italic) return FONTS.boldItalic;
  if (state.bold) return FONTS.bold;
  if (state.italic) return FONTS.italic;
  return FONTS.regular;
}

// ─── Word → PDF ───
export async function convertWordToPdf(
  wordBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth') as {
    convertToHtml: (input: { buffer: Buffer }, options?: Record<string, unknown>) => Promise<{ value: string }>;
    images: { imgElement: (fn: (img: MammothImage) => Promise<{ src: string }>) => unknown };
  };

  interface MammothImage {
    contentType: string;
    read: (encoding: 'base64') => Promise<string>;
  }

  const imageBuffers: Map<string, { data: Buffer; contentType: string }> = new Map();
  let imgIdx = 0;

  const result = await mammoth.convertToHtml(
    { buffer: Buffer.from(wordBuffer) },
    {
      convertImage: mammoth.images.imgElement(async (image: MammothImage) => {
        const base64 = await image.read('base64');
        const id = `mammoth_img_${imgIdx++}`;
        imageBuffers.set(id, {
          data: Buffer.from(base64, 'base64'),
          contentType: image.contentType,
        });
        return { src: id };
      }),
    }
  );

  return renderHtmlToPdf(result.value, imageBuffers);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderHtmlToPdf(
  html: string,
  images: Map<string, { data: Buffer; contentType: string }>
): Promise<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit') as new (opts?: Record<string, unknown>) => any;

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const $ = cheerio.load(html);
  const state = defaultState();
  const pageWidth = 595.28 - 100; // A4 width minus margins

  function ensureSpace(needed: number) {
    if (doc.y + needed > 792 - 50) {
      doc.addPage();
    }
  }

  function renderText(text: string, st: RenderState, opts?: Record<string, unknown>) {
    const font = pickFont(st);
    doc.font(font).fontSize(st.fontSize);
    const textOpts: Record<string, unknown> = {
      lineGap: st.fontSize * (LINE_HEIGHT - 1),
      underline: st.underline,
      continued: false,
      ...opts,
    };
    doc.text(text, textOpts);
  }

  function renderInlineChildren(el: ReturnType<typeof $>, st: RenderState, first = true) {
    el.contents().each((_, node) => {
      if (node.type === 'text') {
        const text = ('data' in node ? (node.data as string) : '') || '';
        if (text.trim() || text.includes(' ')) {
          const font = pickFont(st);
          doc.font(font).fontSize(st.fontSize);
          doc.text(text, {
            lineGap: st.fontSize * (LINE_HEIGHT - 1),
            underline: st.underline,
            continued: true,
          });
        }
      } else if (node.type === 'tag') {
        const tag = ('tagName' in node ? (node.tagName as string) : '')?.toLowerCase();
        const child = $(node);
        const prevState = { ...st };

        if (tag === 'strong' || tag === 'b') st.bold = true;
        else if (tag === 'em' || tag === 'i') st.italic = true;
        else if (tag === 'u') st.underline = true;
        else if (tag === 'br') {
          doc.text('', { continued: false });
          return;
        } else if (tag === 'img') {
          // End any continued text first
          doc.text('', { continued: false });
          const src = child.attr('src') || '';
          const imgData = images.get(src);
          if (imgData) {
            try {
              ensureSpace(120);
              doc.image(imgData.data, { fit: [Math.min(pageWidth, 400), 300] });
              doc.moveDown(0.5);
            } catch { /* skip unreadable images */ }
          }
          return;
        }

        renderInlineChildren(child, st, false);
        Object.assign(st, prevState);
      }
    });

    if (first) {
      doc.text('', { continued: false }); // End the continued chain
    }
  }

  function renderElement(el: ReturnType<typeof $>, st: RenderState) {
    const node = el.get(0);
    const tag = (node && 'tagName' in node ? (node.tagName as string) : '')?.toLowerCase();
    if (!tag) return;

    // Headings
    if (HEADING_SIZES[tag]) {
      ensureSpace(30);
      if (doc.y > 60) doc.moveDown(0.5);
      const prevSize = st.fontSize;
      const prevBold = st.bold;
      st.fontSize = HEADING_SIZES[tag];
      st.bold = true;
      renderInlineChildren(el, st);
      st.fontSize = prevSize;
      st.bold = prevBold;
      doc.moveDown(0.3);
      return;
    }

    // Paragraph
    if (tag === 'p') {
      ensureSpace(15);
      renderInlineChildren(el, st);
      doc.moveDown(0.4);
      return;
    }

    // Lists
    if (tag === 'ul' || tag === 'ol') {
      st.listDepth++;
      st.isOrderedList.push(tag === 'ol');
      st.listCounter.push(0);
      el.children('li').each((_, li) => {
        st.listCounter[st.listCounter.length - 1]++;
        const indent = st.listDepth * LIST_INDENT;
        const isOrdered = st.isOrderedList[st.isOrderedList.length - 1];
        const counter = st.listCounter[st.listCounter.length - 1];
        const bullet = isOrdered ? `${counter}. ` : '\u2022 ';

        ensureSpace(15);
        const x = 50 + indent;
        doc.font(FONTS.regular).fontSize(BODY_SIZE);
        doc.text(bullet, x, doc.y, { continued: true, lineGap: BODY_SIZE * (LINE_HEIGHT - 1) });
        renderInlineChildren($(li), st, true);
        doc.moveDown(0.15);
      });
      st.listDepth--;
      st.isOrderedList.pop();
      st.listCounter.pop();
      doc.moveDown(0.3);
      return;
    }

    // Tables
    if (tag === 'table') {
      ensureSpace(30);
      doc.moveDown(0.3);
      const rows: string[][] = [];
      el.find('tr').each((_, tr) => {
        const cells: string[] = [];
        $(tr).find('td, th').each((__, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) rows.push(cells);
      });

      if (rows.length === 0) return;
      const maxCols = Math.max(...rows.map(r => r.length));
      const colWidth = Math.min(pageWidth / maxCols, 200);
      const startX = 50;

      for (const row of rows) {
        ensureSpace(20);
        const y = doc.y;
        for (let c = 0; c < maxCols; c++) {
          const text = row[c] || '';
          const x = startX + c * colWidth;
          doc.font(FONTS.regular).fontSize(BODY_SIZE - 1);
          doc.text(text, x + TABLE_CELL_PAD, y + TABLE_CELL_PAD, {
            width: colWidth - TABLE_CELL_PAD * 2,
            lineGap: 2,
          });
          // Cell border
          doc.rect(x, y, colWidth, 20).stroke('#cccccc');
        }
        doc.y = y + 22;
      }
      doc.moveDown(0.3);
      return;
    }

    // Images at block level
    if (tag === 'img') {
      const src = el.attr('src') || '';
      const imgData = images.get(src);
      if (imgData) {
        try {
          ensureSpace(120);
          doc.image(imgData.data, { fit: [Math.min(pageWidth, 400), 300] });
          doc.moveDown(0.5);
        } catch { /* skip */ }
      }
      return;
    }

    // Div, section, article, etc → just render children
    if (['div', 'section', 'article', 'span', 'main', 'header', 'footer', 'nav', 'aside'].includes(tag)) {
      el.children().each((_, child) => {
        renderElement($(child), st);
      });
      return;
    }

    // Blockquote
    if (tag === 'blockquote') {
      const prevX = 50;
      doc.x = prevX + 20;
      st.italic = true;
      el.children().each((_, child) => {
        renderElement($(child), st);
      });
      st.italic = false;
      doc.x = prevX;
      return;
    }

    // Pre/code
    if (tag === 'pre' || tag === 'code') {
      ensureSpace(20);
      doc.font('Courier').fontSize(BODY_SIZE - 1);
      doc.text(el.text(), { lineGap: 3 });
      doc.moveDown(0.4);
      return;
    }

    // Fallback: render text content
    const text = el.text().trim();
    if (text) {
      renderText(text, st);
      doc.moveDown(0.2);
    }
  }

  // Process all top-level elements
  $('body').children().each((_, child) => {
    renderElement($(child), state);
  });

  doc.end();

  return new Promise<ArrayBuffer>((resolve, reject) => {
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
    });
    doc.on('error', reject);
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── PDF → Word ───
export async function convertPdfToWord(
  pdfBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const { extractText } = await import('unpdf');
  const result = await extractText(new Uint8Array(pdfBuffer), { mergePages: false });
  const pages = (Array.isArray(result.text) ? result.text : [result.text]) as string[];

  const sections = pages.map((pageText, pageIdx) => ({
    properties: pageIdx > 0 ? { page: { size: { width: 12240, height: 15840 } } } : {},
    children: analyzePageStructure(pageText),
  }));

  const doc = new Document({ sections });
  const uint8 = await Packer.toBuffer(doc);
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

function analyzePageStructure(pageText: string): (Paragraph | Table)[] {
  const lines = pageText.split('\n');
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line → spacer
    if (!trimmed) {
      elements.push(new Paragraph({ spacing: { after: 120 } }));
      i++;
      continue;
    }

    // Detect heading: short line, all uppercase, or very short
    if (isLikelyHeading(trimmed, lines, i)) {
      const level = detectHeadingLevel(trimmed);
      elements.push(new Paragraph({
        heading: level,
        children: [new TextRun({ text: trimmed, bold: true })],
        spacing: { before: 240, after: 120 },
      }));
      i++;
      continue;
    }

    // Detect bullet list
    const bulletMatch = trimmed.match(/^[•\-\u2022\u2023\u25E6\u25AA\u25CB]\s*(.+)/);
    if (bulletMatch) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: bulletMatch[1] })],
        bullet: { level: 0 },
        spacing: { after: 60 },
      }));
      i++;
      continue;
    }

    // Detect numbered list
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      elements.push(new Paragraph({
        children: [new TextRun({ text: numMatch[2] })],
        numbering: { reference: 'default-numbering', level: 0 },
        spacing: { after: 60 },
      }));
      i++;
      continue;
    }

    // Regular paragraph — merge consecutive non-empty lines
    const paraLines: string[] = [trimmed];
    while (i + 1 < lines.length && lines[i + 1].trim() && !isLikelyHeading(lines[i + 1].trim(), lines, i + 1) && !isListLine(lines[i + 1].trim())) {
      i++;
      paraLines.push(lines[i].trim());
    }

    elements.push(new Paragraph({
      children: [new TextRun({ text: paraLines.join(' '), size: 24 })],
      spacing: { after: 120, line: 276 },
    }));
    i++;
  }

  return elements;
}

function isLikelyHeading(line: string, allLines: string[], idx: number): boolean {
  // All uppercase and short
  if (line === line.toUpperCase() && line.length <= 80 && line.length >= 2 && /[A-Z]/.test(line)) {
    return true;
  }
  // Short line (< 60 chars) followed by empty line or content, and doesn't end with common endings
  if (line.length <= 60 && !line.endsWith('.') && !line.endsWith(',') && !line.endsWith(';')) {
    const nextLine = idx + 1 < allLines.length ? allLines[idx + 1]?.trim() : '';
    const prevLine = idx > 0 ? allLines[idx - 1]?.trim() : '';
    // Preceded by empty line and followed by content
    if (prevLine === '' && nextLine !== '' && line.length <= 50) {
      return true;
    }
  }
  return false;
}

function detectHeadingLevel(line: string): typeof HeadingLevel[keyof typeof HeadingLevel] {
  if (line === line.toUpperCase() && line.length <= 40) return HeadingLevel.HEADING_1;
  if (line.length <= 30) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
}

function isListLine(line: string): boolean {
  return /^[•\-\u2022\u2023\u25E6\u25AA\u25CB]\s/.test(line) || /^\d+[.)]\s/.test(line);
}

// ─── Utilities ───
export function detectFileType(
  filename: string
): 'pdf' | 'word' | 'unknown' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'word';
  return 'unknown';
}

export function getOutputFilename(
  inputFilename: string,
  targetType: 'pdf' | 'word'
): string {
  const baseName = inputFilename.replace(/\.[^.]+$/, '');
  return targetType === 'word' ? `${baseName}.docx` : `${baseName}.pdf`;
}
