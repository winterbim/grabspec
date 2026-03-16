'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              G
            </div>
            <span className="text-lg font-bold text-slate-900">GrabSpec</span>
            <span className="text-base" title="Switzerland">🇨🇭</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">
              {t('product')}
            </Link>
            <Link href="/legal" className="hover:text-slate-900 transition-colors">
              {t('legal')}
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              {t('terms')}
            </Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">
              {t('contact')}
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-slate-400">
          {t('madeWith')}
        </div>
      </div>
    </footer>
  );
}
