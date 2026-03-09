import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getPlanFromKV } from '@/lib/ratelimit';

const querySchema = z.object({
  sessionId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      sessionId: url.searchParams.get('sessionId'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'sessionId is required', status: 400 },
        { status: 400 }
      );
    }

    const result = await getPlanFromKV(parsed.data.sessionId);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Plan check error:', error);
    return NextResponse.json(
      { error: 'Failed to check plan', status: 500 },
      { status: 500 }
    );
  }
}
