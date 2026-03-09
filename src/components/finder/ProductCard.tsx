'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Package,
  Eye,
  Image as ImageIcon,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { FinderProduct } from '@/stores/finderStore';
import type { SearchStatus, ProductSpecs } from '@/types';

interface ProductCardProps {
  product: FinderProduct;
}

const STATUS_VARIANT: Record<SearchStatus, string> = {
  found: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  not_found: 'bg-red-100 text-red-700',
  searching: 'bg-blue-100 text-blue-700',
  pending: 'bg-slate-100 text-slate-500',
  error: 'bg-red-100 text-red-700',
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

const SPEC_KEYS: (keyof ProductSpecs)[] = [
  'dimensions',
  'poids',
  'materiau',
  'couleur',
  'puissance',
  'debit',
  'pression',
  'tension',
  'certification',
  'garantie',
];

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('finder');
  const tLib = useTranslations('library.product');
  const [addedToLib, setAddedToLib] = useState(false);
  const { result, status } = product;

  const handleAddToLibrary = useCallback(async () => {
    if (!result || addedToLib) return;
    try {
      const { db } = await import('@/lib/db');
      await db.products.put({
        id: result.id,
        projectId: null,
        inputName: result.inputName,
        resolvedName: result.resolvedName,
        manufacturer: result.manufacturer,
        reference: result.reference,
        category: result.category,
        lot: result.lot,
        photoUrl: result.photoUrl,
        photoBlobUrl: result.photoBlobUrl,
        datasheetUrl: result.datasheetUrl,
        datasheetBlobUrl: result.datasheetBlobUrl,
        specs: result.specs as Record<string, string | null> | null,
        searchStatus: result.searchStatus,
        createdAt: result.createdAt,
      });
      setAddedToLib(true);
    } catch {
      // silently fail
    }
  }, [result, addedToLib]);

  if (status === 'searching' || status === 'pending') {
    return (
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-slate-500">
            {t('status.searching')}
          </span>
        </CardContent>
      </Card>
    );
  }

  const name = result?.resolvedName ?? result?.inputName ?? product.query;
  const photoSrc = result?.photoBlobUrl ?? result?.photoUrl;

  return (
    <Card className="group relative rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      <Badge className={`absolute right-3 top-3 z-10 ${STATUS_VARIANT[status]}`}>
        {t(`status.${statusKey(status)}`)}
      </Badge>

      <CardContent className="flex gap-4 pt-2">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {photoSrc ? (
            <img src={photoSrc} alt={name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
          {result?.manufacturer && (
            <p className="text-xs text-slate-500">
              {tLib('manufacturer')}: {result.manufacturer}
            </p>
          )}
          {result?.reference && (
            <p className="text-xs text-slate-500">
              {tLib('reference')}: {result.reference}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {result?.specs && (
          <Dialog>
            <DialogTrigger>
              <Button variant="outline" size="sm">
                <Eye className="mr-1 h-3.5 w-3.5" />
                {t('actions.viewSpecs')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {SPEC_KEYS.map((key) => {
                  const val = result.specs?.[key];
                  if (!val) return null;
                  return (
                    <div key={key}>
                      <span className="text-xs font-medium text-slate-500 capitalize">
                        {key}
                      </span>
                      <p className="text-slate-800">{val}</p>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {(result?.photoBlobUrl ?? result?.photoUrl) && (
          <a
            href={result?.photoBlobUrl ?? result?.photoUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ImageIcon className="mr-1 h-3.5 w-3.5" />
            {t('actions.photoHD')}
          </a>
        )}

        {(result?.datasheetBlobUrl ?? result?.datasheetUrl) && (
          <a
            href={result?.datasheetBlobUrl ?? result?.datasheetUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <FileText className="mr-1 h-3.5 w-3.5" />
            {t('actions.datasheet')}
          </a>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddToLibrary}
          disabled={!result || addedToLib}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t('actions.addToLibrary')}
        </Button>
      </CardFooter>
    </Card>
  );
}
