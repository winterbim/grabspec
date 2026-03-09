'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlanType } from '@/types';

interface SessionState {
  sessionId: string | null;
  plan: PlanType;
  searchesLeft: number;
  isLoading: boolean;
  refreshPlan: () => Promise<void>;
}

export function useSession(): SessionState {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanType>('free');
  const [searchesLeft, setSearchesLeft] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  const initSession = useCallback(async () => {
    const { getSessionId, getStoredPlan } = await import('@/lib/db');
    const id = await getSessionId();
    setSessionId(id);

    const storedPlan = await getStoredPlan();
    setPlan(storedPlan as PlanType);

    return id;
  }, []);

  const refreshPlan = useCallback(async () => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/plan?sessionId=${sessionId}`);
      const json = await res.json();

      if (json.data) {
        setPlan(json.data.plan as PlanType);
        setSearchesLeft(json.data.searchesLeft);

        const { setStoredPlan } = await import('@/lib/db');
        await setStoredPlan(json.data.plan);
      }
    } catch {
      // Silently fail — use cached plan
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const id = await initSession();
      if (cancelled) return;

      try {
        const res = await fetch(`/api/plan?sessionId=${id}`);
        const json = await res.json();
        if (!cancelled && json.data) {
          setPlan(json.data.plan as PlanType);
          setSearchesLeft(json.data.searchesLeft);
        }
      } catch {
        // Use defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [initSession]);

  return { sessionId, plan, searchesLeft, isLoading, refreshPlan };
}
