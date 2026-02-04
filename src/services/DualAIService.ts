
import { cloudflareService } from './cloudflareAI';

interface AICacheEntry {
    response: any;
    timestamp: number;
}

interface AIUsageStats {
    date: string;
    cloudflare: number;
    gemini: number;
    cached: number;
}

const CACHE_KEY_PREFIX = 'ai_cache_v1_';
const USAGE_KEY = 'ai_usage_stats';
const CACHE_TTL = 3600 * 1000; // 1 hour

export class DualAIService {

    // Simple string hash for cache keys
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    private getUsage(): AIUsageStats {
        const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
        const stored = localStorage.getItem(USAGE_KEY);

        let stats: AIUsageStats = stored ? JSON.parse(stored) : { date: today, cloudflare: 0, gemini: 0, cached: 0 };

        // Auto-reset if date changed (Pacific Time)
        if (stats.date !== today) {
            stats = { date: today, cloudflare: 0, gemini: 0, cached: 0 };
            this.saveUsage(stats);
        }

        return stats;
    }

    private saveUsage(stats: AIUsageStats) {
        localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
        // Dispatch event for UI updates
        window.dispatchEvent(new Event('ai-usage-updated'));
    }

    private incrementUsage(provider: 'cloudflare' | 'gemini' | 'cached') {
        const stats = this.getUsage();
        stats[provider]++;
        this.saveUsage(stats);
    }

    public getStats(): AIUsageStats {
        return this.getUsage();
    }

    private getFromCache(key: string): any | null {
        const item = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (!item) return null;

        try {
            const entry: AICacheEntry = JSON.parse(item);
            if (Date.now() - entry.timestamp < CACHE_TTL) {
                console.log(`[DualAI] Cache hit for ${key}`);
                return entry.response;
            } else {
                localStorage.removeItem(CACHE_KEY_PREFIX + key); // Expired
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    private setCache(key: string, response: any) {
        // Limit cache size? For now just simple infinite localStorage (browser limits apply)
        const entry: AICacheEntry = {
            response,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
        } catch (e) {
            console.warn("[DualAI] Cache full, clearing old entries");
            // Simple clear strategy: clear all AI cache if full
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(CACHE_KEY_PREFIX)) localStorage.removeItem(k);
            });
        }
    }

    /**
     * Primary generation function
     * @param prompt The prompt to send
     * @param fallbackFn The existing Gemini function to call if Cloudflare fails
     * @param systemPrompt Optional system prompt
     * @returns The generated response (string or object depending on fallbackFn return type)
     */
    async generateContent(
        prompt: string,
        fallbackFn: () => Promise<any>,
        systemPrompt?: string
    ): Promise<any> {
        const cacheKey = this.hashString(prompt + (systemPrompt || ''));

        // 1. Check Cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.incrementUsage('cached');
            return cached;
        }

        // 2. Try Cloudflare (Primary)
        try {
            // Check quota first? (10k limit)
            const stats = this.getUsage();
            if (stats.cloudflare >= 10000) {
                throw new Error("Cloudflare daily limit reached");
            }

            const response = await cloudflareService.generateContent(prompt, systemPrompt);

            // Cloudflare returns string. If the consumer expects JSON, we might need to parse it?
            // The fallbackFn (Gemini) usually returns an object.
            // WE need to standardize. 
            // PROBLEM: Cloudflare returns raw string. Gemini returns parsed JSON often.
            // Solution: We try to parse Cloudflare response as JSON if it looks like JSON.

            let finalResult: any = response;

            // Heuristic: If response looks like JSON code block or object, try parsing
            const cleaned = response.trim().replace(/^```json/, '').replace(/```$/, '');
            if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
                try {
                    finalResult = JSON.parse(cleaned);
                } catch (e) {
                    console.warn("[DualAI] Cloudflare returned JSON-like string but parse failed, returning raw.");
                }
            }

            this.incrementUsage('cloudflare');
            this.setCache(cacheKey, finalResult);
            return finalResult;

        } catch (error) {
            console.warn(`[DualAI] Cloudflare failed: ${error}. Falling back to Gemini.`);

            // 3. Fallback to Gemini
            try {
                // Check Gemini quota? (20 limit is strict but usually lenient in free tier)
                // We just let it fail naturally or check usage

                const result = await fallbackFn();
                this.incrementUsage('gemini');
                this.setCache(cacheKey, result);
                return result;
            } catch (geminiError) {
                console.error(`[DualAI] Optimization failed. Both providers failed.`);
                throw geminiError;
            }
        }
    }
}

export const dualAIService = new DualAIService();
