
import { cloudflareService } from './cloudflareAI';
import { supabase } from '@/lib/supabase';

interface AICacheEntry {
    response: any;
    timestamp: number;
}

export interface AIUsageStats {
    date: string;
    cloudflare: number;
    gemini: number;
    cached: number;
}

const CACHE_KEY_PREFIX = 'ai_cache_v1_';
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

    // Initialize with safe defaults, will sync with DB
    private currentStats: AIUsageStats = {
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        cloudflare: 0,
        gemini: 0,
        cached: 0
    };

    constructor() {
        this.initializeRealtimeStats();
    }

    private async initializeRealtimeStats() {
        // 1. Fetch initial state
        const today = new Date().toISOString().split('T')[0]; // Postgres Date format

        const { data, error } = await supabase
            .from('ai_usage_stats')
            .select('*')
            .eq('date', today)
            .single();

        if (data) {
            this.updateLocalStats(data);
        }

        // 2. Subscribe to global changes (Teacher B sees Teacher A's usage)
        supabase
            .channel('ai-global-stats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ai_usage_stats' },
                (payload) => {
                    const newData = payload.new as any;
                    if (newData && newData.date === today) {
                        this.updateLocalStats(newData);
                    }
                }
            )
            .subscribe();
    }

    private updateLocalStats(dbRecord: any) {
        this.currentStats = {
            date: dbRecord.date,
            cloudflare: dbRecord.cloudflare_count || 0,
            gemini: dbRecord.gemini_count || 0,
            cached: dbRecord.cached_count || 0
        };
        // Dispatch event for UI
        window.dispatchEvent(new Event('ai-usage-updated'));
    }

    // Call the Postgres RPC function to atomically increment safely
    private async incrementGlobalUsage(provider: 'cloudflare' | 'gemini' | 'cached') {
        // Optimistic update locally for speed
        this.currentStats[provider]++;
        window.dispatchEvent(new Event('ai-usage-updated'));

        // Fire and forget DB update
        await supabase.rpc('increment_ai_usage', { provider });
    }

    public getStats(): AIUsageStats {
        return this.currentStats;
    }

    // Local Storage Cache acts as a "Client-Side Edge Cache"
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
        const entry: AICacheEntry = {
            response,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
        } catch (e) {
            // If full, clear old cache
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(CACHE_KEY_PREFIX)) localStorage.removeItem(k);
            });
        }
    }

    /**
     * Primary generation function
     */
    async generateContent(
        prompt: string,
        fallbackFn: () => Promise<any>,
        systemPrompt?: string
    ): Promise<any> {
        const cacheKey = this.hashString(prompt + (systemPrompt || ''));

        // 1. Check Local Cache (Fastest)
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.incrementGlobalUsage('cached');
            return cached;
        }

        // 2. Try Cloudflare (Primary)
        try {
            // Check GLOBAL quota
            if (this.currentStats.cloudflare >= 10000) {
                throw new Error("Global Cloudflare daily limit reached");
            }

            const response = await cloudflareService.generateContent(prompt, systemPrompt);

            let finalResult: any = response;
            const cleaned = response.trim().replace(/^```json/, '').replace(/```$/, '');
            if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
                try {
                    finalResult = JSON.parse(cleaned);
                } catch (e) { /* ignore */ }
            }

            this.incrementGlobalUsage('cloudflare');
            this.setCache(cacheKey, finalResult);
            return finalResult;

        } catch (error) {
            console.warn(`[DualAI] Cloudflare failed: ${error}. Falling back to Gemini.`);

            // 3. Fallback to Gemini
            try {
                const result = await fallbackFn();
                this.incrementGlobalUsage('gemini');
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
