import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fix: Changed from CommonJS export to ES module default export to resolve TypeScript error.
export default (req: VercelRequest, res: VercelResponse) => {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const key = process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API;
    if (!key) {
      return res.status(500).json({
        success: false,
        message: 'Missing API key (set API_KEY in Vercel → Settings → Environment Variables and redeploy).',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API key loaded.',
      keyPreview: String(key).slice(0, 6) + '…',
    });
  } catch (e: any) {
    console.error('[test-api-key] error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
};
