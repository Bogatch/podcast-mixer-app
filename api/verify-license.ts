import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is a placeholder. You must set this environment variable in your Vercel project settings.
// It should point to your Make.com (formerly Integromat) webhook URL for license verification.
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Ensure the request method is POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Check if the server is configured correctly
    if (!MAKE_WEBHOOK_URL) {
        console.error('CRITICAL: MAKE_WEBHOOK_URL environment variable is not set.');
        // Return a structured JSON error
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    try {
        const { email, key } = req.body;

        // Validate input from the client
        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required.' });
        }

        console.log(`Forwarding license verification for ${email.substring(0, 3)}... to Make.com webhook.`);

        // Abort the fetch request after 8 seconds to prevent Vercel's 10-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Forward the request to the Make.com webhook
        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email.trim(), key: key.trim() }),
            signal: controller.signal // Link the AbortController to the fetch request
        });

        clearTimeout(timeoutId); // Clear the timeout if the request completes in time

        // A successful 2xx status code from the webhook is considered a valid license
        if (webhookResponse.ok) {
            console.log(`Webhook call successful for ${email.substring(0, 3)}... Status: ${webhookResponse.status}`);
            return res.status(200).json({ success: true });
        } else {
            // Any non-2xx response is treated as an invalid license
            const errorText = await webhookResponse.text();
            console.warn(`Webhook call failed for ${email.substring(0, 3)}... Status: ${webhookResponse.status}, Response: "${errorText}"`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        // Handle specific timeout error
        if (error.name === 'AbortError') {
            console.error('Webhook request timed out.');
            return res.status(504).json({ success: false, error: 'The license server did not respond in time.' });
        }

        // Handle any other unexpected errors during the process
        console.error('CRITICAL ERROR in /api/verify-license:', error);
        return res.status(500).json({ success: false, error: 'A server error occurred during license verification.' });
    }
}