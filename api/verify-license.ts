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
        // The body can be a pre-parsed object or a string depending on the Vercel environment.
        // This makes the parsing robust.
        if (typeof req.body === 'string' && req.body.length > 0) {
            try {
                body = JSON.parse(req.body);
            } catch (e) {
                console.warn('Failed to parse request body as JSON:', req.body);
                return res.status(400).json({ success: false, error: 'Invalid JSON in request body.' });
            }
        } else if (typeof req.body === 'object' && req.body !== null) {
            body = req.body;
        } else {
            return res.status(400).json({ success: false, error: 'Request body is missing, empty, or not an object.' });
        }

        const { email, key } = body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }
        
        console.log(`Forwarding verification request for email: ${email} to Make.com`);

        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, license_key: key }),
        });

        const responseText = await webhookResponse.text();
        console.log(`Received response from Make.com. Status: ${webhookResponse.status}, Body: "${responseText}"`);

        if (!webhookResponse.ok) {
            console.error(`Make.com webhook returned an error status: ${webhookResponse.status}`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

        let isValid = false;
        const trimmedResponse = responseText.trim().toLowerCase();
        
        if (trimmedResponse === 'accepted') {
            isValid = true;
        } else {
            try {
                const data = JSON.parse(responseText);
                if (data && data.valid === true) {
                    isValid = true;
                }
            } catch (e) {
                console.warn('Make.com response was not "Accepted" and not valid JSON. Assuming invalid.');
            }
        }
        
        if (isValid) {
            console.log(`License validation successful for email: ${email}`);
            return res.status(200).json({ success: true });
        } else {
            console.log(`License validation failed for email: ${email}`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        console.error('CRITICAL ERROR in /api/verify-license handler:', {
            message: error.message,
            stack: error.stack,
            body: req.body 
        });
        return res.status(500).json({ success: false, error: 'A server error occurred during license verification.' });
    }
}
