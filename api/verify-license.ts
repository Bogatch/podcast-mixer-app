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
        const { email, key } = req.body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required.' });
        }
        
        console.log(`Forwarding verification request for email: ${email} to Make.com`);

        const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, license_key: key }),
        });

        const responseText = await webhookResponse.text();
        
        if (webhookResponse.ok && responseText.trim().toLowerCase() === 'accepted') {
            console.log(`License validation successful for email: ${email}`);
            return res.status(200).json({ success: true });
        } else {
            console.warn(`License validation failed for email: ${email}. Status: ${webhookResponse.status}, Response: "${responseText}"`);
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