// api/verify-license.js  (Vercel Serverless Function - CommonJS)

function safeJsonParse(text) {
  try { return { ok: true, data: JSON.parse(text) }; }
  catch (e) { return { ok: false, error: e?.message || 'Invalid JSON' }; }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const HOOK =
      process.env.MAKE_WEBHOOK_URL_VERIFY ||
      process.env.MAKE_WEBHOOK_URL ||
      '';

    if (!HOOK) {
      console.error('[verify-license] missing MAKE_WEBHOOK_URL(_VERIFY)');
      return res.status(503).json({
        success: false,
        message: 'Server is not configured correctly. Please try again later.'
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      const p = safeJsonParse(body);
      if (!p.ok) return res.status(400).json({ success: false, message: 'Invalid JSON' });
      body = p.data;
    } else if (!body || typeof body !== 'object') {
      const raw = (req.rawBody && req.rawBody.toString) ? req.rawBody.toString() : '';
      const p = safeJsonParse(raw);
      if (!p.ok) return res.status(400).json({ success: false, message: 'Invalid JSON' });
      body = p.data;
    }

    const email = String(body.email || '').trim();
    const code  = String(body.code  || body.key || '').trim();

    if (!email || !email.includes('@') || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and license key are required.'
      });
    }

    const fwResp = await fetch(HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const fwText = await fwResp.text();
    const parsed = safeJsonParse(fwText);

    if (parsed.ok && typeof parsed.data === 'object') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(fwResp.status || 200).send(JSON.stringify(parsed.data));
    }

    console.warn('[verify-license] Upstream service returned non-JSON response.', {
      status: fwResp.status,
      body: fwText.slice(0, 500),
    });

    if (fwResp.ok) {
      return res.status(502).json({
        success: false,
        status: 'error',
        message: 'Received an invalid response from the license server. Please contact support.',
      });
    }
    
    return res.status(fwResp.status || 502).json({
      success: false,
      status: 'error',
      message: 'The license server is currently unavailable. Please try again later or contact support.'
    });

  } catch (err) {
    console.error('[verify-license] exception:', err?.message);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Unexpected server error. Please try again later.'
    });
  }
};