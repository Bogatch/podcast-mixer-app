

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import type { Database } from '../lib/database.types';
import { Resend } from 'resend';

// --- Safe Initializations ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient<Database>(supabaseUrl, supabaseKey) : null;

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Zakáže predvolený parser tela požiadavky, aby sme mohli čítať raw body pre Stripe.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Funkcia na generovanie unikátneho licenčného kľúča
const generateLicenseKey = (): string => {
    return 'PM-' + Array.from({ length: 3 }, () => randomBytes(4).toString('hex').toUpperCase()).join('-');
};

// E-mailová šablóna
const createEmailHtml = (key: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Ďakujeme za váš nákup!</h2>
    <p>Váš licenčný kľúč pre <strong>Podcast Mixer Studio</strong> je pripravený.</p>
    <p>Pre odomknutie všetkých prémiových funkcií použite v aplikácii svoj e-mail a tento kľúč:</p>
    <p style="background: #f0f0f0; border: 1px solid #ccc; padding: 10px 15px; font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 2px;">
      ${key}
    </p>
    <p>Ďakujeme za podporu!</p>
    <p>S pozdravom,<br>Tím KIKS® Soft</p>
  </div>
`;

// Helper funkcia na načítanie raw body
const buffer = (req: VercelRequest) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // --- Pre-flight checks ---
  if (!supabase || !resend || !stripe || !webhookSecret) {
      console.error('One or more services are not configured. Check environment variables for Supabase, Resend, and Stripe.');
      return res.status(500).json({ error: 'Server configuration error.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }
  
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Spracovanie udalosti checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error('Customer email not found in checkout session.');
      return res.status(400).json({ error: 'Customer email is missing.' });
    }
    
    try {
      // 1. Vygenerovanie kľúča
      const newKey = generateLicenseKey();

      // 2. Uloženie do databázy
      const { error: dbError } = await supabase
        .from('licenses')
        .insert({
          license_key: newKey,
          status: 'available',
          product_id: 'PODCAST_MIXER_PRO',
        });

      if (dbError) {
        console.error('Database error on license creation:', dbError);
        throw new Error('Failed to save license to database.');
      }
      console.log(`Vygenerovaný a uložený kľúč ${newKey} po platbe od ${customerEmail}`);

      // 3. Odoslanie e-mailu zákazníkovi
      const { error: emailError } = await resend.emails.send({
        from: 'Podcast Mixer Studio <sales@kiks.sk>', // Nahraďte vašou overenou doménou
        to: [customerEmail],
        subject: 'Váš licenčný kľúč pre Podcast Mixer Studio',
        html: createEmailHtml(newKey),
      });

      if (emailError) {
          console.error('Email sending error:', emailError);
          // Throw an error to ensure the webhook fails if the email can't be sent.
          // This allows Stripe to retry, giving the user another chance to receive their key.
          throw new Error('Failed to send license key email.');
      }
      
      console.log(`Licenčný kľúč úspešne odoslaný na ${customerEmail}`);
      
      // 4. Úspešná odpoveď
      res.status(200).json({ received: true, message: 'License issued successfully.' });

    } catch (error) {
      console.error('Failed to process checkout session:', error);
      return res.status(500).json({ error: 'Internal server error while issuing license.' });
    }
  } else {
    console.warn(`Unhandled event type: ${event.type}`);
    res.status(200).json({ received: true, message: `Unhandled event type: ${event.type}` });
  }
}