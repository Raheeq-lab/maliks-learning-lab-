import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt, type } = await req.json();

        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API Key not configured on server');
        }

        // Determine the system instructions based on type
        let systemInstruction = "";
        if (type === 'quiz') {
            systemInstruction = "You are a quiz generator. Output valid JSON.";
        } else if (type === 'lesson') {
            systemInstruction = "You are a lesson plan generator. Output valid JSON.";
        } else {
            systemInstruction = "You are a helpful assistant.";
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemInstruction + "\n\n" + prompt }] }],
                    generationConfig: {
                        response_mime_type: "application/json"
                    }
                }),
            }
        );

        const data = await response.json();

        // Relay the response from Gemini
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
