import Stripe from 'stripe';

const LICENSE_PRICE_EUR = 2900; // 29.00 EUR in cents

export default async function handler(req, res) {
  // Nastavenie CORS hlavičiek
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Spracovanie CORS preflight požiadaviek
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' });
    }

    // Parsovanie tela požiadavky
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body !== 'object') {
        throw new Error('Invalid request body');
      }
    } catch (e) {
      return res.status(400).json({ error: 'Neplatné JSON telo požiadavky' });
    }

    const { email } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    // Validácia Stripe kľúča
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      console.error('CONFIGURATION ERROR: STRIPE_SECRET_KEY is missing or invalid.');
      return res.status(500).json({ error: 'Payment processor is not configured correctly.' });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Vyhľadanie existujúceho zákazníka alebo vytvorenie nového
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer = existingCustomers.data.length > 0 
      ? existingCustomers.data[0] 
      : await stripe.customers.create({ email });

    // Vytvorenie PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: LICENSE_PRICE_EUR,
      currency: 'eur',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { product: 'Podcast Mixer PRO License', user_email: email },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error in /api/create-payment-intent:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'An unexpected error occurred while preparing the payment.' });
  }
}