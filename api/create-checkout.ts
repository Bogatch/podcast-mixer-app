// This API route creates a Stripe Checkout session.
// It was previously used for Paddle but is now repurposed for Stripe.
// It securely uses server-side environment variables.

import Stripe from 'stripe';

const jsonResponse = (body: object, status: number) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: { message: 'Method Not Allowed' } }, 405);
  }

  // IMPORTANT: These must be set as environment variables on your server (e.g., in Vercel).
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
  const APP_URL = process.env.APP_URL; // Your app's public URL

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !APP_URL) {
    console.error('Stripe secret key, price ID, or App URL is not configured on the server.');
    return jsonResponse({ error: { message: 'Server configuration error.' } }, 500);
  }

  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
        return jsonResponse({ error: { message: 'Email and User ID are required.' } }, 400);
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2025-07-30.basil', // Use a fixed API version
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
      client_reference_id: userId, // CRUCIAL for linking payment to user in webhook
    });

    if (!session.id) {
        return jsonResponse({ error: { message: 'Could not create checkout session.' } }, 500);
    }
    
    return jsonResponse({ sessionId: session.id }, 200);

  } catch (error: any) {
    console.error('Error creating Stripe checkout:', error);
    return jsonResponse({ error: { message: 'An unexpected server error occurred.', details: error.message } }, 500);
  }
}