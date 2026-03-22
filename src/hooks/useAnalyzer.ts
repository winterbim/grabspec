'use client';

import { useState, useCallback } from 'react';

export interface AnalysisKpi {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  detail?: string;
}

export interface AnalysisChart {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
}

export interface AnalysisSlide {
  title: string;
  content: string;
  type: 'title' | 'kpi' | 'chart' | 'text' | 'conclusion';
}

export interface AnalysisResult {
  title: string;
  summary: string;
  insights: string[];
  kpis: AnalysisKpi[];
  charts: AnalysisChart[];
  slides: AnalysisSlide[];
}

type AnalyzerState = 'idle' | 'analyzing' | 'done' | 'error';

export function useAnalyzer() {
  const [state, setState] = useState<AnalyzerState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');

  const analyze = useCallback(async (file: File, sessionId: string) => {
    setState('analyzing');
    setResult(null);
    setError(null);
    setFilename(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const res = await fetch('/api/analyzer', { method: 'POST', body: formData });

      if (!res.ok) {
        let message = 'Analysis failed';
        try {
          const json: { error?: string } = await res.json();
          message = json.error || message;
        } catch { /* not JSON */ }
        throw new Error(message);
      }

      const json = await res.json();
      setResult(json.data as AnalysisResult);
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
  }, []);

  return { state, result, error, filename, analyze, reset };
}
