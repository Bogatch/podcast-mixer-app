// This file replaces the client-side fetch to Google Sheets.
// It acts as a server-side proxy to securely check license credentials
// without running into browser CORS issues.

const LICENSE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZoeHd2RhHzYIdZR4vDvRLIgjcKS32nxhSHWz5-I6O9KEBxBxdc9CdefDXUFfRCtVYGQOibWy8zid8/pub?output=csv';

// This function is designed to run on Vercel's serverless environment.
export default async function handler(req: any, res: any) {
    // Set headers to prevent caching and ensure JSON content type
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        let email: string = '';
        let key: string = '';

        // Safely extract email and key from the request body, handling various cases
        if (req.body && typeof req.body === 'object') {
            email = String(req.body.email || '').trim().toLowerCase();
            key = String(req.body.key || '').trim();
        } else if (typeof req.body === 'string' && req.body.length > 0) {
            try {
                const parsedBody = JSON.parse(req.body);
                email = String(parsedBody.email || '').trim().toLowerCase();
                key = String(parsedBody.key || '').trim();
            } catch (parseError) {
                return res.status(400).json({ success: false, error: 'Invalid JSON in request body.' });
            }
        }

        if (!email || !key) {
            return res.status(400).json({ success: false, error: 'Email and license key are required.' });
        }

        // Fetch the latest license sheet from Google Sheets with a cache-busting parameter
        const sheetResponse = await fetch(`${LICENSE_SHEET_URL}&_=${new Date().getTime()}`);

        if (!sheetResponse.ok) {
            const errorText = await sheetResponse.text();
            console.error(`Failed to fetch license sheet. Status: ${sheetResponse.status}. Body: ${errorText}`);
            return res.status(502).json({ success: false, error: 'License server is temporarily unavailable.' });
        }

        const csvText = await sheetResponse.text();
        const rows = csvText.split(/\r?\n/).slice(1); // Skip header row

        const matchFound = rows.some(row => {
            const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
            if (columns.length < 2) return false;

            const sheetEmail = (columns[0] || '').toLowerCase();
            const sheetKey = columns[1] || '';
            
            return sheetEmail === email && sheetKey === key;
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
