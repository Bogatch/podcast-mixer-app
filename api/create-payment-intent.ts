import Stripe from 'stripe';

const LICENSE_PRICE_EUR = 2900;

function log(ctx: string, data: any) {
  try { console.log(`[create-payment-intent] ${ctx}: ${JSON.stringify(data, null, 2)}`); }
  catch { console.log(`[create-payment-intent] ${ctx}: [unserializable]`); }
}

export default async function handler(req: any, res: any) {
    // Set common headers
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
        // Vercel's Node.js runtime automatically parses JSON bodies
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

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

        const existing = await stripe.customers.list({ email, limit: 1 });
        const customer = existing.data[0] ?? (await stripe.customers.create({ email }));

        const paymentIntent = await stripe.paymentIntents.create({
            amount: LICENSE_PRICE_EUR,
            currency: 'eur',
            customer: customer.id,
            automatic_payment_methods: { enabled: true },
            metadata: { product: 'Podcast Mixer PRO License', user_email: email },
        });

        log('success', { customerId: customer.id, paymentIntent: paymentIntent.id });

        return res.status(200).json({
            ok: true,
            clientSecret: paymentIntent.client_secret,
        });

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