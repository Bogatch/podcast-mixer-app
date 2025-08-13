// THIS ENDPOINT IS DEPRECATED.
// As per your request, the architecture has been changed to have Stripe
// call your Make.com webhook directly.
//
// Please perform the following action:
// 1. In your Stripe Dashboard, go to your webhook settings.
// 2. Change the webhook endpoint URL from '.../api/stripe-webhook'
//    to your Make.com webhook URL.
//
// This Vercel function is no longer needed for the payment flow.

export default function handler(req: any, res: any) {
  res.setHeader('Allow', '');
  return res.status(410).json({ 
    error: { 
      code: 'endpoint_deprecated',
      message: 'This webhook endpoint is no longer in use. Please configure your Stripe webhook to point directly to your Make.com URL.' 
    }
  });
}

export {};