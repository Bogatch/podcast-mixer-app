// api/verify-license.js  (Vercel Serverless Function - CommonJS)

function safeJsonParse(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Invalid JSON' };
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
    if (!MAKE_WEBHOOK_URL) {
      return res
        .status(503)
        .json({ ok: false, error: 'Server not configured (MAKE_WEBHOOK_URL missing).' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    // Bezpečné parsovanie tela (req.body môže byť objekt alebo string)
    let body = req.body;
    if (typeof body === 'string') {
      const parsed = safeJsonParse(body);
      if (!parsed.ok) return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
      body = parsed.data;
    } else if (!body || typeof body !== 'object') {
      const raw = (req && req.rawBody && req.rawBody.toString) ? req.rawBody.toString() : '';
      if (!raw) return res.status(400).json({ ok: false, error: 'EMPTY_BODY' });
      const parsed = safeJsonParse(raw);
      if (!parsed.ok) return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
      body = parsed.data;
    }

    // Očakávame email + code (ak príde "key", mapneme ho na code)
    const email = String(body.email || '').trim();
    const codeInput = String(body.code || body.key || '').trim();
    if (!email || !email.includes('@') || !codeInput) {
      return res.status(400).json({ ok: false, error: 'EMAIL_AND_CODE_REQUIRED' });
    }

    // Normalizácia – rovnaká ako v Make
    const emailNorm = email.toLowerCase();
    const codeNorm = codeInput.replace(/[^A-Za-z0-9-]/g, '');

    // Server-to-server POST na Make webhook (Vercel Node 18 má global fetch)
    const fwResp = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailNorm, code: codeNorm }),
    });

    const fwText = await fwResp.text();
    const parsed = safeJsonParse(fwText);

    if (parsed.ok) {
      // Prepošli status aj JSON z Make
      res.setHeader('Content-Type', 'application/json');
      return res.status(fwResp.status || 200).send(JSON.stringify(parsed.data));
    } else {
      // Make vrátil ne-JSON; zabalíme do JSON
      return res
        .status(fwResp.status || 502)
        .json({ ok: false, error: 'NON_JSON_UPSTREAM', raw: fwText });
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: err && err.message ? err.message : 'Unexpected server error',
    });
  }
};