import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { activateLicense } from '@/lib/licenses';
import { Redis } from '@upstash/redis';

const MASTER_KEY = 'GRAB-SPEC-91AW-JA91';

const activateSchema = z.object({
  key: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Clé de licence et sessionId requis' },
        { status: 400 },
      );
    }

    const { key, sessionId } = parsed.data;

    // Master key — grants business access directly
    if (key === MASTER_KEY) {
      const url = process.env.KV_REST_API_URL;
      const token = process.env.KV_REST_API_TOKEN;
      if (url && token) {
        const redis = new Redis({ url, token });
        const farFuture = new Date('2099-12-31').toISOString();
        await redis.set(
          `plan:${sessionId}`,
          JSON.stringify({ plan: 'business', expiresAt: farFuture }),
        );
      }
      return NextResponse.json({
        data: { plan: 'business', name: 'Admin', email: '' },
      });
    }

    const result = await activateLicense(key, sessionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        plan: result.license!.plan,
        name: result.license!.name,
        email: result.license!.email,
      },
    });
  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json(
      { error: 'Échec de l\'activation de la licence' },
      { status: 500 },
    );
  }
}
