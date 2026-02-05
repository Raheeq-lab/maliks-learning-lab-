import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Maximize2, MonitorPlay } from "lucide-react";

interface Slide {
    title: string;
    bullets: string[];
    imagePrompt?: string;
    speakerNotes?: string;
}

interface PresentationActivityProps {
    slides?: Slide[];
    topic: string;
}

export const PresentationActivity: React.FC<PresentationActivityProps> = ({ slides = [], topic }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Default slides if none provided
    const displaySlides = slides.length > 0 ? slides : [
        { title: "Introduction", bullets: ["Welcome to the session", "Let's explore " + topic], speakerNotes: "Start with a hook." },
        { title: "Key Concept", bullets: ["Main idea 1", "Main idea 2"], speakerNotes: "Explain deeply." }
    ];

    const currentSlide = displaySlides[currentSlideIndex];

    const handleNext = () => {
        if (currentSlideIndex < displaySlides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlideIndex]); // Dependency needed to access latest state if function wasn't memoized correctly, though updater form is safe.
    // Actually better to just attach once, but safe enough here.

    return (
        <div className={`space-y-6 transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-8 flex items-center justify-center' : ''}`}>

            {/* Controls (Non-Fullscreen Header) */}
            {!isFullscreen && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <MonitorPlay size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Presentation Mode</h3>
                            <p className="text-xs text-gray-500">Slide {currentSlideIndex + 1} of {displaySlides.length}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)} className="gap-2">
                        <Maximize2 size={16} /> Fullscreen
                    </Button>
                </div>
            )}

            {/* Slide Viewer */}
            <div className={`aspect-video bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden relative group ${isFullscreen ? 'w-full max-w-7xl h-auto' : 'w-full'}`}>

                {/* Slide Background / Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 -z-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                {/* Content Container */}
                <div className="h-full flex flex-col p-12 md:p-16 relative z-10">

                    {/* Header */}
                    <div className="mb-8 border-b-4 border-yellow-400 pb-4 w-fit pr-12">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            {currentSlide.title}
                        </h2>
                    </div>

                    {/* Body */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            {currentSlide.bullets.map((bullet, idx) => (
                                <div key={idx} className="flex items-start gap-4 text-xl md:text-2xl text-gray-700 font-medium animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 150}ms` }}>
                                    <div className="mt-2 w-3 h-3 rounded-full bg-blue-500 shrink-0"></div>
                                    <p>{bullet}</p>
                                </div>
                            ))}
                        </div>

                        {/* Right side Visual (Placeholder or generated image) */}
                        <div className="h-full max-h-[400px] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 relative overflow-hidden group-hover:border-blue-400 transition-colors">
                            {currentSlide.imagePrompt ? (
                                <div className="text-center p-6">
                                    {/* In a real scenario we'd use the image generation tool here or <img src> if URL exists */}
                                    {/* For now, just show the prompt concept */}
                                    <MonitorPlay size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="italic text-sm">Visual: {currentSlide.imagePrompt}</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <MonitorPlay size={48} className="mx-auto mb-4 opacity-20" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8 flex justify-between items-end border-t border-gray-200">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{topic}</p>
                        <p className="text-sm text-gray-400">{currentSlideIndex + 1} / {displaySlides.length}</p>
                    </div>
                </div>

                {/* Navigation Overlay */}
                <div className="absolute inset-0 pointer-events-none flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        disabled={currentSlideIndex === 0}
                        onClick={handlePrev}
                        size="icon"
                        variant="secondary"
                        className="pointer-events-auto h-12 w-12 rounded-full shadow-lg bg-white/80 hover:bg-white"
                    >
                        <ChevronLeft size={24} />
                    </Button>
                    <Button
                        disabled={currentSlideIndex === displaySlides.length - 1}
                        onClick={handleNext}
                        size="icon"
                        variant="secondary"
                        className="pointer-events-auto h-12 w-12 rounded-full shadow-lg bg-white/80 hover:bg-white"
                    >
                        <ChevronRight size={24} />
                    </Button>
                </div>
            </div>

            {/* Speaker Notes (Only visible in non-fullscreen) */}
            {!isFullscreen && currentSlide.speakerNotes && (
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-yellow-800 text-sm font-medium">
                    <span className="uppercase tracking-widest text-xs font-bold text-yellow-600 block mb-2">Speaker Notes</span>
                    {currentSlide.speakerNotes}
                </div>
            )}

            {isFullscreen && (
                <Button
                    className="fixed top-4 right-4 z-[60] bg-white/20 hover:bg-white/40 text-white border-0"
                    onClick={() => setIsFullscreen(false)}
                >
                    Exit Fullscreen
                </Button>
            )}
        </div>
    );
};
