// Using require for Stripe import to ensure maximum compatibility in Node.js serverless environments.
// This is a robust way to prevent module resolution issues that can cause function invocation failures.
const Stripe = require('stripe');

// Hardcoded price for the license.
const LICENSE_PRICE_EUR = 2900; // in cents, so 29.00 EUR

export default async function handler(req: any, res: any) {
  // Set headers for CORS and content type immediately.
  // This ensures that even if an error occurs, the client receives a correctly formatted response.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- STRIPE SECRET KEY VALIDATION ---
    // This is the most critical part. We must validate the key before using it.
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      console.error('CRITICAL: STRIPE_SECRET_KEY environment variable is not set or is invalid.');
      return res.status(500).json({ error: 'Payment processor is not configured correctly on the server.' });
    }
    
    // --- REQUEST BODY VALIDATION ---
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
    }
    
    // --- STRIPE API INTERACTION ---
    const stripe = new Stripe(stripeSecretKey);

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
    console.error('Error in /api/create-payment-intent:', {
      message: error.message,
      stack: error.stack,
    });
    // This final catch block ensures a valid JSON response is sent on any unexpected failure.
    // This prevents the "Unexpected token 'A', 'A server e'... is not valid JSON" error on the client.
    res.status(500).json({ error: 'An unexpected server error occurred while preparing the payment form.' });
  }
}
