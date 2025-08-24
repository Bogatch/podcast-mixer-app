// /api/create-checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../lib/stripe';

export const runtime = 'nodejs';

// --- IMPORTANT ---
// This function requires two things to be configured:
// 1. STRIPE_SECRET_KEY: You must set this as an environment variable in your Vercel project settings.
//    You can find your secret key in your Stripe Dashboard under Developers > API keys.
// 2. STRIPE_PRICE_ID: You must replace the placeholder value below with the actual Price ID for your product.
//    You can find this in your Stripe Dashboard under Products > (Your Product) > Pricing. It looks like 'price_...'.

const STRIPE_PRICE_ID = 'price_1KhQ3FJz2UGjTjLq5z6y7x8y'; // <<< REPLACE WITH YOUR ACTUAL PRICE ID if this one is incorrect.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const { email } = req.body;

    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
    }

    // Use req.headers.origin for dynamic URLs in development and production
    const origin = req.headers.origin || 'https://pms.customradio.sk';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?purchase=success`,
      cancel_url: `${origin}/`,
      customer_email: email,
    });

    if (!session.url) {
      throw new Error('Stripe session URL could not be created.');
    }

    return res.status(200).json({ ok: true, url: session.url });

  } catch (err: any) {
    console.error('Error creating Stripe checkout session:', err);
    return res.status(500).json({
      ok: false,
      error: 'STRIPE_API_ERROR',
      message: err.message || 'An unexpected error occurred.',
    });
  }
}