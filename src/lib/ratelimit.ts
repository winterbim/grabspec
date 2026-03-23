import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { FREE_DAILY_LIMIT } from '@/types';

function createRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(FREE_DAILY_LIMIT, '1 d'),
      prefix: 'grabspec:ratelimit',
    })
  : null;

function getActivePlan(planData: unknown): { plan: string; expiresAt: string } | null {
  if (!planData) return null;

  try {
    // Upstash auto-deserializes JSON, so planData may be an object or a string
    const parsed = typeof planData === 'string'
      ? JSON.parse(planData) as { plan?: string; expiresAt?: string }
      : planData as { plan?: string; expiresAt?: string };
    if (!parsed.plan || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt) <= new Date()) return null;
    return { plan: parsed.plan, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export async function checkRateLimit(sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  if (!ratelimit || !redis) {
    return { allowed: true, remaining: FREE_DAILY_LIMIT };
  }

  const activePlan = getActivePlan(await redis.get<string>(`plan:${sessionId}`));
  if (activePlan?.plan !== 'free') {
    return { allowed: true, remaining: 999 };
  }

  const result = await ratelimit.limit(sessionId);
  return { allowed: result.success, remaining: result.remaining };
}

export async function getPlanFromKV(sessionId: string): Promise<{
  plan: string;
  searchesLeft: number;
}> {
  if (!redis) {
    return { plan: 'free', searchesLeft: FREE_DAILY_LIMIT };
  }

  const activePlan = getActivePlan(await redis.get<string>(`plan:${sessionId}`));
  if (activePlan) {
    return { plan: activePlan.plan, searchesLeft: activePlan.plan === 'free' ? FREE_DAILY_LIMIT : 999 };
  }

  if (!ratelimit) {
    return { plan: 'free', searchesLeft: FREE_DAILY_LIMIT };
  }

  const { remaining } = await ratelimit.getRemaining(sessionId);

  return { plan: 'free', searchesLeft: remaining };
}
