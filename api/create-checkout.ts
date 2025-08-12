/// <reference types="node" />

// This API route creates a Stripe Checkout session.
// It securely uses server-side environment variables and the Node.js runtime on Vercel.

import type { VercelRequest, VercelResponse } from '@vercel/node';
// Use `require` for robust compatibility with Vercel's Node.js runtime for CJS modules.
const Stripe = require('stripe');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // IMPORTANT: These must be set as environment variables on your server (e.g., in Vercel).
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
  const APP_URL = process.env.APP_URL; // Your app's public URL

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !APP_URL) {
    console.error('Server configuration error: Required Stripe environment variables are missing.');
    return res.status(500).json({ error: { message: 'Server configuration error. Please ensure STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and APP_URL are set in your Vercel project settings.' } });
  }

  try {
    // Vercel automatically parses the JSON body for Node.js functions
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: { message: 'Email is required.' } });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2025-07-30.basil', // Use a fixed API version
        typescript: true, // Recommended for TypeScript projects
    });

    // Create a Checkout Session.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}?payment=success`, // Redirect here on success
      cancel_url: `${APP_URL}?payment=cancel`,   // Redirect here on cancellation
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