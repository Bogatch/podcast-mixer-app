import Stripe from 'stripe';

const LICENSE_PRICE_EUR_CENTS = 2900;
const PRODUCT_NAME = 'Podcast Mixer PRO License';

// Helper for logging to Vercel console
function log(ctx: string, data: any) {
  try {
    console.log(`[create-checkout-session] ${ctx}: ${JSON.stringify(data, null, 2)}`);
  } catch {
    console.log(`[create-checkout-session] ${ctx}: [unserializable]`);
  }
}

export default async function handler(req: any, res: any) {
    // Set common headers for CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: { type: 'api', code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
    }

    try {
        const body = req.body || {};
        const email = (body?.email ?? '').toString().trim();
        
        if (!email || !email.includes('@')) {
            log('validation-error', { email });
            return res.status(400).json({ ok: false, error: { type: 'validation', code: 'INVALID_EMAIL', message: 'A valid email is required.' } });
        }

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey?.startsWith('sk_')) {
            log('config-error', { hasKey: !!stripeSecretKey, prefix: stripeSecretKey?.slice(0, 3) });
            return res.status(500).json({ ok: false, error: { type: 'config', code: 'CONFIG_MISSING_STRIPE_SECRET_KEY', message: 'Server configuration error.' } });
        }
        
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });
        
        const origin = req.headers.origin || 'https://podcast-mixer.studio';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal', 'klarna'],
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
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/?payment_cancel=true`,
            metadata: {
                user_email: email,
            },
        });

        if (!session.url) {
             throw new Error("Stripe Checkout Session URL was not created.");
        }

        log('success', { email, sessionId: session.id });

        return res.status(200).json({ ok: true, url: session.url });

    } catch (err: any) {
        let errorMessage = 'An unexpected error occurred.';
        let errorCode = 'UNEXPECTED_ERROR';
        let errorType = 'api';
        let errorStatus = 500;

        if (err instanceof Stripe.errors.StripeError) {
            errorType = 'stripe';
            errorStatus = err.statusCode || 500;
            errorCode = err.code || `STRIPE_${err.type.toUpperCase()}`;
            errorMessage = err.message || 'An error occurred with our payment provider.';
            log('stripe-error', { type: err.type, code: err.code, message: err.message });
        } else {
            errorMessage = err.message || 'An internal server error occurred.';
            errorCode = err.code || 'INTERNAL_API_ERROR';
            log('api-exception', { message: err?.message, stack: err?.stack?.split('\n')?.slice(0, 3) });
        }

        return res.status(errorStatus).json({
            ok: false,
            error: {
                code: errorCode,
                type: errorType,
                message: errorMessage,
            },
        });
    }
}