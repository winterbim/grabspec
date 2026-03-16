'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  planKey: 'free' | 'pro' | 'business';
  price: string;
  featured?: boolean;
  loading?: boolean;
  onSelect: () => void;
}

export function PricingCard({ planKey, price, featured = false, loading = false, onSelect }: PricingCardProps) {
  const t = useTranslations(`pricing.${planKey}`);
  const tCommon = useTranslations('common');

  const features: string[] = t.raw('features') as string[];

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-shadow',
        featured
          ? 'border-blue-500 shadow-xl ring-1 ring-blue-500'
          : 'border-slate-200 shadow-sm'
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 px-3 py-1 text-white hover:bg-blue-600">
            {t('popular')}
          </Badge>
        </div>
      )}
      <CardHeader className="pb-4 pt-6 text-center">
        <CardTitle className="text-lg font-semibold text-slate-900">
          {t('name')}
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          {t('description')}
        </CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold text-slate-900">{price}</span>
          {planKey !== 'free' && (
            <span className="ml-1 text-sm text-slate-500">/{tCommon('month')}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-6 pb-6">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          className={cn('w-full', featured ? '' : 'bg-slate-900 hover:bg-slate-800')}
          variant={featured ? 'default' : 'outline'}
          size="lg"
          disabled={loading}
          onClick={onSelect}
        >
          {loading ? '...' : t('cta')}
        </Button>
      </CardContent>
    </Card>
  );
}
