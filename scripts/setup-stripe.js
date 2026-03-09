#!/usr/bin/env node
/**
 * GrabSpec — Stripe products & prices setup script
 *
 * Usage: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.js
 *
 * Creates:
 * - Product: GrabSpec Pro
 *   - Price: CHF 9.90/month
 *   - Price: CHF 99.00/year
 * - Product: GrabSpec Business
 *   - Price: CHF 29.90/month
 *   - Price: CHF 298.80/year
 *
 * Outputs the price IDs to paste into .env.local
 */

const Stripe = require('stripe');

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('ERROR: Set STRIPE_SECRET_KEY environment variable');
  console.error('Usage: STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe.js');
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  console.log('Creating GrabSpec Stripe products & prices...\n');

  // ── Product: GrabSpec Pro ──
  const proProd = await stripe.products.create({
    name: 'GrabSpec Pro',
    description: 'Recherches illimitées, bibliothèque, nomenclature, export ZIP',
    metadata: { app: 'grabspec', tier: 'pro' },
  });
  console.log(`✓ Product: ${proProd.name} (${proProd.id})`);

  const proMonthly = await stripe.prices.create({
    product: proProd.id,
    unit_amount: 990, // CHF 9.90
    currency: 'chf',
    recurring: { interval: 'month' },
    metadata: { plan: 'pro', interval: 'monthly' },
  });
  console.log(`  Price: CHF 9.90/month (${proMonthly.id})`);

  const proYearly = await stripe.prices.create({
    product: proProd.id,
    unit_amount: 9900, // CHF 99.00
    currency: 'chf',
    recurring: { interval: 'year' },
    metadata: { plan: 'pro', interval: 'yearly' },
  });
  console.log(`  Price: CHF 99.00/year (${proYearly.id})`);

  // ── Product: GrabSpec Business ──
  const bizProd = await stripe.products.create({
    name: 'GrabSpec Business',
    description: 'Tout Pro + branding entreprise, logo, coordonnées projet sur exports',
    metadata: { app: 'grabspec', tier: 'business' },
  });
  console.log(`\n✓ Product: ${bizProd.name} (${bizProd.id})`);

  const bizMonthly = await stripe.prices.create({
    product: bizProd.id,
    unit_amount: 2990, // CHF 29.90
    currency: 'chf',
    recurring: { interval: 'month' },
    metadata: { plan: 'business', interval: 'monthly' },
  });
  console.log(`  Price: CHF 29.90/month (${bizMonthly.id})`);

  const bizYearly = await stripe.prices.create({
    product: bizProd.id,
    unit_amount: 29880, // CHF 298.80
    currency: 'chf',
    recurring: { interval: 'year' },
    metadata: { plan: 'business', interval: 'yearly' },
  });
  console.log(`  Price: CHF 298.80/year (${bizYearly.id})`);

  // ── Output ──
  console.log('\n═══════════════════════════════════════════');
  console.log('Add these to your .env.local:\n');
  console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
  console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearly.id}`);
  console.log(`STRIPE_BUSINESS_MONTHLY_PRICE_ID=${bizMonthly.id}`);
  console.log(`STRIPE_BUSINESS_YEARLY_PRICE_ID=${bizYearly.id}`);
  console.log('\n═══════════════════════════════════════════');
  console.log('\nNext steps:');
  console.log('1. Copy the price IDs above into .env.local');
  console.log('2. Create a webhook at https://dashboard.stripe.com/webhooks');
  console.log('   Endpoint: https://grabspec.vercel.app/api/stripe/webhook');
  console.log('   Events: checkout.session.completed, customer.subscription.deleted');
  console.log('3. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET');
  console.log('4. Add all env vars to Vercel: npx vercel env add ...');
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
