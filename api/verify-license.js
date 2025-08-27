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

    // Telo požiadavky (email + code)
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

    // Pošli do Make, NEupratuj veľké/malé písmená – porovnávate presne
    const fwResp = await fetch(HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const fwText = await fwResp.text();
    const parsed = safeJsonParse(fwText);

    if (parsed.ok && typeof parsed.data === 'object') {
      // Prepošli JSON z Make
      res.setHeader('Content-Type', 'application/json');
      return res.status(fwResp.status || 200).send(JSON.stringify(parsed.data));
    }

    // Non-JSON odpoveď z Make → daj peknú hlášku namiesto "NON_JSON_UPSTREAM"
    // Ak Make vrátil 2xx bez JSON, sprav priateľský fallback:
    if (fwResp.ok) {
      return res.status(200).json({
        success: true,
        status: 'ok',
        message: 'Your license has been verified.'
      });
    }

    // Chybový non-JSON (4xx/5xx) → priateľský fallback
    console.warn('[verify-license] upstream non-JSON:', fwResp.status, fwText?.slice?.(0, 200));
    return res.status(fwResp.status || 502).json({
      success: false,
      status: 'error',
      message: 'We could not verify your license right now. Please try again or contact support@customradio.sk.'
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