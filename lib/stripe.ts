// lib/stripe.ts
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith('sk_')) {
  throw new Error('STRIPE_SECRET_KEY is missing or invalid.');
}

// Use env or safe default; must be a date format, not a codename.
const STRIPE_API_VERSION = (process.env.STRIPE_API_VERSION || '2024-06-20').trim();

if (!/^\d{4}-\d{2}-\d{2}$/.test(STRIPE_API_VERSION)) {
  throw new Error(
    `Invalid STRIPE_API_VERSION "${STRIPE_API_VERSION}". Use a date like 2024-06-20 (not "basil").`
  );
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig['apiVersion'],
});
