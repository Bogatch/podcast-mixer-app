import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/fbbcsb128zgndyyvmt98s3dq178402up';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS, caching
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        let body;
        // Robustly parse the request body, as Vercel's automatic parsing can sometimes be inconsistent.
        if (Buffer.isBuffer(req.body)) {
            body = JSON.parse(req.body.toString());
        } else if (typeof req.body === 'string' && req.body) {
            body = JSON.parse(req.body);
        } else if (typeof req.body === 'object' && req.body !== null) {
            body = req.body;
        } else {
            return res.status(400).json({ success: false, error: 'Invalid or missing request body.' });
        }
        
        const { email, key } = body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }

        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, license_key: key }),
        });

        const responseText = await webhookResponse.text();

        if (!webhookResponse.ok) {
            // Webhook returned an error (e.g., 404, 500). Treat as invalid.
            return res.status(401).json({ success: false, error: 'Invalid email or license key provided.' });
        }

        // Webhook returned a success status (2xx). Now check the content for validity.
        let isValid = false;
        try {
            const data = JSON.parse(responseText);
            if (data && data.valid === true) {
                isValid = true;
            }
        } catch (e) {
            // Not JSON, check for plain text "Accepted"
            if (responseText.trim().toLowerCase() === 'accepted') {
                isValid = true;
            }
        }

        if (isValid) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid email or license key provided.' });
        }

    } catch (error: any) {
        console.error('Unhandled error in /api/verify-license:', {
            message: error.message,
            stack: error.stack,
        });
        return res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
    }
}
