import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Play, Pause, SkipForward, ArrowLeft, RotateCcw, Clock,
    BookOpen, PenTool, FileText, Brain, Check, Lock, Globe, File, Layout,
    Sparkles, Zap, AlertCircle, BrainCircuit
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { Lesson, LessonStructure } from '@/types/quiz';

const PHASES = ['engage', 'model', 'guidedPractice', 'independentPractice', 'reflect'] as const;

const LessonRunnable: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [completedPhases, setCompletedPhases] = useState<number[]>([]);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [totalPhaseTime, setTotalPhaseTime] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchLesson();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isRunning && timeLeft > 0) {
            intervalId = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning]);

    // When phase changes, set the new time
    useEffect(() => {
        if (lesson?.lessonStructure) {
            const currentPhaseKey = PHASES[currentPhaseIndex];
            const phaseData = lesson.lessonStructure[currentPhaseKey];
            if (phaseData) {
                const timeInSeconds = (phaseData.timeInMinutes || 5) * 60;
                setTotalPhaseTime(timeInSeconds);
                setTimeLeft(timeInSeconds);
                setIsRunning(false); // Auto-pause on phase switch
            }
        }
    }, [currentPhaseIndex, lesson]);

    const fetchLesson = async () => {
        try {
            if (!id) return;
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Map snake_case to camelCase manually since we found issues before
            const mappedLesson: Lesson = {
                ...data,
                gradeLevel: data.grade_level || data.gradelevel,
                learningType: data.learning_type,
                lessonStructure: data.lesson_structure || data.lessonstructure,
                researchNotes: data.research_notes || data.researchnotes,
                visualTheme: data.visual_theme || data.visualtheme,
                assessmentSettings: data.assessment_settings || data.assessmentsettings,
                requiredResources: data.required_resources || data.requiredresources,
                accessCode: data.access_code,
                createdBy: data.created_by,
            };

            setLesson(mappedLesson);
        } catch (error: any) {
            console.error('Error loading lesson:', error);
            toast({ title: "Error", description: "Failed to load lesson", variant: "destructive" });
            navigate('/teacher-dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTimer = () => {
        if (timeLeft > 0) {
            setIsRunning(!isRunning);
        }
    };

    const handleResetTimer = () => {
        setIsRunning(false);
        setTimeLeft(totalPhaseTime);
    };

    const handleNextPhase = () => {
        if (!completedPhases.includes(currentPhaseIndex)) {
            setCompletedPhases([...completedPhases, currentPhaseIndex]);
        }

        if (currentPhaseIndex < PHASES.length - 1) {
            setCurrentPhaseIndex(prev => prev + 1);
        } else {
            toast({ title: "Lesson Complete!", description: "Great job completing the lesson!" });
        }
    };

    const formattedTime = () => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        if (totalPhaseTime === 0) return 0;
        return 100 - ((timeLeft / totalPhaseTime) * 100);
    };

    // Updated Phase Colors with Color Psychology Variables
    const getPhaseColorDetails = (phase: keyof LessonStructure) => {
        switch (phase) {
            case "engage": return {
                bg: "bg-math-purple",
                text: "text-white",
                lightBg: "bg-math-purple/10",
                border: "border-math-purple",
                iconColor: "text-math-purple"
            };
            case "model": return {
                bg: "bg-focus-blue",
                text: "text-white",
                lightBg: "bg-focus-blue/10",
                border: "border-focus-blue",
                iconColor: "text-focus-blue"
            };
            case "guidedPractice": return {
                bg: "bg-[hsl(var(--progress-middle))]",
                text: "text-white",
                lightBg: "bg-[hsl(var(--progress-middle))]/10",
                border: "border-[hsl(var(--progress-middle))]",
                iconColor: "text-[hsl(var(--progress-middle))]"
            };
            case "independentPractice": return {
                bg: "bg-ict-orange",
                text: "text-white",
                lightBg: "bg-ict-orange/10",
                border: "border-ict-orange",
                iconColor: "text-ict-orange"
            };
            case "reflect": return {
                bg: "bg-success-green",
                text: "text-white",
                lightBg: "bg-success-green/10",
                border: "border-success-green",
                iconColor: "text-success-greenless"
            };
            default: return {
                bg: "bg-gray-500",
                text: "text-white",
                lightBg: "bg-gray-100",
                border: "border-gray-500",
                iconColor: "text-gray-500"
            };
        }
    };

    const phaseNames: Record<keyof LessonStructure, string> = {
        engage: "Engage",
        model: "Learn",
        guidedPractice: "Practice Together",
        independentPractice: "Try It Yourself",
        reflect: "Think About It"
    };

    const phaseIcons: Record<keyof LessonStructure, React.ReactNode> = {
        engage: <Play size={18} />,
        model: <BookOpen size={18} />,
        guidedPractice: <PenTool size={18} />,
        independentPractice: <FileText size={18} />,
        reflect: <Brain size={18} />
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-bg-primary">Loading Lesson...</div>;
    }

    if (!lesson || !lesson.lessonStructure) {
        return <div className="h-screen flex items-center justify-center bg-bg-primary">Lesson data not valid.</div>;
    }

    const currentPhaseKey = PHASES[currentPhaseIndex];
    const currentPhaseData = lesson.lessonStructure[currentPhaseKey];
    const phaseColors = getPhaseColorDetails(currentPhaseKey);

    // Calculate total lesson time
    const totalLessonTime = Object.values(lesson.lessonStructure).reduce(
        (total, phase) => total + (phase.timeInMinutes || 0), 0
    );

    return (
        <div className="min-h-screen bg-bg-primary p-6 transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary" onClick={() => navigate('/teacher-dashboard')}>
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className={`bg-bg-card border-border border px-4 py-2 rounded-lg font-mono text-lg font-bold flex items-center gap-2 shadow-sm transition-all ${timeLeft < 60 ? 'border-warning-amber bg-warning-amber-light/20' : ''}`}>
                            <Clock size={18} className={timeLeft < 60 ? "text-warning-amber animate-pulse" : "text-focus-blue"} />
                            <span className={timeLeft < 60 ? "text-warning-amber animate-pulse" : "text-text-primary"}>
                                {formattedTime()}
                            </span>
                        </div>
                        <Button
                            onClick={handleToggleTimer}
                            className={`shadow-md transition-all duration-300 ${isRunning ? "bg-warning-amber-light text-warning-amber hover:bg-warning-amber-light/80" : "bg-success-green hover:bg-[#059669] text-white"}`}
                        >
                            {isRunning ? <><Pause className="mr-2" size={16} /> Pause</> : <><Play className="mr-2" size={16} /> Start</>}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleResetTimer} className="hover:bg-bg-card-hover text-text-secondary">
                            <RotateCcw size={16} />
                        </Button>
                    </div>
                </div>

                {/* Main Lesson Card */}
                <Card className="border-0 shadow-lg overflow-hidden bg-bg-card rounded-xl">
                    {/* Gradient Header - Using Math Purple / Branding Color */}
                    <CardHeader className={`bg-gradient-to-r ${lesson.subject === 'math' ? 'from-math-purple to-purple-600' : lesson.subject === 'english' ? 'from-english-green to-teal-600' : 'from-ict-orange to-orange-600'} text-white pb-8`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl font-poppins font-bold tracking-tight mb-2">{lesson.title}</CardTitle>
                                <div className="flex items-center gap-3 opacity-90 text-sm">
                                    <Badge variant="outline" className="bg-white/20 text-white border-white/20 hover:bg-white/30 px-3 py-1">
                                        Grade {lesson.gradeLevel}
                                    </Badge>
                                    <span className="font-medium bg-white/20 px-2 py-0.5 rounded text-xs uppercase tracking-wider">{lesson.subject}</span>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-white/20 text-white border-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                                <Clock size={16} className="mr-2" /> {totalLessonTime} min Total
                            </Badge>
                        </div>
                    </CardHeader>

                    {/* Phase Navigation Bar - Floated up to overlap header */}
                    <div className="px-6 -mt-6 mb-2">
                        <div className="bg-bg-card rounded-xl shadow-md p-2 border border-border flex flex-wrap md:flex-nowrap justify-between gap-2 overflow-x-auto">
                            {PHASES.map((phase, index) => {
                                const pColors = getPhaseColorDetails(phase);
                                const isActive = index === currentPhaseIndex;
                                const isCompleted = completedPhases.includes(index) || index < currentPhaseIndex;

                                return (
                                    <div
                                        key={phase}
                                        onClick={() => setCurrentPhaseIndex(index)}
                                        className={`
                                            cursor-pointer flex-1 min-w-[100px] rounded-lg border-l-4 transition-all duration-300 relative overflow-hidden group
                                            ${isActive
                                                ? `${pColors.border} bg-bg-card shadow-md transform scale-105 z-10 ring-1 ring-border`
                                                : isCompleted
                                                    ? 'border-success-green bg-success-green-light/30 opacity-90 hover:opacity-100 hover:scale-102'
                                                    : 'border-transparent bg-bg-secondary opacity-60 hover:opacity-100 hover:scale-102'
                                            } 
                                        `}
                                    >
                                        <div className="p-3 flex flex-col items-center justify-center text-center h-full">
                                            <div className={`
                                                flex items-center justify-center w-8 h-8 rounded-full mb-1 transition-colors
                                                ${isActive ? pColors.bg + ' text-white' : isCompleted ? 'bg-success-green text-white' : 'bg-gray-200 text-gray-400 group-hover:bg-gray-300'}
                                            `}>
                                                {isCompleted && !isActive ? <Check size={16} strokeWidth={3} /> : phaseIcons[phase]}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                {phaseNames[phase]}
                                            </span>
                                            <span className="text-xs font-medium text-text-tertiary">
                                                {lesson.lessonStructure?.[phase].timeInMinutes} min
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overall Progress - Gradient Bar */}
                        <div className="mt-6 px-2 flex items-center gap-4">
                            <span className="text-xs font-bold text-focus-blue uppercase tracking-wide">Lesson Progress</span>
                            <div className="h-3 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-progress-start via-progress-middle to-progress-end transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${((currentPhaseIndex) / PHASES.length) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-bold text-success-green">{Math.round(((currentPhaseIndex) / PHASES.length) * 100)}%</span>
                        </div>
                    </div>

                    {/* Active Phase Content */}
                    <div className={`
                        min-h-[500px] p-6 pt-2 transition-all duration-700
                        ${currentPhaseData?.visualMetadata?.visualTheme ? 'bg-bg-secondary/40 ring-1 ring-math-purple/10' : 'bg-bg-secondary/30'}
                    `}>
                        {/* Phase Specific Title */}
                        <div className={`mb-6 flex items-center gap-3 pb-4 border-b border-gray-100`}>
                            <div className={`p-2.5 rounded-lg ${phaseColors.bg} text-white shadow-sm`}>
                                {phaseIcons[currentPhaseKey]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">{phaseNames[currentPhaseKey]}</h2>
                                <p className="text-text-secondary text-sm">Focus time: {currentPhaseData?.timeInMinutes} minutes</p>
                            </div>

                            <div className="ml-auto w-1/3 max-w-[200px]">
                                <div className="flex justify-between text-xs mb-1 font-medium text-text-secondary">
                                    <span>Phase Time</span>
                                    <span className={timeLeft < 60 ? "text-error-coral" : ""}>{formattedTime()} left</span>
                                </div>
                                <Progress
                                    value={getProgress()}
                                    className="h-2 bg-gray-200"
                                    indicatorClassName={timeLeft < 60 ? "bg-warning-amber" : "bg-focus-blue"}
                                />
                            </div>
                        </div>

                        <CardContent className="p-0">
                            {/* Phase-Level Metadata & Research Insights */}
                            {currentPhaseData?.visualMetadata && (
                                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Visual Theme Callout */}
                                        <div className="bg-bg-card p-4 rounded-xl border border-border shadow-sm flex items-start gap-3">
                                            <div className="bg-math-purple/10 p-2 rounded-lg text-math-purple">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase text-math-purple tracking-widest mb-1">Active Visual Theme</h4>
                                                <p className="text-sm font-semibold text-text-primary capitalize">
                                                    {currentPhaseData.visualMetadata.visualTheme || "Classic Lab Layout"}
                                                </p>
                                                {currentPhaseData.visualMetadata.animations && (
                                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-text-tertiary">
                                                        <Zap size={10} className="text-warning-amber" />
                                                        <span>FX: {currentPhaseData.visualMetadata.animations}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pedagogical Research Insight */}
                                        <div className="bg-bg-card p-4 rounded-xl border border-focus-blue/30 shadow-sm flex items-start gap-3 border-l-4 border-l-focus-blue">
                                            <div className="bg-focus-blue/10 p-2 rounded-lg text-focus-blue">
                                                <BrainCircuit size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase text-focus-blue tracking-widest mb-1">Phase Research Insight</h4>
                                                <p className="text-sm text-text-secondary italic leading-relaxed">
                                                    {currentPhaseData.visualMetadata.researchHook ||
                                                        currentPhaseData.visualMetadata.researchContent ||
                                                        currentPhaseData.visualMetadata.researchStrategy ||
                                                        currentPhaseData.visualMetadata.researchPractice ||
                                                        currentPhaseData.visualMetadata.researchReflection ||
                                                        "Standard pedagogical delivery."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Misconception Alert */}
                            {currentPhaseData?.visualMetadata?.misconceptionAddressed && (
                                <div className="mb-6 bg-error-coral/5 border border-error-coral/20 p-4 rounded-xl flex items-center gap-3">
                                    <div className="bg-error-coral/10 p-2 rounded-lg text-error-coral">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-error-coral tracking-widest mb-1">Misconception Alert</h4>
                                        <p className="text-sm text-text-primary font-medium">{currentPhaseData.visualMetadata.misconceptionAddressed}</p>
                                    </div>
                                </div>
                            )}

                            {currentPhaseData?.content && currentPhaseData.content.length > 0 ? (
                                <div className="space-y-8">
                                    {currentPhaseData.content.map((content, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                                relative bg-bg-card p-8 rounded-2xl shadow-sm border border-border transition-all hover:shadow-md
                                                border-l-[6px] ${phaseColors.border}
                                            `}
                                        >
                                            {/* Type Badge */}
                                            <div className="absolute top-4 right-4">
                                                <Badge variant="secondary" className="bg-bg-secondary text-text-secondary hover:bg-bg-secondary cursor-default">
                                                    {content.type}
                                                </Badge>
                                            </div>

                                            {/* TEXT CONTENT */}
                                            {content.type === "text" && (
                                                <div className="prose prose-lg max-w-none text-text-primary leading-relaxed">
                                                    {content.content}
                                                </div>
                                            )}

                                            {/* IMAGE CONTENT */}
                                            {content.type === "image" && content.imageUrl && (
                                                <div className="space-y-4">
                                                    <div className="rounded-xl overflow-hidden border border-gray-100 bg-bg-secondary/50 p-2">
                                                        <img
                                                            src={content.imageUrl}
                                                            alt={content.content || "Lesson image"}
                                                            className="max-h-[500px] w-auto mx-auto object-contain rounded-lg"
                                                        />
                                                    </div>
                                                    {content.content && (
                                                        <p className="text-center text-text-secondary italic text-lg bg-bg-secondary/30 py-2 rounded-lg">
                                                            {content.content}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* VIDEO CONTENT */}
                                            {content.type === "video" && (
                                                <div className="space-y-4">
                                                    <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-900 aspect-video flex items-center justify-center">
                                                        <div className="absolute inset-0 opacity-60 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center"></div>
                                                        <div className="relative z-10 bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                                            <Play size={40} className="text-white fill-white ml-2" />
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                            <p className="text-white font-bold truncate">{content.fileName || "Video Resource"}</p>
                                                        </div>
                                                    </div>
                                                    {content.content && <p className="text-text-primary text-lg">{content.content}</p>}
                                                </div>
                                            )}

                                            {/* QUIZ CONTENT */}
                                            {content.type === "quiz" && (
                                                <div className="space-y-6">
                                                    <div className="flex items-start gap-4">
                                                        <span className={`bg-focus-blue-light text-focus-blue-darker px-3 py-1 rounded-md text-sm font-bold uppercase mt-1 tracking-wide`}>
                                                            Question
                                                        </span>
                                                        <p className="font-semibold text-xl text-text-primary">{content.content}</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {(content.quizQuestions?.[0]?.options || ["Option A", "Option B", "Option C", "Option D"]).map((option, i) => (
                                                            <div
                                                                key={i}
                                                                className={`
                                                                    flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group
                                                                    hover:border-focus-blue hover:bg-focus-blue-light/50 border-gray-200
                                                                `}
                                                            >
                                                                <div className={`
                                                                    h-10 w-10 rounded-full flex items-center justify-center border-2 text-lg font-bold transition-colors
                                                                    bg-white border-gray-300 text-gray-500 group-hover:border-focus-blue group-hover:text-focus-blue
                                                                `}>
                                                                    {String.fromCharCode(65 + i)}
                                                                </div>
                                                                <span className="text-text-primary text-lg font-medium group-hover:text-focus-blue-darker">{option}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ACTIVITY CONTENT */}
                                            {content.type === "activity" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="bg-ict-orange/10 p-2 rounded-lg">
                                                            <Layout className="text-ict-orange" size={24} />
                                                        </div>
                                                        <h4 className="font-bold text-xl text-text-primary">Classroom Activity</h4>
                                                    </div>
                                                    <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100 text-text-primary text-lg leading-relaxed">
                                                        {content.content}
                                                    </div>
                                                    {content.aiToolUsed && (
                                                        <div className="flex items-center gap-2 text-sm text-focus-blue-dark bg-focus-blue-light/50 px-4 py-2 rounded-full w-fit">
                                                            <Globe size={16} />
                                                            <span className="font-medium">Supported by {content.aiToolUsed}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* FILE/RESOURCE CONTENT */}
                                            {(content.type === "file" || content.type === "resource") && (
                                                <div className="flex items-start gap-5 p-6 bg-bg-secondary/50 border border-border rounded-xl hover:bg-bg-secondary transition-colors">
                                                    <div className="bg-bg-card p-3 rounded-xl shadow-sm border border-border">
                                                        <File className="text-focus-blue" size={28} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-text-primary">{content.fileName || "Attached Resource"}</h4>
                                                        <p className="text-text-secondary mt-1">{content.content || "Downloadable content for this lesson."}</p>
                                                        <div className="mt-4 flex gap-3">
                                                            {content.fileUrl && (
                                                                <a href={content.fileUrl} download className="inline-flex items-center px-4 py-2 bg-focus-blue hover:bg-focus-blue-dark text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                                                                    Download File
                                                                </a>
                                                            )}
                                                            {(!content.fileUrl && content.resourceUrl) && (
                                                                <a href={content.resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-text-primary rounded-lg text-sm font-semibold transition-colors">
                                                                    Open Resource
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-bg-card rounded-2xl border border-dashed border-border">
                                    <div className="bg-bg-secondary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-text-tertiary">
                                        <Layout size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-text-secondary">No content added yet</h3>
                                    <p className="text-text-tertiary mt-2">Check the Lesson Builder to add activities for this phase.</p>
                                </div>
                            )}
                        </CardContent>

                        {/* Footer Navigation */}
                        <CardFooter className="p-6 mt-6 bg-bg-card border-t border-border rounded-b-xl flex justify-between items-center sticky bottom-0 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (currentPhaseIndex > 0) setCurrentPhaseIndex(prev => prev - 1);
                                }}
                                disabled={currentPhaseIndex === 0}
                                className="w-36 h-11 text-text-secondary hover:text-text-primary hover:bg-bg-secondary border-gray-300"
                            >
                                <ArrowLeft size={18} className="mr-2" /> Previous
                            </Button>

                            <div className="hidden md:flex gap-2">
                                {completedPhases.length > 0 && (
                                    <Badge className="bg-warning-amber hover:bg-warning-amber text-white border-0 px-4 py-1.5 text-sm cursor-default shadow-sm">
                                        +{completedPhases.length * 10} XP Earned
                                    </Badge>
                                )}
                            </div>

                            <Button
                                onClick={handleNextPhase}
                                className={`w-36 h-11 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg ${lesson.subject === 'math' ? 'bg-math-purple hover:bg-purple-700' : lesson.subject === 'english' ? 'bg-english-green hover:bg-green-700' : 'bg-ict-orange hover:bg-orange-600'}`}
                            >
                                {currentPhaseIndex === PHASES.length - 1 ? "Finish" : "Next Phase"}
                                {currentPhaseIndex < PHASES.length - 1 && <SkipForward size={18} className="ml-2" />}
                            </Button>
                        </CardFooter>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LessonRunnable;
