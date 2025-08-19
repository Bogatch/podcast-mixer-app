import Stripe from 'stripe';

const LICENSE_PRICE_EUR = 2900;

function log(ctx: string, data: any) {
  try { console.log(`[create-payment-intent] ${ctx}: ${JSON.stringify(data, null, 2)}`); }
  catch { console.log(`[create-payment-intent] ${ctx}: [unserializable]`); }
}

export async function OPTIONS() {
  const res = new Response(null, { status: 200 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function POST(req: Request) {
  const resHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });

  try {
    const contentType = req.headers.get('content-type') || '';
    log('request-meta', { contentType });

    const body = contentType.includes('application/json') ? await req.json() : {};
    const email = (body?.email ?? '').toString().trim();
    if (!email || !email.includes('@')) {
      log('validation-error', { email });
      return new Response(JSON.stringify({ ok: false, error: { type: 'validation', code: 'INVALID_EMAIL', message: 'A valid email is required.' } }), { status: 400, headers: resHeaders });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey?.startsWith('sk_')) {
      log('config-error', { hasKey: !!stripeSecretKey, prefix: stripeSecretKey?.slice(0, 3) });
      return new Response(JSON.stringify({ ok: false, error: { type: 'config', code: 'CONFIG_MISSING_STRIPE_SECRET_KEY', message: 'Server configuration error.' } }), { status: 500, headers: resHeaders });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });

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

    return new Response(JSON.stringify({
      ok: true,
      clientSecret: paymentIntent.client_secret,
    }), { status: 200, headers: resHeaders });
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

      return new Response(JSON.stringify({
          ok: false,
          error: {
              code: errorCode,
              type: errorType,
              message: errorMessage,
          },
      }), { status: errorStatus, headers: resHeaders });
  }
}