
export default async function handler(req, res) {
    // CORS Handling for Vercel Serverless Functions
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, systemPrompt, accountId, apiToken, model } = req.body;

    // Use environment variables from the server side if not passed (safer)
    // But for flexibility with the current setup, we can accept them or fall back to process.env
    const CLOUDFLARE_ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || accountId;
    const CLOUDFLARE_API_TOKEN = process.env.VITE_CLOUDFLARE_API_TOKEN || apiToken;
    const CLOUDFLARE_MODEL = process.env.VITE_CLOUDFLARE_MODEL || model || '@cf/meta/llama-3.2-3b-instruct';

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        return res.status(500).json({ error: 'Missing Cloudflare credentials on server' });
    }

    try {
        const messages = [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
        ];

        console.log(`[Proxy] Calling Cloudflare Model: ${CLOUDFLARE_MODEL}`);

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${CLOUDFLARE_MODEL}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages,
                    temperature: 0.7,
                    max_tokens: 2048
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Cloudflare API Error:", response.status, errorText);
            return res.status(response.status).json({ error: `Cloudflare Error: ${errorText}` });
        }

        const result = await response.json();
        return res.status(200).json(result);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
