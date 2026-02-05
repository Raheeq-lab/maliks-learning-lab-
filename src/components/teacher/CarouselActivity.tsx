import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Hand, Mic, Clock, RotateCw, ArrowRight } from "lucide-react";

interface Station {
    station: string;
    task: string;
    content: string;
}

interface CarouselActivityProps {
    stations?: Station[];
    topic: string;
}

export const CarouselActivity: React.FC<CarouselActivityProps> = ({ stations, topic }) => {
    const [currentStationIndex, setCurrentStationIndex] = useState(0);
    const [rotation, setRotation] = useState(1);

    if (!stations || stations.length === 0) {
        return <div className="p-8 text-center text-gray-500">No carousel stations data available.</div>;
    }

    const stationConfig: Record<string, { icon: React.ReactNode, color: string, bg: string, description: string }> = {
        "BRAIN": {
            icon: <Brain size={32} />,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
            description: "Define & Describe"
        },
        "HEART": {
            icon: <Heart size={32} />,
            color: "text-red-500 dark:text-red-400",
            bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
            description: "Connect & Question"
        },
        "HANDS": {
            icon: <Hand size={32} />,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
            description: "Solve & Create"
        },
        "VOICE": {
            icon: <Mic size={32} />,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
            description: "Judge & Defend"
        }
    };

    const currentStation = stations[currentStationIndex];
    const config = stationConfig[currentStation.station.toUpperCase()] || {
        icon: <RotateCw size={32} />,
        color: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
        description: "Activity Station"
    };

    const handleNextStation = () => {
        setCurrentStationIndex((prev) => (prev + 1) % stations.length);
        if (currentStationIndex === stations.length - 1) {
            setRotation(prev => prev + 1);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Context */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <RotateCw className="text-indigo-600 dark:text-indigo-400" />
                            4-Carousel Challenge
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Topic: <span className="font-bold text-slate-900 dark:text-slate-100">{topic}</span>
                        </p>
                    </div>
                    <Badge variant="outline" className="px-4 py-2 text-lg bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-200">
                        Rotation {rotation}
                    </Badge>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Instructions: Divide into 4 groups. Start at your assigned station. Complete the task, then rotate clockwise when the timer ends.
                </p>
            </div>

            {/* Main Station Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-[400px]">

                {/* Sidebar Navigation */}
                <div className="md:col-span-3 space-y-3">
                    {stations.map((s, idx) => {
                        const sConfig = stationConfig[s.station.toUpperCase()] || config;
                        const isActive = idx === currentStationIndex;

                        return (
                            <div
                                key={idx}
                                onClick={() => setCurrentStationIndex(idx)}
                                className={`
                                    p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-3
                                    ${isActive
                                        ? `${sConfig.bg} ${sConfig.color} shadow-md transform scale-105`
                                        : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 opacity-60 hover:opacity-100'}
                                `}
                            >
                                <div className={`p-2 rounded-lg bg-white/50 dark:bg-slate-950/30`}>
                                    {React.cloneElement(sConfig.icon as React.ReactElement, { size: 20 })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm tracking-wide">{s.station}</h4>
                                    <p className="text-xs font-medium opacity-80">{sConfig.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Active Station Content */}
                <Card className={`md:col-span-9 border-t-8 ${config.color.replace('text-', 'border-')} shadow-lg`}>
                    <CardHeader className={`${config.bg.split(' ')[0]} pb-6`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm ${config.color}`}>
                                    {config.icon}
                                </div>
                                <div>
                                    <CardTitle className={`text-4xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100`}>
                                        {currentStation.station}
                                    </CardTitle>
                                    <p className={`text-xl font-medium ${config.color} mt-1`}>
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Current Task</div>
                                <div className="font-mono text-3xl font-bold text-slate-700 dark:text-slate-200"> Station {currentStationIndex + 1}</div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        <div>
                            <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ArrowRight size={16} /> The Mission
                            </h5>
                            <p className="text-2xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                "{currentStation.task}"
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                                Guiding Questions / Prompt
                            </h5>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-loose">
                                {currentStation.content}
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleNextStation}
                                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 h-14 px-8 text-lg font-bold shadow-lg shadow-slate-900/10"
                            >
                                Rotate to Next Station <RotateCw className="ml-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
