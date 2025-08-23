// /api/create-checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const PRICE_EUR_CENTS = 2900; // 29.00 €
const PRODUCT_NAME = 'Podcast Mixer PRO License';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      console.error('Stripe secret key is not configured.');
      return res.status(500).json({ ok: false, error: 'CONFIG_MISSING_STRIPE_SECRET_KEY' });
    }

    // Vercel automaticky parsuje JSON telo požiadavky
    const body = req.body ?? {};
    const email = String(body?.email || '').trim();
    const quantity = Number(body?.quantity ?? 1);

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, error: 'INVALID_QUANTITY' });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-07-30.basil' });

    // Origin pre redirect
    const rawOrigin = req.headers.origin;
    const origin = (typeof rawOrigin === 'string' && rawOrigin.startsWith('http'))
      ? rawOrigin
      : 'https://pms.customradio.sk';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: PRODUCT_NAME,
              description: 'Full lifetime license for Podcast Mixer Studio.',
            },
            unit_amount: PRICE_EUR_CENTS,
          },
          quantity,
        },
      ],
      success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_cancel=true`,
      metadata: { user_email: email },
    });

    if (!session.url) {
      console.error('Stripe session was created without a URL.');
      return res.status(500).json({ ok: false, error: 'NO_SESSION_URL' });
    }

    return res.status(200).json({ ok: true, id: session.id, url: session.url });
  } catch (err: any) {
    console.error('Error in create-checkout:', err);
    const status = err?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: err?.code || 'UNEXPECTED_ERROR',
      message: err?.message || 'Unexpected error occurred.',
    });
  }
}