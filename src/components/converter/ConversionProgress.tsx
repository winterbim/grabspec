'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ConversionProgressProps {
  filename: string;
}

export function ConversionProgress({ filename }: ConversionProgressProps) {
  const t = useTranslations('converter');

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border bg-white p-8">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />

      <div className="w-full max-w-md space-y-3">
        <Progress value={null} className="w-full">
          <span className="sr-only">{t('converting')}</span>
        </Progress>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-slate-700">{t('converting')}</p>
        <p className="mt-1 text-sm text-slate-500">{filename}</p>
      </div>
    </div>
  );
}
