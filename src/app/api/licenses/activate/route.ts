import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { activateLicense } from '@/lib/licenses';

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

    const result = await activateLicense(parsed.data.key, parsed.data.sessionId);

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
