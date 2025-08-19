// THIS ENDPOINT IS DEPRECATED.
// The application now uses a hardcoded Stripe Payment Link, which is configured
// in `context/AuthContext.tsx`. This API route for creating a dynamic
// checkout session is no longer used and can be removed.

export default function handler(req: any, res: any) {
  res.setHeader('Allow', '');
  return res.status(410).json({ 
    error: { 
      code: 'endpoint_deprecated',
      message: 'This API endpoint is no longer in use. The application uses a hardcoded Stripe Payment Link.' 
    }
  });
}

export {};