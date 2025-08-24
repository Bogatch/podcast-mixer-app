// pages/api/verify-license.ts (Next.js Pages Router) alebo api/verify-license.ts (Vercel Functions)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const runtime = 'nodejs';

function safeJsonParse<T = any>(text: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid JSON' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // --- Parse incoming JSON body safely ---
    let body: any = req.body;
    if (typeof body === 'string') {
      const parsed = safeJsonParse(body);
      if (!parsed.ok) return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
      body = parsed.data;
    } else if (!body || typeof body !== 'object') {
      // Niektoré prostredia nemajú auto-parse
      const raw = (req as any).rawBody?.toString?.() ?? '';
      if (!raw) return res.status(400).json({ ok: false, error: 'EMPTY_BODY' });
      const parsed = safeJsonParse(raw);
      if (!parsed.ok) return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
      body = parsed.data;
    }

    // Očakávané polia: email + code (nie "key")
    const email = String(body?.email ?? '').trim();
    const code = String(body?.code ?? body?.key ?? '').trim(); // ak klient poslal "key", akceptujeme a mapneme na code

    if (!email || !email.includes('@') || !code) {
      return res.status(400).json({ ok: false, error: 'EMAIL_AND_CODE_REQUIRED' });
    }

    // Normalizácia (rovnaká ako v Make)
    const emailNorm = email.toLowerCase();
    const codeNorm = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // --- Forward do Make (server-to-server) ---
    const fwResp = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Pošli presne to, čo scenár v Make očakáva:
      body: JSON.stringify({ email: emailNorm, code: codeNorm }),
    });

    const fwText = await fwResp.text();
    const parsed = safeJsonParse(fwText);

    // Vždy vráť JSON klientovi (aj pri chybách)
    if (parsed.ok) {
      // Prepošli status z Make (200/401/409/…)
      return res
        .status(fwResp.status || 200)
        .setHeader('Content-Type', 'application/json')
        .json(parsed.data);
    } else {
      // Make vrátil ne-JSON; zabalíme do nášho JSON
      return res
        .status(fwResp.status || 502)
        .json({ ok: false, error: 'NON_JSON_UPSTREAM', raw: fwText });
    }
  } catch (err: any) {
    // Nikdy nevracaj plain text – vždy JSON
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: err?.message || 'Unexpected server error',
    });
  }
}
