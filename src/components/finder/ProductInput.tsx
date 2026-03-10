'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpTip } from '@/components/ui/help-tip';
import type { PlanType } from '@/types';

const EXAMPLES = [
  'Grohe Eurosmart 33265003',
  'Geberit Sigma 50',
  'Bosch WAX32M40',
  'Schneider Odace S520702',
  'Legrand Mosaic 077040',
];

interface ProductInputProps {
  onSearch: (queries: string[]) => void;
  isSearching: boolean;
  plan: PlanType;
  searchesLeft: number;
}

export function ProductInput({ onSearch, isSearching, plan, searchesLeft }: ProductInputProps) {
  const t = useTranslations('finder');
  const [text, setText] = useState('');
  const isFreePlan = plan === 'free';

  const queries = useMemo(() => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [text]);
  const exceedsFreeLimit = isFreePlan && queries.length > searchesLeft;

  const handleSearch = useCallback(() => {
    if (queries.length === 0 || isSearching || exceedsFreeLimit) return;
    onSearch(queries);
  }, [queries, isSearching, exceedsFreeLimit, onSearch]);

  const handleExampleClick = useCallback(
    (example: string) => {
      setText((prev) => {
        const trimmed = prev.trimEnd();
        if (trimmed.length === 0) return example;
        return `${trimmed}\n${example}`;
      });
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{t('search_help_label')}</span>
        <HelpTip content={t('usageTip')} />
      </div>

      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          className="min-h-[200px] resize-y bg-slate-50 border focus:border-blue-500 pb-14 text-sm"
          disabled={isSearching}
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">
              {t('productCount', { count: queries.length })}
            </span>
            {isFreePlan && (
              <span className={`text-xs ${exceedsFreeLimit ? 'text-red-600' : 'text-slate-500'}`}>
                {t('searchesRemaining', { count: searchesLeft })}
              </span>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleSearch}
            disabled={queries.length === 0 || isSearching || exceedsFreeLimit}
          >
            <Search className="mr-2 h-4 w-4" />
            {isSearching
              ? t('searching')
              : t('searchButton', { count: queries.length })}
          </Button>
        </div>
      </div>

      {exceedsFreeLimit && (
        <p className="text-sm text-red-600">
          {t('batchLimitExceeded', { requested: queries.length, available: searchesLeft })}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">{t('examples')}</span>
        {EXAMPLES.map((example) => (
          <Badge
            key={example}
            variant="secondary"
            className="cursor-pointer transition-colors hover:bg-slate-200"
            onClick={() => handleExampleClick(example)}
          >
            {example}
          </Badge>
        ))}
      </div>
    </div>
  );
}
