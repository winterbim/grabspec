import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, readStripeEnv } from '@/lib/stripe';
import { Redis } from '@upstash/redis';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured', status: 500 },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = readStripeEnv('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret', status: 400 },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    if (!kvUrl || !kvToken) {
      return NextResponse.json(
        { error: 'KV not configured', status: 500 },
        { status: 500 }
      );
    }

    const redis = new Redis({ url: kvUrl, token: kvToken });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.client_reference_id;

      if (sessionId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = determinePlan(priceId);
        const currentPeriodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;
        const expiresAt = new Date(
          currentPeriodEnd * 1000
        ).toISOString();

        await redis.set(
          `plan:${sessionId}`,
          JSON.stringify({ plan, expiresAt })
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const sessions = await stripe.checkout.sessions.list({
        subscription: subscription.id,
        limit: 1,
      });

      const sessionId = sessions.data[0]?.client_reference_id;
      if (sessionId) {
        await redis.del(`plan:${sessionId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', status: 500 },
      { status: 500 }
    );
  }
}

function determinePlan(priceId: string): string {
  const proMonthly = readStripeEnv('STRIPE_PRO_MONTHLY_PRICE_ID');
  const proYearly = readStripeEnv('STRIPE_PRO_YEARLY_PRICE_ID');
  const businessMonthly = readStripeEnv('STRIPE_BUSINESS_MONTHLY_PRICE_ID');
  const businessYearly = readStripeEnv('STRIPE_BUSINESS_YEARLY_PRICE_ID');

  if (priceId === proMonthly || priceId === proYearly) return 'pro';
  if (priceId === businessMonthly || priceId === businessYearly)
    return 'business';
  return 'pro';
}
