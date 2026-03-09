import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

export async function convertPdfToWord(
  pdfBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const { extractText } = await import('unpdf');
  const result = await extractText(new Uint8Array(pdfBuffer));
  const fullText = (result.text as string[]).join('\n');

  const lines = fullText.split('\n').filter((line: string) => line.trim());

  const paragraphs = lines.map(
    (line: string) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 24 })],
        spacing: { after: 120 },
      })
  );

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const uint8 = await Packer.toBuffer(doc);
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

export async function convertWordToPdf(
  wordBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit') as new (opts?: { margin?: number; size?: string }) => NodeJS.WritableStream & { fontSize: (s: number) => unknown; text: (t: string, opts?: { lineGap?: number }) => unknown; moveDown: () => unknown; end: () => void };

  const result = await mammoth.extractRawText({ buffer: Buffer.from(wordBuffer) });
  const text = result.value;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  (doc as unknown as { fontSize: (s: number) => unknown }).fontSize(12);

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      (doc as unknown as { text: (t: string, opts?: { lineGap?: number }) => unknown }).text(line, { lineGap: 4 });
    } else {
      (doc as unknown as { moveDown: () => unknown }).moveDown();
    }
  }

  doc.end();

  return new Promise<ArrayBuffer>((resolve, reject) => {
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
    });
    doc.on('error', reject);
  });
}

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
