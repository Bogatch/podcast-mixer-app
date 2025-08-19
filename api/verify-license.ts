import type { VercelRequest, VercelResponse } from '@vercel/node';

// This file replaces the client-side fetch to Google Sheets.
// It acts as a server-side proxy to securely check license credentials
// without running into browser CORS issues.

const LICENSE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZoeHd2RhHzYIdZR4vDvRLIgjcKS32nxhSHWz5-I6O9KEBxBxdc9CdefDXUFfRCtVYGQOibWy8zid8/pub?output=csv';

// This function is designed to run on Vercel's serverless environment.
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
        
        // Vercel automatically parses JSON bodies.
        const { email, key } = req.body;

        if (!email || typeof email !== 'string' || !key || typeof key !== 'string') {
            return res.status(400).json({ success: false, error: 'Email and license key are required and must be strings.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedKey = key.trim();

        // Fetch the latest license sheet from Google Sheets with a cache-busting parameter
        const sheetResponse = await fetch(`${LICENSE_SHEET_URL}&_=${new Date().getTime()}`);

        if (!sheetResponse.ok) {
            const errorText = await sheetResponse.text();
            console.error(`Failed to fetch license sheet. Status: ${sheetResponse.status}. Body: ${errorText}`);
            return res.status(502).json({ success: false, error: 'License server is temporarily unavailable.' });
        }

        const csvText = await sheetResponse.text();
        const rows = csvText.split(/\r?\n/).slice(1).filter(row => row.trim() !== ''); // Skip header row and filter empty rows

        const matchFound = rows.some(row => {
            const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
            // Ensure row has at least 2 columns to prevent errors
            if (columns.length < 2) return false;

            const sheetEmail = (columns[0] || '').toLowerCase();
            const sheetKey = (columns[1] || '').trim();
            
            return sheetEmail === normalizedEmail && sheetKey === normalizedKey;
        });

        if (matchFound) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid email or license key provided.' });
        }

    } catch (error: any) {
        console.error('Unhandled error in /api/verify-license:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
        });
        // This is the final catch-all to guarantee a JSON response, preventing client-side parsing errors.
        return res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
    }
}
