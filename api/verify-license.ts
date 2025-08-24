import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/fbbcsb128zgndyyvmt98s3dq178402up';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS
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

    try {
        let body;
        // Vercel might have already parsed the body, or it might be a string.
        if (typeof req.body === 'string' && req.body) {
            try {
                body = JSON.parse(req.body);
            } catch (e) {
                console.warn('Failed to parse request body as JSON:', req.body);
                return res.status(400).json({ success: false, error: 'Invalid request format: malformed JSON.' });
            }
        } else if (typeof req.body === 'object' && req.body) {
            body = req.body;
        } else {
            console.warn('Received empty or invalid request body:', req.body);
            return res.status(400).json({ success: false, error: 'Request body is missing or invalid.' });
        }

        const { email, key } = body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            console.warn('Missing email or key in request body:', body);
            return res.status(400).json({ success: false, error: 'Email and license key are required.' });
        }
        
        console.log(`Forwarding verification for ${email} to Make.com webhook.`);

        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, license_key: key }),
        });

        // It's crucial to read the text of the response to understand what Make.com is sending back.
        const responseText = await webhookResponse.text();
        console.log(`Received response from Make.com: Status=${webhookResponse.status}, Body="${responseText}"`);
        
        // Make.com webhook is configured to return "Accepted" as plain text on success.
        if (webhookResponse.ok && responseText.trim().toLowerCase() === 'accepted') {
            console.log(`License validation successful for ${email}.`);
            return res.status(200).json({ success: true });
        } else {
            // Log the failure but return a generic error to the user for security.
            console.warn(`License validation failed for ${email}. Make.com response was not 'Accepted'.`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        console.error('CRITICAL ERROR in /api/verify-license handler:', {
            message: error.message,
            stack: error.stack,
            body: req.body // Log the original body for debugging
        });
        // Ensure even critical errors send back a valid JSON response.
        return res.status(500).json({ success: false, error: 'A server error occurred during license verification.' });
    }
}
