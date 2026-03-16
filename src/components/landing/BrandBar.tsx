'use client';

import { useTranslations } from 'next-intl';

const brands = ['GROHE', 'GEBERIT', 'SCHNEIDER', 'LEGRAND', 'BOSCH', 'SIEMENS'];

export function BrandBar() {
  const t = useTranslations('landing');

  return (
    <section className="border-y border-slate-100 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <span className="shrink-0">{t('brandBar.label')}</span>
          {brands.map((brand) => (
            <span key={brand} className="font-semibold text-slate-700">
              {brand}
            </span>
          ))}
          <span className="text-slate-400">{t('brandBar.more')}</span>
        </div>
      </div>
    </section>
  );
}
