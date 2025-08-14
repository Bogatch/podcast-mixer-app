// This file replaces the client-side fetch to Google Sheets.
// It acts as a server-side proxy to securely check license credentials
// without running into browser CORS issues.

const LICENSE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ztjMQwyzIykZ3gXocz5-aQrosN5qbqlSAYiNOSD3P30/export?format=csv&gid=0';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const { email, key } = req.body;

    if (!email || !key) {
        return res.status(400).json({ success: false, error: 'Email and key are required.' });
    }

    try {
        // Add a timestamp to bypass caches
        const url = `${LICENSE_SHEET_URL}&_=${new Date().getTime()}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch license sheet, status: ${response.status}`);
            return res.status(502).json({ success: false, error: 'Could not connect to the license data source.' });
        }

        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).map(row => row.trim());

        let matchFound = false;
        for (const row of rows) {
            // Simple CSV parse: split by comma, trim whitespace, and remove quotes
            const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
            if (columns.length >= 2) {
                const sheetEmail = columns[0];
                const sheetKey = columns[1];
                if (sheetEmail.toLowerCase() === String(email).trim().toLowerCase() && sheetKey.trim() === String(key).trim()) {
                    matchFound = true;
                    break;
                }
            }
        }

        if (matchFound) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false, error: 'Invalid email or license key.' });
        }

    } catch (error) {
        console.error('Error in /api/verify-license:', error);
        return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
    }
}
