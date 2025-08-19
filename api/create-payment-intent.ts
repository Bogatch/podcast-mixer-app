import Stripe from 'stripe';

// This function is designed to run on Vercel's serverless environment.
// It requires STRIPE_SECRET_KEY to be set as an environment variable.

// Hardcoded price for the license.
const LICENSE_PRICE_EUR = 2900; // in cents, so 29.00 EUR

export default async function handler(req: any, res: any) {
  // Set headers for CORS and content type
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Defensive check for the Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('CRITICAL: STRIPE_SECRET_KEY environment variable is not set or is invalid.');
    // Provide a user-friendly error without exposing server details.
    return res.status(500).json({ error: 'The payment processor is not configured correctly on the server.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
    }

    // Check if a customer with this email already exists to avoid duplicates
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });
    let customer;
    if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
    } else {
        customer = await stripe.customers.create({ email });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: LICENSE_PRICE_EUR,
      currency: 'eur',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product: 'Podcast Mixer PRO License',
        user_email: email,
      },
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe API error:', error.message);
    res.status(500).json({ error: 'An error occurred while communicating with the payment provider.' });
  }
}