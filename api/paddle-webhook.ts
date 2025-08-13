
// NOTE: This webhook endpoint is deprecated and should not be used.
// Please configure your Stripe webhooks to point to /api/stripe-webhook instead.

export default function handler(req: any, res: any) {
  res.setHeader('Allow', '');
  return res.status(410).json({ 
    error: { 
      code: 'endpoint_deprecated',
      message: 'This webhook endpoint (/api/paddle-webhook) is deprecated and no longer in use. Please update your Stripe settings to use the /api/stripe-webhook endpoint.' 
    }
  });
}

export {};