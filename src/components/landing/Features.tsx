'use client';

import { useTranslations } from 'next-intl';
import { Search, FolderOpen, ArrowRightLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureCard {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const features: FeatureCard[] = [
  { icon: Search, titleKey: 'features.search.title', descKey: 'features.search.description' },
  { icon: FolderOpen, titleKey: 'features.nomenclature.title', descKey: 'features.nomenclature.description' },
  { icon: ArrowRightLeft, titleKey: 'features.converter.title', descKey: 'features.converter.description' },
];

export function Features() {
  const t = useTranslations('landing');

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('features.title')}
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="rounded-xl border border-slate-200 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
