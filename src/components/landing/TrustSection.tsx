'use client';

import { useTranslations } from 'next-intl';
import {
  MapPin,
  HardHat,
  ShieldCheck,
  ServerOff,
  Users,

} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TrustPoint {
  icon: LucideIcon;
  key: string;
  color: string;
  bgColor: string;
}

const TRUST_POINTS: TrustPoint[] = [
  {
    icon: HardHat,
    key: 'builtByPro',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    icon: MapPin,
    key: 'madeInGeneva',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: ShieldCheck,
    key: 'noDataStored',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: ServerOff,
    key: 'clientSide',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

export function TrustSection() {
  const t = useTranslations('landing.trust');

  return (
    <section className="border-y border-slate-100 bg-slate-50/50 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Quote — anonymous */}
        <div className="mx-auto max-w-2xl text-center">
          <blockquote className="text-lg leading-relaxed text-slate-700 italic sm:text-xl">
            &ldquo;{t('quote')}&rdquo;
          </blockquote>
        </div>

        {/* Trust grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, key, color, bgColor }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bgColor}`}
              >
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {t(`${key}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {t(`${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof counter */}
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Users className="h-4 w-4 text-slate-400" />
          <span>{t('socialProof')}</span>
        </div>
      </div>
    </section>
  );
}
