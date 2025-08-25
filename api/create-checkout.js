// api/create-checkout.js  (CommonJS, stabilná verzia)
const Stripe = require('stripe');

function safeParse(body) {
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return null; }
  }
  return body && typeof body === 'object' ? body : null;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    const payload = safeParse(req.body);
    if (!payload) return res.status(400).json({ ok: false, error: 'INVALID_JSON' });

    const email = String(payload.email || '').trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith('sk_')) {
      console.error('[create-checkout] Missing/invalid STRIPE_SECRET_KEY');
      return res.status(500).json({ ok: false, error: 'CONFIG_ERROR' });
    }

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const origin = req.headers.origin || 'https://pms.customradio.sk';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Podcast Mixer PRO License' },
          unit_amount: 2990, // 29.90 €
        },
        quantity: 1,
      }],
      success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_cancel=true`,
      metadata: { user_email: email },
    });

    if (!session || !session.url) {
      console.error('[create-checkout] No session.url returned');
      return res.status(500).json({ ok: false, error: 'NO_SESSION_URL' });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err) {
    console.error('[create-checkout] exception:', err && err.message, err && err.stack);
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: (err && err.message) || 'Unexpected server error'
    });
  }
};