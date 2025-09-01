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

        if (!trackList || typeof trackList !== 'string') {
            return res.status(400).json({ success: false, error: 'trackList is required and must be a string.' });
        }

        const lang = locale === 'sk' ? 'Slovak' : 'English';

        const prompt = `
          You are a creative assistant for podcasters. Your response must be in ${lang}.
          Based on the following list of audio tracks, generate a creative title and a short, engaging description for a podcast episode. The show is about music, interviews and jingles.
          
          Track list:
          ${trackList}
        `;

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
                            description: 'A creative and catchy title for the podcast episode.'
                        },
                        description: {
                            type: Type.STRING,
                            description: 'A short, engaging description (2-3 sentences) for the podcast episode.'
                        }
                    },
                    propertyOrdering: ["title", "description"]
                }
            }
        });

        const resultText = response.text.trim();
        try {
            const resultJson = JSON.parse(resultText);
            return res.status(200).json({ success: true, data: resultJson });
        } catch (parseError) {
             console.error('Failed to parse Gemini response as JSON:', resultText);
             return res.status(500).json({ success: false, error: 'Received an invalid response from the AI model.' });
        }

    } catch (error: any) {
        console.error('Error in /api/suggest-content:', {
            message: error.message,
            stack: error.stack,
        });
        const errorMessage = error.message || 'An unexpected server error occurred.';
        const userFriendlyError = error.toString().includes('FETCH_ERROR') 
            ? 'Could not connect to the AI service.' 
            : errorMessage;
        return res.status(500).json({ success: false, error: userFriendlyError });
    }
}