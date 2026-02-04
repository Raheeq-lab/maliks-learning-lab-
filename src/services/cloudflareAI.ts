
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
        if (!this.config.accountId || !this.config.apiToken) {
            throw new Error("Cloudflare credentials missing");
        }

        const messages = [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
        ];

        try {
            console.log(`[Cloudflare AI] Calling model ${this.config.model}...`);
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/ai/run/${this.config.model}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages,
                        temperature: 0.7,
                        max_tokens: 2048 // Reasonable limit for 3B model
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.errors?.[0]?.message || `Cloudflare API Error: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.errors?.[0]?.message || "Unknown Cloudflare error");
            }

            return result.result.response;

        } catch (error) {
            console.error("[Cloudflare AI] Generation failed:", error);
            throw error;
        }
    }
}

export const cloudflareService = new CloudflareAIService();
