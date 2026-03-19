'use client';

import { useTranslations } from 'next-intl';
import { BarChart3 } from 'lucide-react';

const manufacturers = [
  { name: 'Grohe', searches: 2840 },
  { name: 'Geberit', searches: 2310 },
  { name: 'Schneider Electric', searches: 1950 },
  { name: 'Legrand', searches: 1720 },
  { name: 'Bosch', searches: 1580 },
  { name: 'Siemens', searches: 1430 },
  { name: 'Hansgrohe', searches: 1210 },
  { name: 'Viessmann', searches: 980 },
  { name: 'Hager', searches: 870 },
  { name: 'Daikin', searches: 760 },
];

const maxSearches = manufacturers[0].searches;

const barColors = [
  'bg-blue-600',
  'bg-blue-500',
  'bg-blue-500',
  'bg-blue-400',
  'bg-blue-400',
  'bg-blue-300',
  'bg-blue-300',
  'bg-blue-200',
  'bg-blue-200',
  'bg-blue-200',
];

export function ManufacturersChart() {
  const t = useTranslations('landing');

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
            <BarChart3 className="h-4 w-4" />
            <span>{t('chart.badge')}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('chart.title')}
          </h2>
        </div>

        <div className="space-y-3">
          {manufacturers.map((m, i) => {
            const pct = Math.round((m.searches / maxSearches) * 100);
            return (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-right text-sm font-medium text-slate-600">
                  {m.name}
                </span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-md ${barColors[i]} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-slate-500">
                    {m.searches.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t('chart.footnote')}
        </p>
      </div>
    </section>
  );
}
