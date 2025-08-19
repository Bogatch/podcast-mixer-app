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
      return new Response(JSON.stringify({ ok: false, error: 'INVALID_EMAIL' }), { status: 400, headers: resHeaders });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey?.startsWith('sk_')) {
      log('config-error', { hasKey: !!stripeSecretKey, prefix: stripeSecretKey?.slice(0, 3) });
      return new Response(JSON.stringify({ ok: false, error: 'CONFIG_MISSING_STRIPE_SECRET_KEY' }), { status: 500, headers: resHeaders });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' });

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
      diagnostics: {
        customerId: customer.id,
        paymentIntentId: paymentIntent.id,
        currency: paymentIntent.currency,
        amount: paymentIntent.amount,
      },
    }), { status: 200, headers: resHeaders });
  } catch (err: any) {
    log('exception', { message: err?.message, type: err?.type, stack: err?.stack?.split('\n')?.slice(0, 3) });
    const status = err?.statusCode || 500;
    return new Response(JSON.stringify({
      ok: false,
      error: err?.code || 'UNEXPECTED_ERROR',
      message: err?.message || 'Unexpected error',
    }), { status, headers: resHeaders });
  }
}
