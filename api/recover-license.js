// api/recover-license.js  (Vercel Serverless Function - CommonJS)

function safeParse(text) {
  try { return { ok: true, data: JSON.parse(text) }; }
  catch (e) { return { ok: false, err: e?.message || 'Invalid JSON' }; }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const url = process.env.MAKE_WEBHOOK_URL_RECOVER;
    if (!url) {
      return res.status(503).json({ success: false, message: 'Server not configured (MAKE_WEBHOOK_URL_RECOVER missing).' });
    }

    // Telo môže byť objekt alebo string:
    let body = req.body;
    if (typeof body === 'string') {
      const p = safeParse(body);
      if (!p.ok) return res.status(400).json({ success: false, message: 'INVALID_JSON' });
      body = p.data;
    } else if (!body || typeof body !== 'object') {
      const raw = (req.rawBody?.toString?.()) || '';
      if (!raw) return res.status(400).json({ success: false, message: 'EMPTY_BODY' });
      const p = safeParse(raw);
      if (!p.ok) return res.status(400).json({ success: false, message: 'INVALID_JSON' });
      body = p.data;
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }

    // Forward na Make (server-to-server)
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Ak chceš nedávať kód do odpovede, Make ho len odošle emailom;
      // tu netreba nič meniť.
      body: JSON.stringify({ email })
    });

    const text = await upstream.text();
    const parsed = safeParse(text);

    if (parsed.ok) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(upstream.status || 200).send(JSON.stringify(parsed.data));
    } else {
      return res.status(upstream.status || 502).json({
        success: false,
        message: 'NON_JSON_UPSTREAM',
        raw: text
      });
    }
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e?.message || 'Unexpected server error'
    });
  }
};