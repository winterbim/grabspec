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

export async function checkRateLimit(sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  if (!ratelimit || !redis) {
    return { allowed: true, remaining: FREE_DAILY_LIMIT };
  }

  const planData = await redis.get<string>(`plan:${sessionId}`);
  if (planData) {
    const parsed = JSON.parse(planData) as { plan: string; expiresAt: string };
    if (parsed.plan !== 'free' && new Date(parsed.expiresAt) > new Date()) {
      return { allowed: true, remaining: 999 };
    }
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

  const planData = await redis.get<string>(`plan:${sessionId}`);
  if (planData) {
    const parsed = JSON.parse(planData) as { plan: string; expiresAt: string };
    if (new Date(parsed.expiresAt) > new Date()) {
      return { plan: parsed.plan, searchesLeft: 999 };
    }
  }

  const ratelimitKey = `grabspec:ratelimit:${sessionId}`;
  const used = await redis.get<number>(ratelimitKey);
  const remaining = Math.max(0, FREE_DAILY_LIMIT - (used || 0));

  return { plan: 'free', searchesLeft: remaining };
}
