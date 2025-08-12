/// <reference types="node" />

import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
  const APP_URL = process.env.APP_URL;

  // Added logging to check if environment variables are loaded
  console.log('--- Checking Environment Variables ---');
  console.log('STRIPE_SECRET_KEY loaded:', !!STRIPE_SECRET_KEY ? `...${STRIPE_SECRET_KEY.slice(-4)}` : 'Not loaded');
  console.log('STRIPE_PRICE_ID loaded:', !!STRIPE_PRICE_ID);
  console.log('APP_URL loaded:', APP_URL || 'Not loaded');
  console.log('------------------------------------');

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !APP_URL) {
    const missingVars = [];
    if (!STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY');
    if (!STRIPE_PRICE_ID) missingVars.push('STRIPE_PRICE_ID');
    if (!APP_URL) missingVars.push('APP_URL');

    const errorMessage = `Server configuration error. The following environment variables are missing in your Vercel project settings: ${missingVars.join(', ')}. Please add them to proceed.`;
    console.error(errorMessage);
    return res.status(500).json({ error: { message: errorMessage } });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: { message: 'Email is required.' } });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}?payment=success`,
      cancel_url: `${APP_URL}?payment=cancel`,
      customer_email: email,
    });

    if (!session.id) {
      return res.status(500).json({ error: { message: 'Could not create checkout session.' } });
    }
    
    return res.status(200).json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Error creating Stripe checkout:', error);
    const message = error.raw?.message || error.message || 'An unexpected server error occurred.';
    return res.status(500).json({ error: { message: message, details: error.toString() } });
  }
}