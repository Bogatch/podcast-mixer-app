import { GoogleGenAI, Type } from "@google/genai";

// This function is designed to run on Vercel's serverless environment.
export default async function handler(req: any, res: any) {
    // Set headers for CORS, caching, and content type
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
        const { tracks } = req.body;

        if (!Array.isArray(tracks) || tracks.length === 0) {
            return res.status(400).json({ success: false, error: 'Track list is required and cannot be empty.' });
        }

        const trackList = tracks.map((t: {name: string, type: string}) => `- ${t.name} (type: ${t.type})`).join('\n');
        const prompt = `
          You are a creative assistant for podcasters. Based on the following list of audio tracks, generate a creative title and a short, engaging description for a podcast episode. The show is about music, interviews and jingles.
          
          Track list:
          ${trackList}
    
          Provide the response in a JSON format.
        `;
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error('API_KEY environment variable not set.');
            return res.status(500).json({ success: false, error: 'Server configuration error.' });
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: 'A creative and catchy title for the podcast episode.'
                        },
                        description: {
                            type: Type.STRING,
                            description: 'A short, engaging description (2-3 sentences) for the podcast episode.'
                        }
                    }
                }
            }
        });
      
        const resultText = response.text.trim();
        const resultJson = JSON.parse(resultText);

        return res.status(200).json({ 
            success: true, 
            title: resultJson.title || '', 
            description: resultJson.description || '' 
        });

    } catch (error: any) {
        console.error('Error in /api/suggest-content:', {
            message: error.message,
        });
        return res.status(500).json({ success: false, error: 'Failed to generate content from AI service.' });
    }
}
