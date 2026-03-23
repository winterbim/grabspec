import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import {
  createLicense,
  listLicenses,
  revokeLicense,
  verifyAdmin,
} from '@/lib/licenses';

// ── POST: Create a new license (admin only) ──

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  plan: z.enum(['pro', 'business']).optional(),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const license = await createLicense(parsed.data);

    return NextResponse.json({ data: license }, { status: 201 });
  } catch (error) {
    console.error('License creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 },
    );
  }
}

// ── GET: List all licenses (admin only) ──

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const licenses = await listLicenses();

    return NextResponse.json({ data: licenses });
  } catch (error) {
    console.error('License list error:', error);
    return NextResponse.json(
      { error: 'Failed to list licenses' },
      { status: 500 },
    );
  }
}

// ── DELETE: Revoke a license (admin only) ──

const revokeSchema = z.object({
  key: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = revokeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'License key required' }, { status: 400 });
    }

    const success = await revokeLicense(parsed.data.key);

    if (!success) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { revoked: true } });
  } catch (error) {
    console.error('License revoke error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke license' },
      { status: 500 },
    );
  }
}
