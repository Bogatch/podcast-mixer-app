import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/fbbcsb128zgndyyvmt98s3dq178402up';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS and content type
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        
        // Validate body and its contents
        if (!body || typeof body !== 'object') {
            console.warn('Invalid or empty request body received.');
            return res.status(400).json({ success: false, error: 'Invalid request: Expected a JSON object body.' });
        }

        const { email, key } = body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            console.warn('Missing or invalid email/key in request body:', body);
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }
        
        console.log(`Forwarding verification for email: ${email.substring(0, 3)}... to Make.com webhook.`);

        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, license_key: key }),
            signal: AbortSignal.timeout(15000) // 15-second timeout
        });

        const responseText = await webhookResponse.text();
        console.log(`Received response from Make.com: Status=${webhookResponse.status}, Body="${responseText}"`);
        
        if (webhookResponse.ok && responseText.trim().toLowerCase() === 'accepted') {
            console.log(`License validation successful for ${email.substring(0, 3)}...`);
            return res.status(200).json({ success: true });
        } else {
            console.warn(`License validation failed for ${email.substring(0, 3)}... Make.com response was not 'Accepted'.`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        console.error('CRITICAL ERROR in /api/verify-license handler:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
        });

        // Ensure even critical errors send back a valid JSON response.
        // This will prevent the client-side JSON parsing error.
        if (error.name === 'AbortError') {
             return res.status(504).json({ success: false, error: 'The license server did not respond in time. Please try again later.' });
        }
        
        return res.status(500).json({ success: false, error: 'A server error occurred during license verification.' });
    }
}
