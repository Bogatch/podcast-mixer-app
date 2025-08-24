import type { VercelRequest, VercelResponse } from '@vercel/node';

// This endpoint relies on an external webhook for license verification.
// The URL for this webhook must be configured as an environment variable.
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS and content type early
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Always ensure JSON content type for responses from this point
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).send(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    }

    // Server configuration check
    if (!MAKE_WEBHOOK_URL) {
        console.error('CRITICAL: MAKE_WEBHOOK_URL environment variable is not set.');
        return res.status(500).send(JSON.stringify({ success: false, error: 'Server configuration error.' }));
    }

    try {
        const { email, key } = req.body;

        // Input validation
        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).send(JSON.stringify({ success: false, error: 'Email and license key are required and must be strings.' }));
        }

        console.log(`Verifying license for email: ${email.substring(0, 3)}... via Make.com webhook.`);

        // Forward the request to the Make.com webhook
        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email.trim(), key: key.trim() })
        });
        
        // A successful HTTP status code (2xx) from the webhook is treated as a valid license.
        if (webhookResponse.ok) {
            console.log(`Webhook validation successful for ${email.substring(0, 3)}... Status: ${webhookResponse.status}`);
            return res.status(200).send(JSON.stringify({ success: true }));
        } else {
            // Any non-2xx response is treated as a failure.
            const errorBody = await webhookResponse.text(); // Log the body for debugging
            console.warn(`Webhook validation failed for ${email.substring(0, 3)}... Status: ${webhookResponse.status}, Body: "${errorBody}"`);
            return res.status(401).send(JSON.stringify({ success: false, error: 'Invalid license key or email.' }));
        }

    } catch (error: any) {
        // Handle network errors or other exceptions during the fetch call
        console.error('CRITICAL ERROR calling Make.com webhook in /api/verify-license:', {
            message: error.message,
            name: error.name,
        });
        
        return res.status(500).send(JSON.stringify({ success: false, error: 'A server error occurred during license verification.' }));
    }
}
