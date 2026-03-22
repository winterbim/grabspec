'use client';

import { useState, useCallback } from 'react';
import {
  isImageFile,
  getImageOutputFormats,
  convertImageClientSide,
  type ImageOutputFormat,
} from '@/lib/image-converter';

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

  /**
   * Convert a file. Routes to client-side (images) or server-side (PDF/Word) automatically.
   * For images, an outputFormat can be specified; otherwise defaults to the first available.
   */
  const convert = useCallback(async (file: File, imageOutputFormat?: ImageOutputFormat) => {
    setState('converting');
    setResult(null);
    setError(null);

    try {
      if (isImageFile(file)) {
        // Client-side image conversion via Canvas API
        setMode('client');
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
      } else {
        // Server-side PDF/Word conversion
        setMode('server');
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const endpoint = isPdf ? '/api/converter/pdf-to-word' : '/api/converter/word-to-pdf';

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(endpoint, { method: 'POST', body: formData });

        if (!res.ok) {
          const json: { error?: string } = await res.json();
          throw new Error(json.error || 'Conversion failed');
        }

        const blob = await res.blob();
        const outputName = isPdf
          ? file.name.replace(/\.pdf$/i, '.docx')
          : file.name.replace(/\.(docx?)$/i, '.pdf');

        setResult({ blob, filename: outputName, size: blob.size, mode: 'server' });
        setState('done');
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

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return { state, result, error, mode, convert, reset, download };
}
