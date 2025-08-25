// api/verify-license.js — Vercel Serverless (CommonJS)

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
    const HOOK =
      process.env.MAKE_WEBHOOK_URL_VERIFY ||
      process.env.MAKE_WEBHOOK_URL;

    if (!HOOK) {
      console.error('[verify-license] MISSING ENV: MAKE_WEBHOOK_URL_VERIFY or MAKE_WEBHOOK_URL');
      return res.status(503).json({
        success: false,
        message: 'Server is not configured (missing webhook URL).',
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({
        success: false,
        message: 'Method Not Allowed',
      });
    }

    // bezpečné načítanie tela
    let body = req.body;
    if (typeof body === 'string') {
      const parsed = safeJsonParse(body);
      if (!parsed.ok) return res.status(400).json({ success: false, message: 'INVALID_JSON' });
      body = parsed.data;
    } else if (!body || typeof body !== 'object') {
      const raw =
        req && req.rawBody && typeof req.rawBody.toString === 'function'
          ? req.rawBody.toString()
          : '';
      if (!raw) return res.status(400).json({ success: false, message: 'EMPTY_BODY' });
      const parsed = safeJsonParse(raw);
      if (!parsed.ok) return res.status(400).json({ success: false, message: 'INVALID_JSON' });
      body = parsed.data;
    }

    const email = (body.email ?? '').toString().trim();
    const rawCode = body.code != null ? body.code.toString().trim() : '';

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required.',
      });
    }

    const isRecover = rawCode.length === 0;
    const payload = isRecover
      ? { email, action: 'recover' }
      : { email, code: rawCode, action: 'verify' };

    console.log('[verify-license] using webhook:', HOOK);
    console.log('[verify-license] outgoing payload:', payload);

    const fwResp = await fetch(HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const fwText = await fwResp.text();
    const parsed = safeJsonParse(fwText);

    console.log('[verify-license] upstream status:', fwResp.status);
    if (parsed.ok) {
      console.log('[verify-license] upstream JSON:', parsed.data);
    } else {
      console.log('[verify-license] upstream NON-JSON:', fwText.slice(0, 300));
    }

    // JSON odpoveď
    if (parsed.ok) {
      const upstream = parsed.data || {};
      const success = upstream.success === true || upstream.status === 'success';
      const message =
        upstream.message ||
        (isRecover
          ? 'If this email is registered, we have sent you the license key.'
          : 'License verified. PRO unlocked.');

      if (fwResp.ok && success) {
        return res.status(200).json({
          success: true,
          message,
        });
      } else {
        const status = fwResp.ok ? 401 : fwResp.status;
        return res.status(status || 401).json({
          success: false,
          message:
            upstream.message ||
            (isRecover
              ? 'We could not send the key to this email.'
              : 'Invalid email or license key.'),
        });
      }
    }

    // ne-JSON odpoveď
    return res.status(fwResp.status || 502).json({
      success: false,
      message: isRecover
        ? 'The request was accepted, but we could not confirm email delivery yet.'
        : 'The verification endpoint did not return a JSON response.',
      upstream: 'NON_JSON_UPSTREAM',
    });
  } catch (err) {
    console.error('[verify-license] exception:', err && err.message ? err.message : err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  }
};