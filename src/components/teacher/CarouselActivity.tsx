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
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
            description: "Define & Describe"
        },
        "HEART": {
            icon: <Heart size={32} />,
            color: "text-red-500",
            bg: "bg-red-50 border-red-200",
            description: "Connect & Question"
        },
        "HANDS": {
            icon: <Hand size={32} />,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-200",
            description: "Solve & Create"
        },
        "VOICE": {
            icon: <Mic size={32} />,
            color: "text-purple-600",
            bg: "bg-purple-50 border-purple-200",
            description: "Judge & Defend"
        }
    };

    const currentStation = stations[currentStationIndex];
    const config = stationConfig[currentStation.station.toUpperCase()] || {
        icon: <RotateCw size={32} />,
        color: "text-gray-600",
        bg: "bg-gray-50 border-gray-200",
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
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <RotateCw className="text-indigo-600" />
                            4-Carousel Challenge
                        </h3>
                        <p className="text-gray-600 mt-1">
                            Topic: <span className="font-bold text-indigo-600">{topic}</span>
                        </p>
                    </div>
                    <Badge variant="outline" className="px-4 py-2 text-lg bg-indigo-50 border-indigo-200 text-indigo-700">
                        Rotation {rotation}
                    </Badge>
                </div>

                <p className="text-sm text-gray-500 italic">
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
                                        : 'bg-white border-transparent hover:bg-gray-50 text-gray-400 opacity-60 hover:opacity-100'}
                                `}
                            >
                                <div className={`p-2 rounded-lg bg-white/50`}>
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
                                <div className={`p-4 rounded-2xl bg-white shadow-sm ${config.color}`}>
                                    {config.icon}
                                </div>
                                <div>
                                    <CardTitle className={`text-4xl font-black uppercase tracking-tight text-gray-800`}>
                                        {currentStation.station}
                                    </CardTitle>
                                    <p className={`text-xl font-medium ${config.color} mt-1`}>
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">Current Task</div>
                                <div className="font-mono text-3xl font-bold text-gray-700"> Station {currentStationIndex + 1}</div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        <div>
                            <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ArrowRight size={16} /> The Mission
                            </h5>
                            <p className="text-2xl font-medium text-gray-800 leading-relaxed">
                                "{currentStation.task}"
                            </p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Guiding Questions / Prompt
                            </h5>
                            <p className="text-lg text-gray-600 leading-loose">
                                {currentStation.content}
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleNextStation}
                                className="bg-gray-900 text-white hover:bg-gray-800 h-14 px-8 text-lg font-bold shadow-lg shadow-gray-900/10"
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
