'use client';

import { useState, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  Tag,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LocalProduct } from '@/lib/db';
import { getCategoryLabel, type ProductCategory } from '@/lib/smart-categories';

interface ProductCardProps {
  product: LocalProduct;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<LocalProduct>) => Promise<void>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function ProductCardAdvanced({
  product,
  onDelete,
  onRestore,
  onPermanentDelete,
  onUpdate,
  isSelected = false,
  onToggleSelect,
}: ProductCardProps) {
  const t = useTranslations('library');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);
  const [preview, setPreview] = useState<{
    type: 'image' | 'pdf';
    url: string;
    label: string;
  } | null>(null);

  const photoUrl = product.photoBlobUrl ?? product.photoUrl;
  const datasheetUrl = product.datasheetBlobUrl ?? product.datasheetUrl;

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(product.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [product.id, onDelete]);

  const handlePermanentDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onPermanentDelete(product.id);
    } finally {
      setIsDeleting(false);
      setShowPermanentConfirm(false);
    }
  }, [product.id, onPermanentDelete]);

  const handleRestore = useCallback(async () => {
    await onRestore(product.id);
  }, [product.id, onRestore]);

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      const tags = product.tags || [];
      await onUpdate(product.id, { tags: tags.filter((t) => t !== tag) });
    },
    [product, onUpdate]
  );

  const openPreview = useCallback((type: 'image' | 'pdf', url: string, label: string) => {
    setPreview({ type, url, label });
  }, []);

  return (
    <div
      className={`border rounded-lg p-4 space-y-3 transition-opacity ${
        product.isDeleted ? 'opacity-50 bg-red-50 dark:bg-red-950' : 'bg-white dark:bg-slate-900'
      } ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
    >
      {/* Header with title and status */}
      <div className="flex items-start gap-3">
        {onToggleSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(product.id)}
            className="mt-1 shrink-0"
            aria-label={t('select_product')}
          />
        )}

        <div className="flex flex-1 items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{product.inputName}</h3>
            {product.resolvedName && product.resolvedName !== product.inputName && (
              <p className="text-xs text-gray-500 mt-1">{product.resolvedName}</p>
            )}
          </div>

          <div className="flex gap-1">
            {product.isDeleted ? (
              <Badge className="bg-red-500">{t('deleted')}</Badge>
            ) : (
              <Badge
                className={
                  product.searchStatus === 'found'
                    ? 'bg-green-500'
                    : product.searchStatus === 'pending'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }
              >
                {product.searchStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {product.manufacturer && (
          <div>
            <span className="text-gray-500">{t('manufacturer')}:</span> {product.manufacturer}
          </div>
        )}
        {product.reference && (
          <div>
            <span className="text-gray-500">Ref:</span> {product.reference}
          </div>
        )}
        {product.category && (
          <div>
            <span className="text-gray-500">{t('category')}:</span> {getCategoryLabel(product.category as ProductCategory)}
          </div>
        )}
        {product.confidence !== undefined && (
          <div>
            <span className="text-gray-500">Confiance:</span>{' '}
            <Badge variant="secondary">{Math.round(product.confidence * 100)}%</Badge>
          </div>
        )}
      </div>

      {/* Media links */}
      <div className="flex flex-wrap gap-2">
        {photoUrl && (
          <button
            type="button"
            onClick={() => openPreview('image', photoUrl, t('photo'))}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ImageIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t('photo')}
          </button>
        )}
        {datasheetUrl && (
          <button
            type="button"
            onClick={() => openPreview('pdf', datasheetUrl, 'PDF')}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <FileText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </button>
        )}
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-red-100"
              onClick={() => handleRemoveTag(tag)}
            >
              <Tag className="w-2 h-2 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes */}
      {product.notes && (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          &ldquo;{product.notes}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {!product.isDeleted ? (
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                disabled={isDeleting}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {t('delete')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('delete_product')}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600">{t('delete_confirm_message')}</p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {t('delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestore}
              disabled={isDeleting}
              className="flex-1"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t('restore')}
            </Button>
            <Dialog open={showPermanentConfirm} onOpenChange={setShowPermanentConfirm}>
              <DialogTrigger>
                <Button size="sm" variant="destructive" disabled={isDeleting}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('permanently_delete')}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">{t('permanent_delete_warning')}</p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowPermanentConfirm(false)}
                    disabled={isDeleting}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handlePermanentDelete}
                    disabled={isDeleting}
                  >
                    {t('permanently_delete')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{preview?.label ?? ''}</DialogTitle>
          </DialogHeader>

          {preview?.type === 'image' ? (
            <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg bg-slate-50 p-2">
              <img
                src={preview.url}
                alt={product.resolvedName ?? product.inputName}
                className="max-h-[68vh] w-auto max-w-full object-contain"
              />
            </div>
          ) : preview?.type === 'pdf' ? (
            <iframe
              src={preview.url}
              title={`${product.resolvedName ?? product.inputName} PDF`}
              className="h-[70vh] w-full rounded-lg border"
            />
          ) : null}

          {preview && (
            <DialogFooter>
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('open_in_new_tab')}
              </a>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
