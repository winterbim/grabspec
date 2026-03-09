'use client';

import { useTranslations } from 'next-intl';
import { ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { LocalProduct } from '@/lib/db';

interface LibraryGridProps {
  products: LocalProduct[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function LibraryGrid({ products, selectedIds, onToggleSelect }: LibraryGridProps) {
  const t = useTranslations('library.product');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const isSelected = selectedIds.has(product.id);
        return (
          <Card
            key={product.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && 'ring-2 ring-blue-500 ring-offset-2'
            )}
            onClick={() => onToggleSelect(product.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(product.id)}
                  className="mt-1 shrink-0"
                />
                <div className="flex flex-1 gap-3 overflow-hidden">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {product.photoUrl || product.photoBlobUrl ? (
                      <img
                        src={product.photoBlobUrl ?? product.photoUrl ?? ''}
                        alt={product.resolvedName ?? product.inputName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {product.resolvedName ?? product.inputName}
                    </p>
                    {product.manufacturer && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {t('manufacturer')}: {product.manufacturer}
                      </p>
                    )}
                    {product.reference && (
                      <p className="truncate text-xs text-slate-500">
                        {t('reference')}: {product.reference}
                      </p>
                    )}
                    {product.lot && (
                      <p className="truncate text-xs text-slate-500">
                        {t('lot')}: {product.lot}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
