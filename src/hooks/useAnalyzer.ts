'use client';

import { useState, useCallback } from 'react';
import { parseDocument, isSupportedFormat } from '@/lib/analyzer/documentParser';
import { extractReferences, type ExtractedReference } from '@/lib/analyzer/referenceExtractor';

export type AnalyzerState = 'idle' | 'parsing' | 'extracting' | 'done' | 'error';

export interface AnalyzerResult {
  references: ExtractedReference[];
  totalLines: number;
  parseTimeMs: number;
}

export function useAnalyzer() {
  const [state, setState] = useState<AnalyzerState>('idle');
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);

  const analyze = useCallback(async (file: File) => {
    if (!isSupportedFormat(file.name)) {
      setError('unsupportedFormat');
      setState('error');
      return;
    }

    setState('parsing');
    setFilename(file.name);
    setFileInfo({ name: file.name, size: file.size });
    setError(null);
    setResult(null);

    try {
      const start = performance.now();

      // Step 1: Parse document to text
      const text = await parseDocument(file);

      setState('extracting');

      // Step 2: Extract references (runs synchronously but UI can update)
      await new Promise((r) => setTimeout(r, 0)); // yield to UI
      const references = extractReferences(text);

      const elapsed = performance.now() - start;

      setResult({
        references,
        totalLines: text.split('\n').length,
        parseTimeMs: Math.round(elapsed),
      });
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setFilename('');
    setFileInfo(null);
  }, []);

  return { state, result, error, filename, fileInfo, analyze, reset };
}
