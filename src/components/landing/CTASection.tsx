'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const t = useTranslations('landing');

  return (
    <section className="bg-blue-600">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {t('cta.title')}
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            {t('cta.subtitle')}
          </p>
          <div className="mt-8">
            <Link
              href="/finder"
              className={buttonVariants({ size: 'lg', className: 'bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-base font-semibold' })}
            >
              {t('cta.button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
