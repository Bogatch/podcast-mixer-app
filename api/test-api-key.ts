import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.API_KEY;

  if (!key) {
    return res.status(500).json({
      success: false,
      message: "❌ API_KEY is MISSING in environment variables."
    });
  }

  return res.status(200).json({
    success: true,
    message: "✅ API_KEY is loaded correctly.",
    keyPreview: key.substring(0, 6) + "...(hidden)" // ukáže len prvých 6 znakov
  });
}
