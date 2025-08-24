import type { VercelRequest, VercelResponse } from '@vercel/node';

export const runtime = 'nodejs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Wrap the entire logic in a try-catch to prevent unhandled crashes
    try {
        console.log('--- /api/verify-license function started ---');

        const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

        if (!MAKE_WEBHOOK_URL) {
            console.error('CRITICAL: MAKE_WEBHOOK_URL environment variable is not set on the server.');
            return res.status(503).json({ success: false, error: 'Server is not configured correctly. Missing webhook URL.' });
        }
        console.log('Server configuration: Webhook URL is present.');

        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }
        console.log('Request method is POST.');

        if (!req.body) {
            console.error('CRITICAL: Request body is missing or could not be parsed. Ensure Content-Type is application/json.');
            return res.status(400).json({ success: false, error: 'Invalid request: body is missing.' });
        }

        const { email, key } = req.body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            console.warn('Invalid request body received:', req.body);
            return res.status(400).json({ success: false, error: 'Email and license key are required.' });
        }
        console.log(`Received verification request for email starting with: ${email.substring(0, 3)}...`);

        console.log('Forwarding request to Make.com...');
        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), key: key.trim() }),
        });

        console.log(`Received response from Make.com with status: ${webhookResponse.status}`);

        if (webhookResponse.ok) {
            console.log('License verification successful.');
            return res.status(200).json({ success: true });
        } else {
            const errorText = await webhookResponse.text();
            console.warn(`License verification failed. Make.com response: "${errorText}"`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        console.error('--- UNCAUGHT EXCEPTION in /api/verify-license ---');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
    }
}