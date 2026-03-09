import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getStripeServer } from '@/lib/stripe';

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

    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured', status: 500 },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Find the customer by client_reference_id
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const matchingSession = sessions.data.find(
      (s) => s.client_reference_id === parsed.data.sessionId
    );

    if (!matchingSession?.customer) {
      return NextResponse.json(
        { error: 'No subscription found', status: 404 },
        { status: 404 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: matchingSession.customer as string,
      return_url: `${appUrl}/pricing`,
    });

    return NextResponse.json({ data: { portalUrl: portal.url } });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session', status: 500 },
      { status: 500 }
    );
  }
}
