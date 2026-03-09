'use client';

import { useTranslations } from 'next-intl';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { FinderProduct } from '@/stores/finderStore';
import type { SearchStatus } from '@/types';

interface SearchProgressProps {
  products: FinderProduct[];
  doneCount: number;
}

const STATUS_ICON: Record<SearchStatus, typeof Loader2> = {
  pending: Clock,
  searching: Loader2,
  found: CheckCircle2,
  partial: AlertTriangle,
  not_found: XCircle,
  error: XCircle,
};

const STATUS_COLOR: Record<SearchStatus, string> = {
  pending: 'text-slate-400',
  searching: 'text-blue-500 animate-spin',
  found: 'text-green-500',
  partial: 'text-amber-500',
  not_found: 'text-red-400',
  error: 'text-red-500',
};

function statusKey(status: SearchStatus): string {
  const map: Record<SearchStatus, string> = {
    found: 'found',
    partial: 'partial',
    not_found: 'notFound',
    searching: 'searching',
    error: 'error',
    pending: 'searching',
  };
  return map[status];
}

export function SearchProgress({ products, doneCount }: SearchProgressProps) {
  const t = useTranslations('finder');
  const total = products.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          {t('progress', { done: doneCount, total })}
        </p>
        <span className="text-xs text-slate-500">{percent}%</span>
      </div>

      <Progress value={percent} />

      <ul className="max-h-[240px] space-y-1 overflow-y-auto">
        {products.map((product, idx) => {
          const Icon = STATUS_ICON[product.status];
          const colorClass = STATUS_COLOR[product.status];

          return (
            <li
              key={`${product.query}-${idx}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50"
            >
              <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />
              <span className="flex-1 truncate text-slate-700">
                {product.query}
              </span>
              <span className={`text-xs ${colorClass}`}>
                {t(`status.${statusKey(product.status)}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
