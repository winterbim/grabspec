'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTipProps {
  content: string;
  className?: string;
}

export function HelpTip({ content, className }: HelpTipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={content}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  );
}
