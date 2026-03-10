import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getStripeServer, getPriceId } from '@/lib/stripe';
import { getAppUrl } from '@/lib/app-url';

const bodySchema = z.object({
  plan: z.enum(['pro', 'business']),
  interval: z.enum(['monthly', 'yearly']),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', status: 400 },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured', status: 500 },
        { status: 500 }
      );
    }

    const { plan, interval, sessionId } = parsed.data;
    const priceId = getPriceId(plan, interval);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid price configuration', status: 500 },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: sessionId,
      success_url: `${appUrl}/pricing?success=true`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({ data: { checkoutUrl: session.url } });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', status: 500 },
      { status: 500 }
    );
  }
}
