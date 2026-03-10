import Stripe from 'stripe';

export function readStripeEnv(key: string): string {
  const value = process.env[key];
  if (!value) return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

export function getStripeServer(): Stripe | null {
  const key = readStripeEnv('STRIPE_SECRET_KEY');
  if (!key) return null;
  return new Stripe(key);
}

export const PRICE_IDS = {
  pro_monthly: readStripeEnv('STRIPE_PRO_MONTHLY_PRICE_ID'),
  pro_yearly: readStripeEnv('STRIPE_PRO_YEARLY_PRICE_ID'),
  business_monthly: readStripeEnv('STRIPE_BUSINESS_MONTHLY_PRICE_ID'),
  business_yearly: readStripeEnv('STRIPE_BUSINESS_YEARLY_PRICE_ID'),
} as const;

export type PriceKey = keyof typeof PRICE_IDS;

export function getPriceId(plan: string, interval: string): string {
  const key = `${plan}_${interval}` as PriceKey;
  return PRICE_IDS[key] || '';
}
