'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

const recentSearches = [
  'Grohe Eurosmart 33265003',
  'Geberit Sigma 50',
  'Schneider Electric iC60N',
  'Legrand Mosaic 077010',
  'Bosch WAX32M40',
  'Siemens 5SY6116-7',
  'Hansgrohe Talis E 71710',
  'Viessmann Vitocell 100-V',
  'Hager MBN116',
  'Daikin FTXM35R',
  'ABB S201-C16',
  'Grohe Grohtherm 1000',
  'Geberit Duofix 111.300',
  'Franke Kubus KBG 110-50',
  'Stiebel Eltron DHB-E 18',
  'Roca Inspira Round',
  'Villeroy & Boch Subway 3.0',
  'Ideal Standard Connect Air',
  'Vaillant ecoTEC plus',
  'BWT AQA life S',
];

export function SearchTicker() {
  const t = useTranslations('landing');

  // Duplicate for seamless loop
  const items = [...recentSearches, ...recentSearches];

  return (
    <section className="overflow-hidden border-b border-slate-100 bg-slate-50/50 py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400">
            <Search className="h-3 w-3" />
            <span>{t('ticker.label')}</span>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div className="ticker-track flex gap-6">
              {items.map((query, i) => (
                <span
                  key={`${query}-${i}`}
                  className="shrink-0 whitespace-nowrap text-xs text-slate-500"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
