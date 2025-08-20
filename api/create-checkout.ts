import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

// Stripe recommends initializing the client outside the request handler.
const stripe = new Stripe(String(stripeKey), {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

const LICENSE_PRICE_EUR_CENTS = 2900;
const PRODUCT_NAME = 'Podcast Mixer PRO License';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS, caching
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    try {
        if (!stripeKey || !stripeKey.startsWith('sk_')) {
            console.error('Stripe secret key is not configured or invalid.');
            return res.status(500).json({ ok: false, error: 'Server configuration error.' });
        }

        const { email } = req.body;
        const quantity = 1; // The UI does not support quantity selection.

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ ok: false, error: 'A valid email is required.' });
        }

        const origin = req.headers.origin || 'https://pms.customradio.sk';

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
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
            console.error('Stripe session was created without a URL.');
            return res.status(500).json({ ok: false, error: 'Could not create a payment session.' });
        }
        
        return res.status(200).json({ ok: true, url: session.url });

    } catch (err: any) {
        console.error('[create-checkout] exception:', { message: err?.message });
        const status = err?.statusCode || 500;
        return res.status(status).json({ ok: false, error: err?.code || 'UNEXPECTED_ERROR', message: err?.message || 'An unexpected error occurred.' });
    }
}