// api/create-checkout.ts
import Stripe from "stripe";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
    }

    const { email } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "INVALID_EMAIL" });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY!;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as Stripe.StripeConfig['apiVersion'] });

    const origin = req.headers.origin || "https://pms.customradio.sk";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Podcast Mixer PRO License" },
            unit_amount: 2990, // 29.90€
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_cancel=true`,
      metadata: { user_email: email },
    });

    if (!session.url) {
      return res.status(500).json({ ok: false, error: "NO_SESSION_URL" });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e: any) {
    console.error("create-checkout error:", e?.message);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}