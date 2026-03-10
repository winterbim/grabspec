'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PricingCard } from '@/components/pricing/PricingCard';
import { BusinessExcelPreview } from '@/components/pricing/BusinessExcelPreview';
import { Badge } from '@/components/ui/badge';
import { HelpTip } from '@/components/ui/help-tip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSessionId } from '@/lib/db';

type BillingPeriod = 'monthly' | 'yearly';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [loading, setLoading] = useState(false);

  const isYearly = billing === 'yearly';

  const handleSelect = async (plan: string) => {
    if (plan === 'free') return;
    if (loading) return;

    setLoading(true);
    try {
      const sessionId = await getSessionId();

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan as 'pro' | 'business',
          interval: billing,
          sessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Stripe is not configured') {
          toast.error(t('stripeNotConfigured'));
        } else {
          toast.error(result.error || t('checkoutError'));
        }
        return;
      }

      const checkoutUrl = result.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error(t('checkoutError'));
      }
    } catch {
      toast.error(t('checkoutError'));
    } finally {
      setLoading(false);
    }
  };

  const proPrice = isYearly
    ? t('pro.priceYearly')
    : t('pro.priceMonthly');

  const businessPrice = isYearly
    ? t('business.priceYearly')
    : t('business.priceMonthly');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t('title')}
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              {t('subtitle')}
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-3">
            <HelpTip content={t('usageTip')} />
            <Tabs
              value={billing}
              onValueChange={(v) => setBilling(v as BillingPeriod)}
            >
              <TabsList>
                <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
                <TabsTrigger value="yearly" className="gap-2">
                  {t('yearly')}
                  {isYearly && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 hover:bg-green-100"
                    >
                      {t('yearlyDiscount')}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <PricingCard
              planKey="free"
              price={t('free.price')}
              onSelect={() => handleSelect('free')}
            />
            <PricingCard
              planKey="pro"
              price={proPrice}
              featured
              loading={loading}
              onSelect={() => handleSelect('pro')}
            />
            <div>
              <PricingCard
                planKey="business"
                price={businessPrice}
                loading={loading}
                onSelect={() => handleSelect('business')}
              />
              <BusinessExcelPreview />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
