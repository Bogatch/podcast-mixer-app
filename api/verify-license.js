// api/verify-license.js  (iba doplnené errorCode + jednotný tvar odpovedí)

function safeJsonParse(text) {
  try { return { ok: true, data: JSON.parse(text) }; }
  catch (e) { return { ok: false, error: e?.message || 'Invalid JSON' }; }
}

function normalizeUpstreamError(msg = '') {
  const m = String(msg).toLowerCase();

  if (m.includes('not found') || m.includes('no match') || m.includes('not registered')) {
    return { errorCode: 'KEY_NOT_FOUND', message: 'The key was not found or is not registered with the provided email.' };
  }
  if (m.includes('rate') && m.includes('limit')) {
    return { errorCode: 'RATE_LIMITED', message: 'Rate limited by upstream.' };
  }
  return { errorCode: 'UPSTREAM_ERROR', message: 'Upstream returned an error.' };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const WEBHOOK = process.env.MAKE_WEBHOOK_URL_VERIFY || process.env.MAKE_WEBHOOK_URL;
    if (!WEBHOOK) return res.status(503).json({ ok: false, errorCode: 'SERVER_MISCONFIGURED', message: 'Missing webhook URL.' });

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, errorCode: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
    }

    // tolerantné čítanie body
    let body = req.body;
    if (typeof body === 'string') {
      const p = safeJsonParse(body);
      if (!p.ok) return res.status(400).json({ ok: false, errorCode: 'INVALID_JSON', message: 'Invalid JSON body.' });
      body = p.data;
    }
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ ok: false, errorCode: 'INVALID_JSON', message: 'Invalid JSON body.' });
    }

    const email = String(body.email || '').trim();
    const code  = String(body.code  || body.key || '').trim();
    if (!email || !email.includes('@') || !code) {
      return res.status(400).json({ ok: false, errorCode: 'EMAIL_AND_CODE_REQUIRED', message: 'Email and license key are required.' });
    }

    const fw = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }), // pozor: zachovávame presný tvar (case-sensitive)
    });

    const text = await fw.text();
    const parsed = safeJsonParse(text);

    // Upstream poslal JSON
    if (parsed.ok) {
      const data = parsed.data;
      // konsolidácia: očakávame success:true/false
      if (data?.success === true || data?.status === 'success') {
        return res.status(200).json({ ok: true, success: true, message: data?.message || 'Verified.' });
      }
      // upstream error – doplň kód
      const norm = normalizeUpstreamError(data?.message || data?.error || '');
      return res.status(400).json({ ok: false, success: false, errorCode: norm.errorCode, message: norm.message });
    }

    // Upstream ne-JSON
    return res.status(fw.status || 502).json({
      ok: false, success: false,
      errorCode: 'NON_JSON_UPSTREAM',
      message: 'Upstream did not return JSON.'
    });

  } catch (err) {
    return res.status(500).json({
      ok: false, success: false,
      errorCode: 'INTERNAL_ERROR',
      message: err?.message || 'Unexpected server error'
    });
  }
};