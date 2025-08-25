// api/verify-license.js

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
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });

  try {
    const MAKE_URL = process.env.MAKE_WEBHOOK_URL_VERIFY; // ✅ LEN VERIFY hook
    console.log('[verify-license] using webhook:', MAKE_URL);

    if (!MAKE_URL) {
      return res.status(503).json({ success: false, error: 'MISSING_MAKE_WEBHOOK_URL_VERIFY' });
    }

    // Bezpečné telo
    let body = req.body;
    if (typeof body === 'string') {
      const parsed = safeJsonParse(body);
      if (!parsed.ok) return res.status(400).json({ success: false, error: 'INVALID_JSON' });
      body = parsed.data;
    }
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ success: false, error: 'EMPTY_BODY' });
    }

    const email = String(body.email || '').trim();
    const code  = String(body.code  || body.key || '').trim(); // backward-compat pre staré klienty

    if (!email || !email.includes('@') || !code) {
      return res.status(400).json({ success: false, error: 'EMAIL_AND_CODE_REQUIRED' });
    }

    console.log('[verify-license] payload -> make:', {
      email: email.replace(/(.{2}).+(@.*)/,'$1***$2'),
      code
    });

    // Forward do Make
    const fwResp = await fetch(MAKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }) // ✅ presne tieto polia
    });

    const fwText = await fwResp.text();
    const parsed = safeJsonParse(fwText);
    console.log('[verify-license] make status:', fwResp.status, 'json:', parsed.ok);

    if (parsed.ok) {
      // ✅ Prepošli presný status + JSON z Make (žiadne pretypovanie na "false"/"true" string)
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(fwResp.status).send(JSON.stringify(parsed.data));
    } else {
      // Make vrátil non-JSON
      return res.status(fwResp.status || 502).json({
        success: false,
        error: 'NON_JSON_UPSTREAM',
        raw: fwText
      });
    }
  } catch (err) {
    console.error('[verify-license] exception:', err?.message);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err?.message || 'Unexpected error' });
  }
};