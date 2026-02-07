import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronRight, BookOpen, Upload, Image as ImageIcon, FileText, Info, Layers, Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Flashcard } from '@/types/quiz';

interface InstructionalContent {
    title?: string;
    history?: string;
    vocabulary?: { term: string; definition: string }[];
    workedExample?: {
        problem: string;
        steps: { label: string; explanation: string; visual?: string }[];
    };
    customContent?: {
        type: 'image' | 'file';
        url: string;
        name: string;
    };
    flashcards?: Flashcard[];
}

interface InstructionalActivityProps {
    data: InstructionalContent;
    onUploadCustom?: (file: File) => void;
    topic: string;
    onAddFlashcards?: () => void;
    onGenerateFlashcards?: () => void;
}
export const InstructionalActivity: React.FC<InstructionalActivityProps> = ({
    data,
    onUploadCustom,
    topic,
    onAddFlashcards,
    onGenerateFlashcards
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [uploadMode, setUploadMode] = useState(false);

    // If custom content is present, show it by default? Or provide a toggle?
    // User asked: "add a section if teacher will not like they can upload there own page"
    // So if there IS custom content, we probably show that, or show the AI content with an override option.

    const hasCustom = !!data.customContent;

    return (
        <div className="space-y-6">

            {/* Header / Mode Switch */}
            <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg backdrop-blur-sm border border-transparent dark:border-border">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <BookOpen className="w-5 h-5 text-focus-blue dark:text-blue-400" />
                    {topic}
                </h3>
                <div className="flex gap-2">
                    {onUploadCustom && (
                        <div className="relative">
                            <input
                                type="file"
                                id="custom-upload"
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) onUploadCustom(e.target.files[0]);
                                }}
                            />
                            <Button variant="outline" size="sm" className="gap-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" asChild>
                                <label htmlFor="custom-upload" className="cursor-pointer">
                                    <Upload size={16} />
                                    {hasCustom ? "Replace Custom Material" : "Upload Custom Material"}
                                </label>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {hasCustom ? (
                <Card className="overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800">
                        <CardTitle className="text-base flex items-center gap-2 dark:text-slate-200">
                            {data.customContent?.type === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
                            Custom Teaching Material
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-slate-100 dark:bg-slate-950">
                        {data.customContent?.type === 'image' ? (
                            <img src={data.customContent.url} alt="Custom material" className="w-full h-auto max-h-[600px] object-contain bg-slate-100" />
                        ) : (
                            <div className="p-8 flex items-center justify-center bg-slate-100">
                                <a href={data.customContent?.url} target="_blank" rel="noopener noreferrer" className="text-focus-blue dark:text-blue-400 underline font-medium">
                                    View Uploaded File ({data.customContent?.name})
                                </a>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" className="w-full rounded-t-none text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400" onClick={() => {/* Logic to remove? User didn't ask explicitly to remove, just upload */ }}>
                            (To revert to AI content, re-generate or clear this upload)
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[500px]">

                    {/* LEFT COLUMN: History & Vocabulary */}
                    <div className="space-y-6">
                        {data.history && (
                            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                        <Info size={18} /> Context & History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-amber-900/80 dark:text-amber-200/90 leading-relaxed text-sm md:text-base">
                                    {data.history}
                                </CardContent>
                            </Card>
                        )}

                        {data.vocabulary && data.vocabulary.length > 0 && (
                            <Card className="dark:bg-slate-900/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-200">
                                        <BookOpen size={18} /> Key Vocabulary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-3">
                                    {data.vocabulary.map((vocab, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
                                            <span className="font-bold text-focus-blue dark:text-blue-400 whitespace-nowrap">{vocab.term}</span>
                                            <span className="text-sm text-slate-600 dark:text-slate-300 italic leading-snug">{vocab.definition}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Interactive Worked Example */}
                    {data.workedExample && (
                        <Card className="h-full flex flex-col border-focus-blue/20 shadow-md dark:bg-slate-900/50 dark:border-blue-900/30">
                            <CardHeader className="bg-focus-blue/5 border-b border-focus-blue/10 pb-4 dark:bg-blue-900/10 dark:border-blue-900/20">
                                <Badge variant="secondary" className="w-fit mb-2 bg-white text-focus-blue hover:bg-white dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-900">Worked Example</Badge>
                                <CardTitle className="text-xl text-slate-800 dark:text-slate-100">{data.workedExample.problem}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-6 relative">
                                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700" />
                                <div className="space-y-8 relative">
                                    {data.workedExample.steps.map((step, index) => (
                                        <div key={index} className={`transition-all duration-500 ${index > activeStep ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                                            <div className="flex gap-4">
                                                <div
                                                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center z-10 font-bold border-2 transition-colors ${index <= activeStep
                                                        ? 'bg-focus-blue border-focus-blue text-white shadow-lg scale-110 dark:bg-blue-600 dark:border-blue-600'
                                                        : 'bg-white border-slate-300 text-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-600'
                                                        }`}
                                                >
                                                    {index + 1}
                                                </div>
                                                <div className="space-y-2 pt-1">
                                                    <h4 className={`font-semibold text-lg ${index <= activeStep ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>{step.label}</h4>
                                                    <p className={`text-slate-600 dark:text-slate-300 ${index <= activeStep ? 'block' : 'hidden'}`}>{step.explanation}</p>
                                                    {step.visual && index <= activeStep && (
                                                        <div className="mt-3 p-3 bg-blue-50/50 rounded-md border border-blue-100 text-sm font-mono text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-200">
                                                            {step.visual}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            {/* Stepper Controls */}
                            <div className="p-4 bg-slate-50 border-t flex justify-between items-center dark:bg-slate-900/50 dark:border-slate-800">
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                    disabled={activeStep === 0}
                                    className="dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Previous Step
                                </Button>
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Step {activeStep + 1} of {data.workedExample.steps.length}
                                </div>
                                <Button
                                    onClick={() => setActiveStep(Math.min(data.workedExample!.steps.length - 1, activeStep + 1))}
                                    disabled={activeStep === data.workedExample.steps.length - 1}
                                    className="bg-focus-blue hover:bg-focus-blue/90 dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white"
                                >
                                    Next Step <ChevronRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Flashcards Section */}
            {(data.flashcards && data.flashcards.length > 0) || onAddFlashcards ? (
                <Card className="border-math-purple/20 shadow-md dark:bg-slate-900/50 dark:border-purple-900/30">
                    <CardHeader className="bg-math-purple/5 border-b border-math-purple/10 pb-4 dark:bg-purple-900/10 dark:border-purple-900/20 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white text-math-purple hover:bg-white dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-900">
                                <Layers size={14} className="mr-1" /> Flashcards
                            </Badge>
                            <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Key Concepts</CardTitle>
                        </div>
                        {onAddFlashcards && (data.flashcards?.length || 0) === 0 && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={onAddFlashcards}>Create Manually</Button>
                                <Button size="sm" variant="secondary" className="bg-white text-math-purple border border-math-purple/20 hover:bg-math-purple/5" onClick={onGenerateFlashcards}>
                                    <Sparkles size={14} className="mr-1" /> Generate with AI
                                </Button>
                            </div>
                        )}
                        {onAddFlashcards && (data.flashcards?.length || 0) > 0 && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={onAddFlashcards}>Edit Cards</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-6">
                        {data.flashcards && data.flashcards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.flashcards.map((card, i) => (
                                    <div
                                        key={card.id || i}
                                        className="h-48 cursor-pointer perspective-1000 group relative"
                                        onClick={(e) => {
                                            const target = e.currentTarget.firstElementChild as HTMLElement;
                                            target.classList.toggle('rotate-y-180');
                                        }}
                                    >
                                        <div className="relative w-full h-full transition-all duration-500 preserve-3d">
                                            {/* Front */}
                                            <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 border-2 border-math-purple/20 rounded-2xl flex items-center justify-center p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                                <p className="text-lg font-bold text-math-purple text-center">{card.front}</p>
                                                <Badge className="absolute bottom-4 right-4 bg-math-purple/10 text-math-purple border-none text-[10px]">Click to flip</Badge>
                                            </div>
                                            {/* Back */}
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-math-purple text-white rounded-2xl flex items-center justify-center p-6 shadow-xl">
                                                <p className="text-base font-medium text-center leading-relaxed">{card.back}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-bg-secondary/30 text-center">
                                <Layers className="w-12 h-12 text-math-purple/30 mb-4" />
                                <h4 className="font-bold text-lg text-text-primary">No Flashcards Yet</h4>
                                <p className="text-text-secondary mb-4">Add flashcards to help students master key concepts.</p>
                                <div className="flex gap-3">
                                    <Button onClick={onAddFlashcards} variant="outline">
                                        <Plus size={16} className="mr-2" /> Create Manually
                                    </Button>
                                    <Button onClick={onGenerateFlashcards} className="bg-math-purple hover:bg-math-purple/90 text-white">
                                        <Sparkles size={16} className="mr-2" /> Generate with AI
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
};
