// This file now handles Stripe webhooks.
// It was previously named for Paddle to minimize file changes, but its logic is entirely for Stripe.
import Stripe from 'stripe';

// Helper to read body from Node.js request stream, which Vercel uses.
async function getRawBody(req: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        req.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        req.on('error', (err: Error) => {
            reject(err);
        });
    });
}

// Vercel provides request and response objects compatible with Node.js http module
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // --- Environment variables for Stripe and Make.com ---
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('Server configuration error: Missing environment variables for Stripe.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!MAKE_WEBHOOK_URL) {
    console.warn('Make.com webhook URL is not configured. License emails will not be sent.');
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' });
  const rawBody = await getRawBody(req);
  
  let event: Stripe.Event;

  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        return res.status(400).send('Webhook Error: No signature found.');
    }
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- Handle the Stripe event ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userEmail = session.customer_email;

    console.log(`Checkout session completed for email: ${userEmail}.`);
    
    // --- Trigger Make.com webhook for license key generation and email ---
    if (MAKE_WEBHOOK_URL && userEmail) {
        try {
            await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    customerName: session.customer_details?.name,
                    paymentId: session.payment_intent
                })
            });
            console.log(`Successfully triggered Make.com webhook for email ${userEmail}.`);
        } catch (webhookError) {
            console.error(`Failed to trigger Make.com webhook for email ${userEmail}.`, webhookError);
        }
    } else if (!MAKE_WEBHOOK_URL) {
        console.warn('MAKE_WEBHOOK_URL is not set. Cannot trigger licensing flow.');
    } else {
        console.warn(`No email found in checkout session. Cannot trigger licensing flow.`);
    }
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt of the event
  return res.status(200).json({ received: true });
}
