// api/verify-license.js  (Vercel Serverless Function - CommonJS, case-sensitive code)

function safeJsonParse(text) {
  try {
    return { ok: true, data: JSON.parse(String(text).trimStart()) };
  } catch (e) {
    return { ok: false, error: e?.message || 'Invalid JSON' };
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
    if (!MAKE_WEBHOOK_URL) {
      return res.status(503).json({ ok: false, error: 'MISSING_MAKE_WEBHOOK_URL' });
    }

    // Bezpečné načítanie tela (môže byť objekt alebo string)
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

    // Vstupy (email case-insensitive, KÓD case-sensitive)
    const email = String(body.email || '').trim();
    const codeInput = String(body.code ?? body.key ?? '').trim(); // ak príde key, akceptujeme tiež

    if (!email || !email.includes('@') || !codeInput) {
      return res.status(400).json({ ok: false, error: 'EMAIL_AND_CODE_REQUIRED' });
    }

    const emailNorm = email.toLowerCase();                            // email porovnávaj bez ohľadu na case
    const codeExact = codeInput.replace(/[^A-Za-z0-9-]/g, '');        // kód ostáva case-sensitive (bez nežiaducich znakov)

    // POST do Make – pošli oba názvy polí, aby sa scenár nechytal na názvový nesúlad
    const payload = { email: emailNorm, code: codeExact, key: codeExact };

    const fwResp = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    const fwText = await fwResp.text();
    // Skús JSON ak 1) hlavička hovorí JSON alebo 2) telo vyzerá ako JSON
    const ct = fwResp.headers.get('content-type') || '';
    const looksJson = ct.includes('application/json') || /^[\s]*[{[]/.test(fwText);
    if (looksJson) {
      const parsed = safeJsonParse(fwText);
      if (parsed.ok) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(fwResp.status || 200).send(JSON.stringify(parsed.data));
      }
      // padlo parsovanie napriek tomu, že to vyzerá na JSON
      return res.status(fwResp.status || 502).json({ ok: false, error: 'INVALID_UPSTREAM_JSON', raw: fwText });
    }

    // Upstream neposlal JSON (typicky "Accepted" z webhooku bez Webhook response)
    return res.status(fwResp.status || 502).json({ ok: false, error: 'NON_JSON_UPSTREAM', raw: fwText });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: err && err.message ? err.message : 'Unexpected server error',
    });
  }
};