'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getSessionId } from '@/lib/db';

export function LicenseActivation() {
  const t = useTranslations('pricing.license');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const formatKey = (raw: string) => {
    // Strip everything except letters/digits, uppercase, then insert dashes: GRAB-XXXX-XXXX-XXXX
    const clean = raw.replaceAll(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const parts: string[] = [];
    if (clean.length > 0) parts.push(clean.slice(0, 4));
    if (clean.length > 4) parts.push(clean.slice(4, 8));
    if (clean.length > 8) parts.push(clean.slice(8, 12));
    if (clean.length > 12) parts.push(clean.slice(12, 16));
    return parts.join('-');
  };

  const handleActivate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);

    try {
      const sessionId = await getSessionId();
      const res = await fetch('/api/licenses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), sessionId }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || t('error'));
        return;
      }

      toast.success(t('success', { plan: json.data.plan }));
      setKey('');
      setShowInput(false);

      // Update local plan cache so all pages see the new plan immediately
      const { setStoredPlan } = await import('@/lib/db');
      await setStoredPlan(json.data.plan);

      // Refresh plan — dispatching a custom event that useSession listens for
      globalThis.dispatchEvent(new Event('plan-updated'));

      // Reload to ensure the plan is reflected everywhere
      setTimeout(() => globalThis.location.reload(), 800);
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (!showInput) {
    return (
      <div className="mt-10 text-center">
        <button
          onClick={() => setShowInput(true)}
          className="text-sm text-slate-400 underline decoration-dotted underline-offset-4 transition hover:text-slate-600"
        >
          {t('cta')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <p className="mb-3 text-sm text-slate-500">{t('prompt')}</p>
      <form onSubmit={handleActivate} className="flex gap-2">
        <input
          type="text"
          placeholder="GRAB-XXXX-XXXX-XXXX"
          value={key}
          onChange={(e) => setKey(formatKey(e.target.value))}
          maxLength={19}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-center font-mono text-sm tracking-widest focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={loading || key.length < 19}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : t('activate')}
        </button>
      </form>
      <button
        onClick={() => { setShowInput(false); setKey(''); }}
        className="mt-2 text-xs text-slate-400 hover:text-slate-500"
      >
        {t('cancel')}
      </button>
    </div>
  );
}
