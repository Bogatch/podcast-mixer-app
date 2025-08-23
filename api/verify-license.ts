import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/fbbcsb128zgndyyvmt98s3dq178402up';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers for CORS, caching
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }
        
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid request body. Expected JSON object.' });
        }
        
        const { email, key } = req.body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }
        
        console.log(`Verifying license for email: ${email}`);

        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, license_key: key }),
        });

        const responseText = await webhookResponse.text();
        console.log(`Make.com response status: ${webhookResponse.status}, body: "${responseText}"`);

        if (!webhookResponse.ok) {
            console.error('Webhook returned an error status:', webhookResponse.status);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

        // Make.com can return "Accepted" text or a JSON object.
        let isValid = false;
        if (responseText.trim().toLowerCase() === 'accepted') {
            isValid = true;
        } else {
            try {
                const data = JSON.parse(responseText);
                if (data && data.valid === true) {
                    isValid = true;
                }
            } catch (e) {
                // The response was not "Accepted" and not valid JSON.
                console.warn('Webhook response was not "Accepted" and not valid JSON.');
            }
        }
        
        if (isValid) {
            console.log(`License VALID for email: ${email}`);
            return res.status(200).json({ success: true });
        } else {
            console.log(`License INVALID for email: ${email}`);
            return res.status(401).json({ success: false, error: 'Invalid license key or email.' });
        }

    } catch (error: any) {
        console.error('Unhandled error in /api/verify-license:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        return res.status(500).json({ success: false, error: 'A server error occurred during verification.' });
    }
}