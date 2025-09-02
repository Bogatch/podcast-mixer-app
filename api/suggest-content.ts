
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
    
    if (!process.env.API_KEY) {
        if (process.env.GOOGLE_API) {
            return res.status(500).json({
                success: false,
                error: 'Server configuration error.',
                detail: 'An environment variable named "GOOGLE_API" was found. Please rename it to "API_KEY" in your Vercel project settings and redeploy.'
            });
        }
        console.error('API_KEY is not configured in environment variables.');
        return res.status(500).json({ 
            success: false, 
            error: 'Server configuration error.',
            detail: 'The API_KEY environment variable is missing on the server.' 
        });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { trackList, locale } = req.body;

        if (!trackList || typeof trackList !== 'string' || trackList.trim() === '') {
            return res.status(400).json({ success: false, error: 'trackList is required and must be a non-empty string.' });
        }

        const language = locale === 'sk' ? 'Slovak' : 'English';

        const prompt = `
You are a creative assistant for podcasters. Based on the following list of audio tracks, generate a creative podcast episode title and a short, engaging description.
The language of the title and description must be ${language}.

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
                            description: "The creative and catchy title for the podcast episode."
                        },
                        description: {
                            type: Type.STRING,
                            description: "A short, engaging description for the podcast episode."
                        },
                    },
                    required: ["title", "description"],
                },
            },
        });

        const resultText = response.text;
        
        if (!resultText) {
            console.warn("Gemini API returned an empty response text.");
            throw new Error("The AI model returned an empty response. This could be due to safety filters.");
        }
        
        let resultJson;
        try {
            resultJson = JSON.parse(resultText);
        } catch(e) {
            console.error("Failed to parse Gemini response as JSON:", resultText);
            throw new Error("AI response was not valid JSON.");
        }

        if (!resultJson.title || !resultJson.description) {
            console.warn("Parsed JSON from Gemini is missing required fields:", resultJson);
            throw new Error("AI response was malformed or missing required fields.");
        }
        
        return res.status(200).json({ success: true, data: resultJson });

    } catch (error: any) {
        console.error('--- DETAILED ERROR in /api/suggest-content ---');
        console.error('Error Message:', error.message);
        if(error.response) {
             console.error('Error Response:', JSON.stringify(error.response, null, 2));
        }
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        console.error('--- END DETAILED ERROR ---');
        
        const errorMessage = error.message || 'An unknown error occurred on the server.';
        return res.status(500).json({ success: false, error: "Failed to get suggestion.", detail: errorMessage });
    }
}
