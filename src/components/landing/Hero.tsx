'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Search, ArrowRight, Clock, Zap, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** Product references users can click to populate the textarea */
const DEMO_PRODUCTS = [
  'Grohe Eurosmart 33265003',
  'Geberit Sigma 50',
  'Schneider Odace S520702',
] as const;

/** Trust badges shown below the textarea */
const TRUST_POINTS = [
  { icon: Clock, key: 'trustFree' },
  { icon: Zap, key: 'trustInstant' },
  { icon: ShieldCheck, key: 'trustPrivacy' },
] as const;

export function Hero() {
  const t = useTranslations('landing');
  const router = useRouter();
  const [text, setText] = useState('');

  const queries = useMemo(
    () =>
      text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [text],
  );

  const handleSearch = useCallback(() => {
    if (queries.length === 0) return;
    // Encode products as query param — finder page reads them on mount
    const encoded = encodeURIComponent(queries.join('\n'));
    router.push(`/finder?q=${encoded}`);
  }, [queries, router]);

  const handleExampleClick = useCallback((product: string) => {
    setText((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return product;
      if (trimmed.split('\n').some((l) => l.trim() === product)) return prev;
      return `${trimmed}\n${product}`;
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-blue-50 via-white to-white">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
        <div className="text-center">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Zap className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </div>

          {/* Main headline — impact-first copy */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>

          {/* Subtitle — what + how */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* ── Embedded textarea — the core interaction ── */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/50">
            <div className="relative">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('hero.placeholder')}
                className="min-h-35 resize-none rounded-xl border-0 bg-slate-50/50 pb-16 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
              />

              {/* Bottom bar inside textarea */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {queries.length > 0
                    ? t('hero.productCount', { count: queries.length })
                    : t('hero.hint')}
                </span>

                <Button
                  size="lg"
                  onClick={handleSearch}
                  disabled={queries.length === 0}
                  className="gap-2 bg-blue-600 px-6 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  {t('hero.cta')}
                </Button>
              </div>
            </div>
          </div>

          {/* Demo product badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400">{t('hero.tryWith')}</span>
            {DEMO_PRODUCTS.map((product) => (
              <Badge
                key={product}
                variant="secondary"
                className="cursor-pointer border border-slate-200 bg-white text-xs font-normal text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleExampleClick(product)}
              >
                {product}
              </Badge>
            ))}
          </div>
        </div>

        {/* ── Trust micro-copy ── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {TRUST_POINTS.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {t(`hero.${key}`)}
            </div>
          ))}
        </div>

        {/* Secondary CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/converter"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
          >
            {t('hero.converterCta')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
