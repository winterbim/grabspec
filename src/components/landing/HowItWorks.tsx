'use client';

import { useTranslations } from 'next-intl';

interface Step {
  number: number;
  titleKey: string;
  descKey: string;
}

const steps: Step[] = [
  { number: 1, titleKey: 'howItWorks.step1.title', descKey: 'howItWorks.step1.description' },
  { number: 2, titleKey: 'howItWorks.step2.title', descKey: 'howItWorks.step2.description' },
  { number: 3, titleKey: 'howItWorks.step3.title', descKey: 'howItWorks.step3.description' },
];

export function HowItWorks() {
  const t = useTranslations('landing');

  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('howItWorks.title')}
          </h2>
        </div>

        <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line — visible on desktop only */}
          <div
            className="pointer-events-none absolute top-6 hidden h-0.5 bg-blue-200 md:block"
            style={{ left: 'calc(16.67% + 24px)', right: 'calc(16.67% + 24px)' }}
          />

          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {step.number}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                {t(step.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
