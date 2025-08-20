// /api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const LICENSE_PRICE_EUR_CENTS = 2900; // 29.00 €
const PRODUCT_NAME = 'Podcast Mixer PRO License';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    // ENV kontrola
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      console.error('[checkout] Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ ok: false, error: 'CONFIG_MISSING_STRIPE_SECRET_KEY' });
    }

    // Bezpečné načítanie JSON tela
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const email = String(body?.email || '').trim();
    const quantity = Number(body?.quantity ?? 1);

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, error: 'INVALID_QUANTITY' });
    }

    // Inicializácia Stripe (platná API verzia)
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Origin pre redirect (curl zväčša neposiela Origin)
    const rawOrigin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
    const origin = (rawOrigin && rawOrigin.startsWith('http')) ? rawOrigin : 'https://pms.customradio.sk';

    // Vytvorenie Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // nechaj len kartu; ďalšie metódy (napr. Klarna) pridaj až po aktivácii v Stripe Dashboarde
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
            unit_amount: LICENSE_PRICE_EUR_CENTS,
          },
          quantity,
        },
      ],
      success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_cancel=true`,
      metadata: { user_email: email },
    });

    if (!session.url) {
      console.error('[checkout] Session created without URL');
      return res.status(500).json({ ok: false, error: 'NO_SESSION_URL' });
    }

    return res.status(200).json({ ok: true, id: session.id, url: session.url });
  } catch (err: any) {
    console.error('[checkout] exception:', { message: err?.message, code: err?.code, type: err?.type });
    const status = err?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: err?.code || 'UNEXPECTED_ERROR',
      message: err?.message || 'Unexpected error',
    });
  }
}