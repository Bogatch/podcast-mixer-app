// api/test-api-key.js (CommonJS je OK):
module.exports = (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    const key = process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API;
    if (!key) return res.status(500).json({ success:false, message:'Missing API_KEY' });
    return res.status(200).json({ success:true, message:'API key loaded', keyPreview: String(key).slice(0,6)+'…' });
  } catch (e) {
    console.error('[test-api-key]', e);
    return res.status(500).json({ success:false });
  }
};
