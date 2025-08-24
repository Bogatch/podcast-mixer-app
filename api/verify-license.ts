import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS and content type early
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Server configuration check
    if (!MAKE_WEBHOOK_URL) {
        console.error('CRITICAL: MAKE_WEBHOOK_URL environment variable is not set.');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    try {
        const { email, key } = req.body;

        // Input validation
        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }

        console.log(`Verifying license for email: ${email.substring(0, 3)}... via Make.com webhook.`);

        // Abort fetch after 8 seconds to avoid Vercel timeout (10s on Hobby)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Forward the request to the Make.com webhook
        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email.trim(), key: key.trim() }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // A successful HTTP status code (2xx) from the webhook is treated as a valid license.
        if (webhookResponse.ok) {
            console.log(`Webhook validation successful for ${email.substring(0, 3)}... Status: ${webhookResponse.status}`);
            return res.status(200).json({ success: true });
        } else {
            // Any non-2xx response is treated as a failure.
            const errorBody = await webhookResponse.text(); // Log the body for debugging
            console.warn(`Webhook validation failed for ${email.substring(0, 3)}... Status: ${webhookResponse.status}, Body: "${errorBody}"`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        // Handle timeout specifically
        if (error.name === 'AbortError') {
            console.error('Webhook request timed out.');
            return res.status(504).json({ success: false, error: 'The license server did not respond in time.' });
        }

        // Handle other network errors or exceptions during the fetch call
        console.error('CRITICAL ERROR calling Make.com webhook in /api/verify-license:', {
            message: error.message,
            name: error.name,
        });
        
        return res.status(500).json({ success: false, error: 'A server error occurred during license verification.' });
    }
}
