'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyLibraryProps {
  onCreateProject: () => void;
}

export function EmptyLibrary({ onCreateProject }: EmptyLibraryProps) {
  const t = useTranslations('library');

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* SVG Illustration */}
      <div className="mb-8">
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300 dark:text-slate-600">
          {/* Folder base */}
          <rect x="20" y="40" width="140" height="90" rx="8" fill="currentColor" opacity="0.15" />
          <path d="M20 48C20 43.5817 23.5817 40 28 40H70L80 28H152C156.418 28 160 31.5817 160 36V40H20V48Z" fill="currentColor" opacity="0.25" />
          {/* Document 1 */}
          <rect x="50" y="55" width="40" height="50" rx="4" fill="currentColor" opacity="0.3" />
          <rect x="56" y="63" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          <rect x="56" y="70" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          <rect x="56" y="77" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          {/* Document 2 */}
          <rect x="95" y="50" width="40" height="50" rx="4" fill="currentColor" opacity="0.3" />
          <rect x="101" y="58" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          <rect x="101" y="65" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          {/* Image icon on doc 2 */}
          <rect x="101" y="74" width="28" height="18" rx="2" fill="currentColor" opacity="0.2" />
          <circle cx="109" cy="80" r="3" fill="currentColor" opacity="0.3" />
          {/* Plus circle */}
          <circle cx="150" cy="110" r="18" fill="currentColor" opacity="0.2" />
          <path d="M150 102V118M142 110H158" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        {t('emptyTitle')}
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {t('emptyDescription')}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onCreateProject} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          {t('createFirstProject')}
        </Button>
        <Link href="/finder">
          <Button variant="outline" size="lg">
            <Search className="mr-2 h-4 w-4" />
            {t('searchFirst')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
