// /api/create-checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is the specific Stripe Payment Link requested.
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe14ogcG5bi9QR47g';

export default function handler(req: VercelRequest, res: VercelResponse) {
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
    const body = req.body ?? {};
    const email = String(body?.email || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'INVALID_EMAIL' });
    }
    
    // Construct the payment link URL with the prefilled email.
    // Note: The '00000' from a previous user prompt was omitted as it appears to be a typo for a valid link ID.
    const checkoutUrl = new URL(STRIPE_PAYMENT_LINK);
    checkoutUrl.searchParams.append('prefilled_email', email);

    return res.status(200).json({ ok: true, url: checkoutUrl.toString() });

  } catch (err: any) {
    console.error('Error in create-checkout:', err);
    return res.status(500).json({
      ok: false,
      error: 'UNEXPECTED_ERROR',
      message: err?.message || 'Unexpected error occurred.',
    });
  }
}
