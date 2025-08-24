// api/verify-license.js  (Vercel Serverless Function - CommonJS)

function safeJsonParse(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Invalid JSON' };
  }
}

function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).send(JSON.stringify(payload));
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
      return sendJson(res, 503, {
        ok: false,
        error: 'CONFIG_ERROR',
        message: 'Server not configured (MAKE_WEBHOOK_URL missing).',
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    // Bezpečné získanie tela (string/objekt)
    let body = req.body;
    if (typeof body === 'string') {
      const parsed = safeJsonParse(body);
      if (!parsed.ok) return sendJson(res, 400, { ok: false, error: 'INVALID_JSON' });
      body = parsed.data;
    } else if (!body || typeof body !== 'object') {
      const raw = (req && req.rawBody && req.rawBody.toString) ? req.rawBody.toString() : '';
      if (!raw) return sendJson(res, 400, { ok: false, error: 'EMPTY_BODY' });
      const parsed = safeJsonParse(raw);
      if (!parsed.ok) return sendJson(res, 400, { ok: false, error: 'INVALID_JSON' });
      body = parsed.data;
    }

    // Očakávame email + code (neprepisujeme case, verifikácia je case-sensitive)
    const email = String(body.email || '').trim();
    const code  = String(body.code  || body.key || '').trim();

    if (!email || !email.includes('@') || !code) {
      return sendJson(res, 400, { ok: false, error: 'EMAIL_AND_CODE_REQUIRED' });
    }

    // Server-to-server POST do Make
    const fwResp = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, code })
    });

    const text = await fwResp.text();
    const parsed = safeJsonParse(text);

    // Make vrátil JSON
    if (parsed.ok) {
      const d = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};

      // Zjednotenie: doplň pole `ok`, ak chýba
      const unified = Object.prototype.hasOwnProperty.call(d, 'ok')
        ? d
        : { ok: d.status === 'success', ...d };

      // Ak upstream poslal non-2xx (napr. 400), necháme aj my non-2xx,
      // ale stále vraciame JSON s `ok`.
      return sendJson(res, fwResp.status || 200, unified);
    }

    // Make vrátil non-JSON (napr. "Accepted")
    return sendJson(res, fwResp.status || 502, {
      ok: false,
      error: 'NON_JSON_UPSTREAM',
      raw: text
    });

  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      error: 'INTERNAL_ERROR',
      message: err && err.message ? err.message : 'Unexpected server error'
    });
  }
};
