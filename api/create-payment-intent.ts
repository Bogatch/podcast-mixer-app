const Stripe = require('stripe');

const LICENSE_PRICE_EUR = 2900; // 29.00 EUR v centoch

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Povolená je iba metóda POST' });
    }

    // Parsovanie tela požiadavky
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.status(400).json({ error: 'Neplatné JSON telo požiadavky' });
    }

    const { email } = body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Je potrebné zadať platnú emailovú adresu' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      console.error('KĽÚČOVÁ CHYBA: STRIPE_SECRET_KEY chýba alebo je neplatná');
      return res.status(500).json({ error: 'Platobný procesor nie je správne nakonfigurovaný' });
    }

    const stripe = new Stripe(stripeSecretKey);

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer = existingCustomers.data.length > 0 ? existingCustomers.data[0] : await stripe.customers.create({ email });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: LICENSE_PRICE_EUR,
      currency: 'eur',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { product: 'Podcast Mixer PRO License', user_email: email },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Chyba v /api/create-payment-intent:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Vyskytla sa neočakávaná chyba pri príprave platby' });
  }
}