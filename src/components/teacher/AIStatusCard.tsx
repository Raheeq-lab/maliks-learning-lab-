
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Cloud, Database, RefreshCw } from "lucide-react";
import { dualAIService } from "@/services/DualAIService";

export const AIStatusCard: React.FC = () => {
    const [stats, setStats] = useState(dualAIService.getStats());
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleUpdate = () => {
            setStats(dualAIService.getStats());
        };

        window.addEventListener('ai-usage-updated', handleUpdate);
        return () => window.removeEventListener('ai-usage-updated', handleUpdate);
    }, []);

    const cfPercent = Math.min(100, (stats.cloudflare / 10000) * 100);
    const geminiPercent = Math.min(100, (stats.gemini / 20) * 100);

    return (
        <Card className="w-full mb-6 border-l-4 border-l-focus-blue bg-bg-card shadow-sm hover:shadow-md transition-shadow dark:border-r-0 dark:border-y-0 dark:border-b-0">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-text-primary">
                    <Zap size={16} className="text-focus-blue" fill="currentColor" />
                    AI System Status
                    <span className="text-xs font-normal text-text-secondary ml-2">
                        {stats.date} • {stats.cloudflare + stats.gemini + stats.cached} reqs today
                    </span>
                </CardTitle>
                <div className="flex items-center gap-1">
                    {stats.gemini > 15 && <span className="h-2 w-2 rounded-full bg-error-coral animate-pulse" title="Gemini nearing limit"></span>}
                    <RefreshCw size={14} className={`text-text-tertiary ${isOpen ? 'rotate-180' : ''} transition-transform`} />
                </div>
            </CardHeader>

            {isOpen && (
                <CardContent className="pt-0 pb-4 px-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Cloudflare Stats */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1 text-text-secondary font-semibold"><Cloud size={12} /> Cloudflare (Primary)</span>
                            <span className="text-text-tertiary">{stats.cloudflare} / 10,000</span>
                        </div>
                        <Progress value={cfPercent} className="h-2 bg-bg-secondary" />
                        <p className="text-[10px] text-text-tertiary">Models: Llama 3.2 3B</p>
                    </div>

                    {/* Gemini Stats */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1 text-text-secondary font-semibold"><Database size={12} /> Gemini (Backup)</span>
                            <span className={`font-bold ${stats.gemini >= 20 ? 'text-error-coral' : 'text-text-tertiary'}`}>{stats.gemini} / 20</span>
                        </div>
                        <Progress value={geminiPercent} className={`h-2 bg-bg-secondary ${stats.gemini >= 15 ? 'bg-red-100 dark:bg-red-900/30' : ''}`} />
                        <p className="text-[10px] text-text-tertiary">Failover protection active</p>
                    </div>

                    {/* Cache Stats */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1 text-text-secondary font-semibold"><Zap size={12} /> Optimization</span>
                            <span className="text-success-green font-bold">{stats.cached} saved</span>
                        </div>
                        <div className="h-2 bg-bg-secondary rounded-full overflow-hidden flex">
                            <div className="bg-success-green h-full" style={{ width: `${(stats.cached / (stats.cloudflare + stats.gemini + stats.cached + 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-[10px] text-text-tertiary">1-hour smart caching enabled</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
