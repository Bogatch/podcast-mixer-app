// This file replaces the client-side fetch to Google Sheets.
// It acts as a server-side proxy to securely check license credentials
// without running into browser CORS issues.

const LICENSE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZoeHd2RhHzYIdZR4vDvRLIgjcKS32nxhSHWz5-I6O9KEBxBxdc9CdefDXUFfRCtVYGQOibWy8zid8/pub?output=csv';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // Vercel automatically parses JSON bodies. This logic safely extracts
        // the required fields, whether the body is pre-parsed or a raw string.
        let email: string | undefined;
        let key: string | undefined;

        if (req.body) {
            if (typeof req.body === 'object' && req.body !== null) {
                // Body is already a parsed object (common case on Vercel)
                email = req.body.email;
                key = req.body.key;
            } else if (typeof req.body === 'string' && req.body.length > 0) {
                // Fallback for raw string body
                try {
                    const parsedBody = JSON.parse(req.body);
                    email = parsedBody.email;
                    key = parsedBody.key;
                } catch (e) {
                    return res.status(400).json({ success: false, error: 'Invalid JSON in request body.' });
                }
            }
        }

        if (!email || !key) {
            return res.status(400).json({ success: false, error: 'Email and key are required.' });
        }

        // Add a timestamp to bypass caches, ensuring we get the latest sheet data
        const url = `${LICENSE_SHEET_URL}&_=${new Date().getTime()}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch license sheet, status: ${response.status}, statusText: ${response.statusText}`);
            return res.status(502).json({ success: false, error: 'Could not connect to the license data source.' });
        }

        const csvText = await response.text();
        // Split into rows, skip header, trim, and filter out empty lines
        const rows = csvText.split(/\r?\n/).slice(1).map(row => row.trim()).filter(Boolean);

        let matchFound = false;
        for (const row of rows) {
            // Simple CSV parse: split by comma, trim whitespace, and remove quotes
            const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
            
            // Safety check for malformed rows
            if (columns.length >= 2) {
                const sheetEmail = columns[0];
                const sheetKey = columns[1];
                if (sheetEmail && sheetKey && sheetEmail.toLowerCase() === String(email).trim().toLowerCase() && sheetKey.trim() === String(key).trim()) {
                    matchFound = true;
                    break;
                }
            }
        }

        if (matchFound) {
            return res.status(200).json({ success: true });
        } else {
            // Return 401 Unauthorized for a failed validation attempt.
            return res.status(401).json({ success: false, error: 'Invalid email or license key.' });
        }

    } catch (error: any) {
        console.error('Error in /api/verify-license:', error);
        // Ensure a JSON response is always sent on error to prevent client-side parsing failures.
        return res.status(500).json({ success: false, error: error.message || 'An internal server error occurred.' });
    }
}