import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
} from 'docx';

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

    const bulletMatch = /^[•\-\u2022\u2023\u25E6\u25AA\u25CB]\s*(.+)/.exec(trimmed);
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

    const numMatch = /^(\d+)[.)]\s+(.+)/.exec(trimmed);
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
    /^[•\u2022\u2023\u25E6\u25AA\u25CB-]\s/.test(line) ||
    /^\d+[.)]\s/.test(line)
  );
}

// ─── Utilities ───
export function getOutputFilename(
  inputFilename: string,
  targetType: 'pdf' | 'word'
): string {
  const baseName = inputFilename.replace(/\.[^.]+$/, '');
  return targetType === 'word' ? `${baseName}.docx` : `${baseName}.pdf`;
}
