
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe only if the key exists.
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  if (!stripe) {
    console.error('Stripe secret key is not configured. Cannot create checkout session.');
    return res.status(500).json({ error: { message: 'Payment processor is not configured on the server.' } });
  }

  try {
    const origin = req.headers.origin || 'https://podcast-mixer-app.vercel.app';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Podcast Mixer Studio - Premium License',
              description: 'Lifetime access to all premium features and future updates.',
            },
            unit_amount: 2999, // 29.99 EUR
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}?payment_success=true`,
      cancel_url: `${origin}?payment_canceled=true`,
      allow_promotion_codes: true,
    });

    if (session.url) {
      res.status(200).json({ url: session.url });
    } else {
      throw new Error('Stripe session URL not created.');
    }
  } catch (err: any) {
    console.error('Stripe checkout session creation failed:', err.message);
    res.status(500).json({ error: { message: err.message } });
  }
}
