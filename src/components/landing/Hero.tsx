'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Sparkles } from 'lucide-react';

export function Hero() {
  const t = useTranslations('landing');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t('hero.title')}
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            {t('hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/finder"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              {t('hero.cta')}
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            {t('hero.noCard')}
          </p>
        </div>
      </div>
    </section>
  );
}
