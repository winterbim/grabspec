'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

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
}

export function ProductInput({ onSearch, isSearching }: ProductInputProps) {
  const t = useTranslations('finder');
  const [text, setText] = useState('');

  const queries = useMemo(() => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [text]);

  const handleSearch = useCallback(() => {
    if (queries.length === 0 || isSearching) return;
    onSearch(queries);
  }, [queries, isSearching, onSearch]);

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
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          className="min-h-[200px] resize-y bg-slate-50 border focus:border-blue-500 pb-14 text-sm"
          disabled={isSearching}
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {t('productCount', { count: queries.length })}
          </span>
          <Button
            size="lg"
            onClick={handleSearch}
            disabled={queries.length === 0 || isSearching}
          >
            <Search className="mr-2 h-4 w-4" />
            {isSearching
              ? t('searching')
              : t('searchButton', { count: queries.length })}
          </Button>
        </div>
      </div>

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
