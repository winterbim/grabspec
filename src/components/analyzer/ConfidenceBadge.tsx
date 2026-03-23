'use client';

import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number;
  label?: string;
}

export function ConfidenceBadge({ confidence, label }: ConfidenceBadgeProps) {
  const level =
    confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        level === 'high' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        level === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        level === 'low' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          level === 'high' && 'bg-emerald-500',
          level === 'medium' && 'bg-amber-500',
          level === 'low' && 'bg-red-500',
        )}
      />
      {label ?? `${confidence}%`}
    </span>
  );
}
