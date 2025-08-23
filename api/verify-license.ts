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

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        if (!req.body) {
            return res.status(400).json({ success: false, error: 'Missing request body.' });
        }
        
        const { email, key } = req.body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }

        // Forward the verification request to the Make.com webhook
        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, license_key: key }),
        });

        const responseText = await webhookResponse.text();

        // Check for a successful response (status 200) AND valid content
        if (webhookResponse.ok) {
            let isValid = false;
            // Check for explicit JSON success response
            try {
                const data = JSON.parse(responseText);
                if (data && data.valid === true) {
                    isValid = true;
                }
            } catch (e) {
                // Not JSON, continue to check for plain text
            }
            
            // Fallback: Check for simple "Accepted" text response
            if (!isValid && responseText.trim().toLowerCase() === 'accepted') {
                isValid = true;
            }

            if (isValid) {
                return res.status(200).json({ success: true });
            }
        }
        
        // If we reach here, the license is invalid for any reason
        const errorMessage = 'Invalid email or license key provided.';
        return res.status(401).json({ success: false, error: errorMessage });

    } catch (error: any) {
        console.error('Unhandled error in /api/verify-license:', {
            message: error.message,
            stack: error.stack,
        });
        // This is the final catch-all to guarantee a JSON response, preventing client-side parsing errors.
        return res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
    }
}