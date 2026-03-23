'use client';

import { useState, useCallback } from 'react';
import {
  isImageFile,
  convertImageClientSide,
  type ImageOutputFormat,
} from '@/lib/image-converter';
import {
  isWordFile,
  isPdfFile,
  convertWordToPdfClient,
} from '@/lib/doc-converter-client';

type ConversionState = 'idle' | 'converting' | 'done' | 'error';
type ConversionMode = 'server' | 'client';

interface ConversionResult {
  blob: Blob;
  filename: string;
  size: number;
  duration?: number;
  mode: ConversionMode;
}


/** Extensions handled by the spreadsheet/text converter */
const SPREADSHEET_EXTS = new Set(['.xlsx', '.xls', '.csv', '.tsv']);
const TEXT_EXTS = new Set(['.txt', '.html', '.htm', '.md', '.json']);

function extOf(file: File): string {
  return file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
}

function isSpreadsheetFile(file: File): boolean {
  return SPREADSHEET_EXTS.has(extOf(file));
}

function isTextDocFile(file: File): boolean {
  return TEXT_EXTS.has(extOf(file));
}

export function useConverter() {
  const [state, setState] = useState<ConversionState>('idle');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversionMode>('server');

  const convert = useCallback(async (file: File, outputTarget?: string) => {
    setState('converting');
    setResult(null);
    setError(null);

    try {
      if (isImageFile(file)) {
        setMode('client');
        const { getImageOutputFormats } = await import('@/lib/image-converter');
        const formats = getImageOutputFormats(file);
        const target = (outputTarget as ImageOutputFormat) ?? formats[0];
        if (!target) throw new Error('No output format available');

        const r = await convertImageClientSide(file, target);
        setResult({ blob: r.blob, filename: r.filename, size: r.size, duration: r.duration, mode: 'client' });
        setState('done');
      } else if (isWordFile(file)) {
        // mammoth only supports DOCX, not legacy DOC binary format
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (ext === '.doc') {
          throw new Error('Le format DOC (ancien) n\'est pas supporté. Veuillez convertir votre fichier en DOCX d\'abord (ouvrez-le dans Word ou LibreOffice et enregistrez en .docx).');
        }
        setMode('client');
        const r = await convertWordToPdfClient(file);
        setResult({ blob: r.blob, filename: r.filename, size: r.size, duration: r.duration, mode: 'client' });
        setState('done');
      } else if (isPdfFile(file)) {
        setMode('server');
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/converter/pdf-to-word', { method: 'POST', body: formData });
        if (!res.ok) {
          let message = 'Conversion failed';
          try { const json: { error?: string } = await res.json(); message = json.error || message; } catch { /* not JSON */ }
          throw new Error(message);
        }

        const blob = await res.blob();
        const outputName = file.name.replace(/\.pdf$/i, '.docx');
        setResult({ blob, filename: outputName, size: blob.size, mode: 'server' });
        setState('done');
      } else if (isSpreadsheetFile(file) || isTextDocFile(file)) {
        setMode('client');
        const r = await convertDocumentClientSide(file, outputTarget);
        setResult({ blob: r.blob, filename: r.filename, size: r.size, duration: r.duration, mode: 'client' });
        setState('done');
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  const download = useCallback((customFilename?: string) => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = customFilename || result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return { state, result, error, mode, convert, reset, download };
}

// ── Route document/spreadsheet conversion to the right function ──

async function convertDocumentClientSide(
  file: File,
  outputTarget?: string,
): Promise<{ blob: Blob; filename: string; size: number; duration: number }> {
  const ext = extOf(file);
  const to = outputTarget ?? guessDefaultTarget(ext);

  const sc = await import('@/lib/spreadsheet-converter');

  const key = `${ext.replace('.', '')}→${to}`;

  switch (key) {
    // Spreadsheet conversions
    case 'xlsx→csv':
    case 'xls→csv':
      return sc.convertXlsxToCsv(file);
    case 'xlsx→json':
    case 'xls→json':
      return sc.convertXlsxToJson(file);
    case 'xlsx→txt':
    case 'xls→txt':
      return sc.convertXlsxToTxt(file);
    case 'xlsx→html':
    case 'xls→html':
      return sc.convertXlsxToHtml(file);
    case 'xlsx→pdf':
    case 'xls→pdf':
      return sc.convertXlsxToPdf(file);
    case 'xls→xlsx':
      return sc.convertXlsToXlsx(file);
    case 'csv→xlsx':
    case 'tsv→xlsx':
      return sc.convertCsvToXlsx(file);
    case 'csv→json':
    case 'tsv→json':
      return sc.convertCsvToJson(file);
    case 'tsv→csv': {
      // TSV → CSV: proper conversion with field quoting
      const t0 = performance.now();
      const text = await file.text();
      const csv = text
        .split('\n')
        .map((line) => {
          if (!line.trim()) return '';
          return line.split('\t').map((field) => {
            // Quote fields that contain commas, quotes, or newlines
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
              return `"${field.replaceAll('"', '""')}"`;
            }
            return field;
          }).join(',');
        })
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const name = file.name.replace(/\.tsv$/i, '.csv');
      return { blob, filename: name, size: blob.size, duration: performance.now() - t0 };
    }

    // JSON conversions
    case 'json→csv':
      return sc.convertJsonToCsv(file);
    case 'json→xlsx':
      return sc.convertJsonToXlsx(file);

    // Text/document conversions
    case 'txt→pdf':
      return sc.convertTxtToPdf(file);
    case 'html→pdf':
    case 'htm→pdf':
      return sc.convertHtmlToPdf(file);
    case 'md→pdf':
      return sc.convertMdToPdf(file);
    case 'md→html':
      return sc.convertMdToHtml(file);

    default:
      throw new Error(`Unsupported conversion: ${ext} → ${to}`);
  }
}

function guessDefaultTarget(ext: string): string {
  const defaults: Record<string, string> = {
    '.xlsx': 'csv', '.xls': 'csv', '.csv': 'xlsx', '.tsv': 'xlsx',
    '.txt': 'pdf', '.html': 'pdf', '.htm': 'pdf', '.md': 'pdf', '.json': 'csv',
  };
  return defaults[ext] ?? 'pdf';
}
