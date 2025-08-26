// api/verify-license.js  (CommonJS)

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
    return res.status(405).json({ success: false, ok: false, errorCode: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const URL =
      process.env.MAKE_WEBHOOK_URL_VERIFY ||
      process.env.MAKE_WEBHOOK_URL;

    if (!URL) {
      return res.status(503).json({
        success: false,
        ok: false,
        errorCode: 'MISSING_WEBHOOK_URL',
        message: 'Server not configured (MAKE_WEBHOOK_URL_VERIFY / MAKE_WEBHOOK_URL).'
      });
    }

    // Bezpečne načítaj telo
    let body = req.body;
    if (typeof body === 'string') {
      const p = safeJsonParse(body);
      if (!p.ok) return res.status(400).json({ success: false, ok: false, errorCode: 'INVALID_JSON' });
      body = p.data;
    } else if (!body || typeof body !== 'object') {
      const raw = req.rawBody?.toString?.() || '';
      if (!raw) return res.status(400).json({ success: false, ok: false, errorCode: 'EMPTY_BODY' });
      const p = safeJsonParse(raw);
      if (!p.ok) return res.status(400).json({ success: false, ok: false, errorCode: 'INVALID_JSON' });
      body = p.data;
    }

    // Zachovaj case-sensitivity kódu (žiadne uppercasing!).
    const email = String(body.email || '').trim();
    const code  = String(body.code  || body.key || '').trim();

    if (!email || !email.includes('@') || !code) {
      return res.status(400).json({
        success: false, ok: false, errorCode: 'EMAIL_AND_CODE_REQUIRED',
        message: 'Email and license code are required.'
      });
    }

    // Server-to-server volanie na Make
    const fwResp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const text = await fwResp.text();
    const maybeJson = safeJsonParse(text);

    // 2xx = úspech (aj keď telo nie je JSON)
    if (fwResp.ok) {
      if (maybeJson.ok) {
        // Ak Make poslal JSON, prepošli ho – ale normalizuj kľúče
        const d = maybeJson.data;
        const success = d.success === true || d.status === 'success';
        return res.status(200).json({
          success: success ?? true,
          ok: true,
          message: d.message || 'License verified.'
        });
      } else {
        // Nie je JSON – ale 2xx => ber ako success
        return res.status(200).json({
          success: true,
          ok: true,
          message: 'License verified.',
          upstream: 'NON_JSON_2XX'
        });
      }
    }

    // 4xx/5xx – skús vytiahnuť detail z JSONu, inak generická správa
    if (maybeJson.ok) {
      const d = maybeJson.data;
      return res.status(fwResp.status).json({
        success: false,
        ok: false,
        errorCode: d.errorCode || 'UPSTREAM_ERROR',
        message: d.message || 'Verification failed.'
      });
    } else {
      return res.status(fwResp.status).json({
        success: false,
        ok: false,
        errorCode: 'NON_JSON_UPSTREAM',
        message: 'Upstream did not return JSON.',
        raw: text?.slice(0, 200)
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      ok: false,
      errorCode: 'INTERNAL_ERROR',
      message: err?.message || 'Unexpected server error'
    });
  }
};