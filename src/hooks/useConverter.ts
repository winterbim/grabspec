'use client';

import { useState, useCallback } from 'react';

type ConversionState = 'idle' | 'converting' | 'done' | 'error';

interface ConversionResult {
  blob: Blob;
  filename: string;
  size: number;
}

export function useConverter() {
  const [state, setState] = useState<ConversionState>('idle');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(async (file: File) => {
    setState('converting');
    setResult(null);
    setError(null);

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const endpoint = isPdf ? '/api/converter/pdf-to-word' : '/api/converter/word-to-pdf';

    try {
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

      setResult({ blob, filename: outputName, size: blob.size });
      setState('done');
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

  return { state, result, error, convert, reset, download };
}
