import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = 'nodejs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
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

    if (!process.env.API_KEY) {
        console.error('API_KEY is not configured in environment variables.');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    try {
        const { trackList, locale } = req.body;

        if (!trackList || typeof trackList !== 'string' || trackList.trim() === '') {
            return res.status(400).json({ success: false, error: 'trackList is required and must be a non-empty string.' });
        }

        const language = locale === 'sk' ? 'Slovak' : 'English';

        // Simplified and more direct prompt
        const prompt = `Generate a creative podcast episode title and a short, engaging description based on this list of audio tracks. The response must be in ${language}.

Tracks:
${trackList}`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                            description: `A creative title for the podcast episode in ${language}.`
                        },
                        description: {
                            type: Type.STRING,
                            description: `A short, engaging description (2-3 sentences) for the podcast episode in ${language}.`
                        }
                    },
                    required: ["title", "description"]
                }
            }
        });

        const resultText = response.text;
        
        if (!resultText) {
            console.warn("Gemini API returned an empty response text.");
            throw new Error("The AI model returned an empty response. This could be due to safety filters.");
        }
        
        // The response should be JSON, but let's parse it safely.
        const resultJson = JSON.parse(resultText);

        if (!resultJson.title || !resultJson.description) {
            console.warn("Parsed JSON from Gemini is missing required fields:", resultJson);
            throw new Error("AI response was malformed.");
        }
        
        return res.status(200).json({ success: true, data: resultJson });

    } catch (error: any) {
        console.error('Error in /api/suggest-content:', {
            message: error.message,
            body: req.body,
        });
        
        const errorMessage = error.message || 'An unknown error occurred on the server.';
        // Ensure the error response is always JSON
        return res.status(500).json({ success: false, error: "Failed to get suggestion.", detail: errorMessage });
    }
}