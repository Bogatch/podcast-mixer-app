/// <reference types="node" />

// NOTE: This webhook endpoint is deprecated and should not be used.
// Please configure your Stripe webhooks to point to /api/stripe-webhook instead.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Allow', '');
  return res.status(410).json({ 
    error: { 
      code: 'endpoint_deprecated',
      message: 'This webhook endpoint (/api/paddle-webhook) is deprecated and no longer in use. Please update your Stripe settings to use the /api/stripe-webhook endpoint.' 
    }
  });
}