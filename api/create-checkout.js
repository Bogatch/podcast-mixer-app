// api/create-checkout.js
const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'METHOD_NOT_ALLOWED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = (body.email || '').trim();
    if (!email || !email.includes('@')) return res.status(400).json({ ok:false, error:'A valid email is required.' });

    // Extract metadata from the request body (sent by TermsGate component)
    const metadataFromRequest = body.metadata || {};

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith('sk_')) return res.status(500).json({ ok:false, error:'Stripe key missing/invalid.' });

    const stripe = new Stripe(key);
    const origin = req.headers.origin || 'https://pms.customradio.sk';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: 'price_1RvJg8Jz2UGjTjLqEBBfPknf', quantity: 1 }],
      success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_cancel=true`,
      // Pass all metadata to Stripe for logging
      metadata: { 
        user_email: email,
        ...metadataFromRequest
      },
    });

    if (!session.url) return res.status(500).json({ ok:false, error:'Failed to create Checkout URL' });
    return res.status(200).json({ ok:true, url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return res.status(err?.statusCode || 500).json({ ok:false, error: err?.message || 'Unexpected error' });
  }
};
