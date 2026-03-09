import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

// ─── Word → PDF (mammoth → HTML → Chromium headless → PDF) ───
export async function convertWordToPdf(
  wordBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth') as MammothModule;

  // Convert DOCX → HTML preserving all formatting + images
  const result = await mammoth.convertToHtml(
    { buffer: Buffer.from(wordBuffer) },
    {
      convertImage: mammoth.images.imgElement(async (image: MammothImage) => {
        const base64 = await image.read('base64');
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    }
  );

  const html = wrapHtmlDocument(result.value);
  return renderHtmlToPdf(html);
}

interface MammothImage {
  contentType: string;
  read: (encoding: 'base64') => Promise<string>;
}

interface MammothModule {
  convertToHtml: (
    input: { buffer: Buffer },
    options?: Record<string, unknown>
  ) => Promise<{ value: string }>;
  images: {
    imgElement: (
      fn: (img: MammothImage) => Promise<{ src: string }>
    ) => unknown;
  };
}

function wrapHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #222; padding: 0; }
  h1 { font-size: 22pt; margin: 20pt 0 12pt; font-weight: 700; }
  h2 { font-size: 18pt; margin: 18pt 0 10pt; font-weight: 700; }
  h3 { font-size: 14pt; margin: 16pt 0 8pt; font-weight: 600; }
  h4 { font-size: 12pt; margin: 14pt 0 6pt; font-weight: 600; }
  h5, h6 { font-size: 11pt; margin: 12pt 0 4pt; font-weight: 600; }
  p { margin: 0 0 8pt; orphans: 3; widows: 3; }
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; page-break-inside: avoid; }
  td, th { border: 1px solid #bbb; padding: 6pt 8pt; vertical-align: top; }
  th { background: #f0f0f0; font-weight: 600; }
  img { max-width: 100%; height: auto; margin: 8pt 0; }
  ul, ol { padding-left: 24pt; margin: 6pt 0; }
  li { margin-bottom: 3pt; }
  blockquote { border-left: 3px solid #ccc; padding-left: 14pt; margin: 10pt 0; color: #555; font-style: italic; }
  pre { font-family: 'Courier New', Courier, monospace; background: #f5f5f5; padding: 10pt; border-radius: 3pt; margin: 8pt 0; font-size: 9.5pt; white-space: pre-wrap; }
  code { font-family: 'Courier New', Courier, monospace; background: #f5f5f5; padding: 1pt 3pt; font-size: 9.5pt; }
  a { color: #2563eb; text-decoration: underline; }
  sup { vertical-align: super; font-size: 0.8em; }
  sub { vertical-align: sub; font-size: 0.8em; }
</style>
</head><body>${bodyHtml}</body></html>`;
}

async function renderHtmlToPdf(html: string): Promise<ArrayBuffer> {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = (await import('puppeteer-core')).default;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' },
      displayHeaderFooter: false,
    });

    const ab = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer;
    return ab;
  } finally {
    await browser.close();
  }
}

// ─── PDF → Word (unpdf → structure analysis → DOCX) ───
export async function convertPdfToWord(
  pdfBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const { extractText } = await import('unpdf');
  const result = await extractText(new Uint8Array(pdfBuffer), {
    mergePages: false,
  });
  const pages = (
    Array.isArray(result.text) ? result.text : [result.text]
  ) as string[];

  const sections = pages.map((pageText, pageIdx) => ({
    properties:
      pageIdx > 0
        ? { page: { size: { width: 12240, height: 15840 } } }
        : {},
    children: analyzePageStructure(pageText),
  }));

  const doc = new Document({ sections });
  const uint8 = await Packer.toBuffer(doc);
  return uint8.buffer.slice(
    uint8.byteOffset,
    uint8.byteOffset + uint8.byteLength
  ) as ArrayBuffer;
}

function analyzePageStructure(
  pageText: string
): (Paragraph | Table)[] {
  const lines = pageText.split('\n');
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      elements.push(new Paragraph({ spacing: { after: 120 } }));
      i++;
      continue;
    }

    if (isLikelyHeading(trimmed, lines, i)) {
      elements.push(
        new Paragraph({
          heading: detectHeadingLevel(trimmed),
          children: [new TextRun({ text: trimmed, bold: true })],
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    const bulletMatch = trimmed.match(
      /^[•\-\u2022\u2023\u25E6\u25AA\u25CB]\s*(.+)/
    );
    if (bulletMatch) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: bulletMatch[1] })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      i++;
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: numMatch[2] })],
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { after: 60 },
        })
      );
      i++;
      continue;
    }

    // Regular paragraph — merge consecutive lines
    const paraLines: string[] = [trimmed];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !isLikelyHeading(lines[i + 1].trim(), lines, i + 1) &&
      !isListLine(lines[i + 1].trim())
    ) {
      i++;
      paraLines.push(lines[i].trim());
    }

    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: paraLines.join(' '), size: 24 }),
        ],
        spacing: { after: 120, line: 276 },
      })
    );
    i++;
  }

  return elements;
}

function isLikelyHeading(
  line: string,
  allLines: string[],
  idx: number
): boolean {
  if (
    line === line.toUpperCase() &&
    line.length <= 80 &&
    line.length >= 2 &&
    /[A-Z]/.test(line)
  ) {
    return true;
  }
  if (
    line.length <= 60 &&
    !line.endsWith('.') &&
    !line.endsWith(',') &&
    !line.endsWith(';')
  ) {
    const prevLine = idx > 0 ? allLines[idx - 1]?.trim() : '';
    const nextLine =
      idx + 1 < allLines.length ? allLines[idx + 1]?.trim() : '';
    if (prevLine === '' && nextLine !== '' && line.length <= 50) {
      return true;
    }
  }
  return false;
}

function detectHeadingLevel(
  line: string
): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  if (line === line.toUpperCase() && line.length <= 40)
    return HeadingLevel.HEADING_1;
  if (line.length <= 30) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
}

function isListLine(line: string): boolean {
  return (
    /^[•\-\u2022\u2023\u25E6\u25AA\u25CB]\s/.test(line) ||
    /^\d+[.)]\s/.test(line)
  );
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
