import type { VercelRequest, VercelResponse } from '@vercel/node';

// Using CommonJS export to match user-provided snippet style
module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
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
        message: '❌ API key variable is missing. Expected API_KEY (or GOOGLE_API_KEY / GOOGLE_API).'
      });
    }

    return res.status(200).json({
      success: true,
      message: '✅ API key is loaded correctly.',
      keyPreview: String(key).slice(0, 6) + '…(hidden)'
    });
  } catch (e: any) {
    console.error('[test-api-key] error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
};
