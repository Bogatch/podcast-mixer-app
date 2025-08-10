
// This file now handles Stripe webhooks.
// It was previously named for Paddle to minimize file changes, but its logic is entirely for Stripe.

// This is a workaround for the build environment not having node types.
// It tells TypeScript that 'Buffer' exists as a global type.
declare class Buffer extends Uint8Array {
  static concat(list: readonly Uint8Array[], totalLength?: number): Buffer;
}

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
// It's assumed the 'stripe' npm package is available in the Vercel environment.
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

  // --- Environment variables for Stripe and Supabase ---
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Server configuration error: Missing environment variables for Stripe/Supabase.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' });
  const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
    const userId = session.client_reference_id;

    if (!userId) {
      console.error('CRITICAL: checkout.session.completed event without client_reference_id!', session);
      // Still return 200 to acknowledge receipt of the event to Stripe.
      return res.status(200).json({ received: true });
    }

    try {
      // Update the user's profile to grant PRO access
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId);

      if (updateError) {
        console.error(`Failed to update profile for user ${userId}`, updateError);
        // Don't return 500 here, as Stripe would retry. The error is logged.
      } else {
        console.log(`Successfully upgraded user ${userId} to PRO.`);
      }
    } catch (dbError) {
      console.error('Database error during profile update:', dbError);
    }
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt of the event
  return res.status(200).json({ received: true });
}
