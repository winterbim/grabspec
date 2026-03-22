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

export function useConverter() {
  const [state, setState] = useState<ConversionState>('idle');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversionMode>('server');

  const convert = useCallback(async (file: File, imageOutputFormat?: ImageOutputFormat) => {
    setState('converting');
    setResult(null);
    setError(null);

    try {
      if (isImageFile(file)) {
        // Client-side image conversion via Canvas API
        setMode('client');
        const { getImageOutputFormats } = await import('@/lib/image-converter');
        const formats = getImageOutputFormats(file);
        const target = imageOutputFormat ?? formats[0];
        if (!target) throw new Error('No output format available');

        const convResult = await convertImageClientSide(file, target);
        setResult({
          blob: convResult.blob,
          filename: convResult.filename,
          size: convResult.size,
          duration: convResult.duration,
          mode: 'client',
        });
        setState('done');
      } else if (isWordFile(file)) {
        // Client-side Word → PDF via mammoth + jsPDF + html2canvas
        setMode('client');
        const convResult = await convertWordToPdfClient(file);
        setResult({
          blob: convResult.blob,
          filename: convResult.filename,
          size: convResult.size,
          duration: convResult.duration,
          mode: 'client',
        });
        setState('done');
      } else if (isPdfFile(file)) {
        // Server-side PDF → Word (needs unpdf server-side)
        setMode('server');
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/converter/pdf-to-word', { method: 'POST', body: formData });

        if (!res.ok) {
          let message = 'Conversion failed';
          try {
            const json: { error?: string } = await res.json();
            message = json.error || message;
          } catch {
            // Response was not JSON
          }
          throw new Error(message);
        }

        const blob = await res.blob();
        const outputName = file.name.replace(/\.pdf$/i, '.docx');
        setResult({ blob, filename: outputName, size: blob.size, mode: 'server' });
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
