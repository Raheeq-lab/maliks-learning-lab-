
export interface CloudflareConfig {
    accountId: string;
    apiToken: string;
    model: string;
}

export class CloudflareAIService {
    private config: CloudflareConfig;

    constructor() {
        this.config = {
            accountId: import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || '',
            apiToken: import.meta.env.VITE_CLOUDFLARE_API_TOKEN || '',
            model: import.meta.env.VITE_CLOUDFLARE_MODEL || '@cf/meta/llama-3.2-3b-instruct'
        };
    }

    async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
        // Use local proxy if in dev or prod to avoid CORS
        const endpoint = '/api/cloudflare-proxy';

        try {
            console.log(`[Cloudflare AI] Calling proxy...`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    systemPrompt,
                    // Pass specific config if available, but server will prefer env vars
                    accountId: this.config.accountId,
                    apiToken: this.config.apiToken,
                    model: this.config.model
                })
            });

            if (!response.ok) {
                // Try to parse error as text first in case it's not JSON
                const errorText = await response.text();
                let errorMsg = `Proxy Error: ${response.status} ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) errorMsg = errorJson.error;
                } catch (e) { }

                throw new Error(errorMsg);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.errors?.[0]?.message || "Unknown Cloudflare error from proxy");
            }

            return result.result.response;

        } catch (error) {
            console.error("[Cloudflare AI] Generation failed via proxy:", error);
            throw error;
        }
    }
}

export const cloudflareService = new CloudflareAIService();
