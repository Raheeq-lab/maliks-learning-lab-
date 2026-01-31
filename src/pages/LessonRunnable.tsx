import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Play, Pause, SkipForward, ArrowLeft, RotateCcw, Clock,
    BookOpen, PenTool, FileText, Brain, Check, Lock, Globe, File, Layout,
    Sparkles, Zap, AlertCircle, BrainCircuit, Download,
    Plus, Star, Image as ImageIcon
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

    // Interactive State
    const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
    const [userVoted, setUserVoted] = useState(false);
    const [brainstormNotes, setBrainstormNotes] = useState<{ id: string, text: string, color: string }[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [categorizedItems, setCategorizedItems] = useState<Record<string, string[]>>({});
    const [currentLevel, setCurrentLevel] = useState(1);
    const [levelFeedback, setLevelFeedback] = useState<Record<number, { isCorrect: boolean, showHint: boolean }>>({});
    const [exitTicketData, setExitTicketData] = useState({ learnings: ['', '', ''], questions: ['', ''], insight: '' });
    const [confidence, setConfidence] = useState(50);

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
                setIsRunning(currentPhaseKey === 'engage'); // Auto-start for Engage phase
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
                                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Visual Theme Alert */}
                                    {currentPhaseData.visualMetadata.visualTheme && (
                                        <div className="p-6 rounded-3xl bg-gradient-to-br from-math-purple/10 via-math-purple/5 to-transparent border border-math-purple/20 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Sparkles className="w-20 h-20 text-math-purple" />
                                            </div>
                                            <div className="relative z-10 flex items-start gap-4">
                                                <div className="p-3 rounded-2xl bg-math-purple/20 text-math-purple animate-pulse">
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-math-purple/60 mb-1 block">Phase Visual Identity</span>
                                                    <p className="text-xl font-medium tracking-tight leading-snug italic text-math-purple">
                                                        "{currentPhaseData.visualMetadata.visualTheme}"
                                                    </p>
                                                    {currentPhaseData.visualMetadata.animations && (
                                                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-math-purple/50">
                                                            <Zap className="w-3 h-3" />
                                                            {currentPhaseData.visualMetadata.animations}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pedagogical Research Note */}
                                    {(currentPhaseData.visualMetadata.researchHook ||
                                        currentPhaseData.visualMetadata.researchContent ||
                                        currentPhaseData.visualMetadata.researchStrategy ||
                                        currentPhaseData.visualMetadata.researchPractice ||
                                        currentPhaseData.visualMetadata.researchReflection) && (
                                            <div className="p-6 rounded-3xl bg-gradient-to-br from-focus-blue/10 via-focus-blue/5 to-transparent border border-focus-blue/20 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <BrainCircuit className="w-20 h-20 text-focus-blue" />
                                                </div>
                                                <div className="relative z-10 flex items-start gap-4">
                                                    <div className="p-3 rounded-2xl bg-focus-blue/20 text-focus-blue">
                                                        <Brain className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-focus-blue/60 mb-1 block">Pedagogical Research Insight</span>
                                                        <p className="text-lg font-semibold tracking-tight leading-relaxed text-text-primary">
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
                                        )}
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

                            {/* AI Generated Phase Visual */}
                            {currentPhaseData?.visualMetadata?.imageUrl && (
                                <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 bg-bg-secondary/50 p-1 group relative">
                                    <img
                                        src={currentPhaseData.visualMetadata.imageUrl}
                                        alt={currentPhaseData.title}
                                        className="w-full h-auto object-cover rounded-2xl transform transition-transform duration-700 group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                        <p className="text-white text-sm font-medium italic">AI-Generated Visual Concept for {currentPhaseData.title}</p>
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

                                            {/* NEW INTERACTIVE TYPES */}

                                            {/* POLL */}
                                            {content.type === "poll" && (
                                                <div className="space-y-4">
                                                    <h4 className="font-bold text-xl text-text-primary">{content.content}</h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {(content.pollOptions || []).map((option, i) => {
                                                            const votes = pollVotes[option] || 0;
                                                            const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0) || 1;
                                                            const percentage = Math.round((votes / totalVotes) * 100);
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => {
                                                                        if (!userVoted) {
                                                                            setPollVotes(prev => ({ ...prev, [option]: (prev[option] || 0) + 1 }));
                                                                            setUserVoted(true);
                                                                            toast({ title: "Vote Cast!", description: "Your prediction has been recorded." });
                                                                        }
                                                                    }}
                                                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${userVoted ? 'border-border' : 'border-gray-200 hover:border-focus-blue hover:bg-focus-blue/5'}`}
                                                                >
                                                                    {userVoted && (
                                                                        <div
                                                                            className="absolute inset-0 bg-focus-blue/10 transition-all duration-1000"
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    )}
                                                                    <div className="relative flex justify-between items-center">
                                                                        <span className="font-medium text-text-primary">{option}</span>
                                                                        {userVoted && <span className="font-bold text-focus-blue">{percentage}%</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {!userVoted && <p className="text-xs text-text-tertiary text-center italic">Select an option to see class results</p>}
                                                </div>
                                            )}

                                            {/* BRAINSTORM */}
                                            {content.type === "brainstorm" && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-xl text-text-primary">{content.content}</h4>
                                                        <Button
                                                            size="sm"
                                                            className="bg-math-purple hover:bg-math-purple/90"
                                                            onClick={() => {
                                                                const text = prompt("Enter your idea:");
                                                                if (text) {
                                                                    setBrainstormNotes(prev => [...prev, {
                                                                        id: Math.random().toString(),
                                                                        text,
                                                                        color: ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100'][Math.floor(Math.random() * 4)]
                                                                    }]);
                                                                }
                                                            }}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" /> Add Note
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[200px] p-4 bg-bg-secondary/20 rounded-xl border-2 border-dashed border-border">
                                                        {brainstormNotes.map(note => (
                                                            <div key={note.id} className={`${note.color} p-4 rounded-lg shadow-sm transform rotate-${Math.random() > 0.5 ? '1' : '-1'} hover:rotate-0 transition-transform cursor-pointer border border-black/5`}>
                                                                <p className="text-sm font-medium text-gray-800 leading-tight">{note.text}</p>
                                                            </div>
                                                        ))}
                                                        {brainstormNotes.length === 0 && (
                                                            <div className="col-span-full flex items-center justify-center text-text-tertiary italic">
                                                                No ideas shared yet. Be the first!
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* STEPS */}
                                            {content.type === "steps" && (
                                                <div className="space-y-6">
                                                    <h4 className="font-bold text-xl text-text-primary text-center mb-8">{content.content}</h4>
                                                    <div className="relative">
                                                        {/* Connection Line */}
                                                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                                                        <div
                                                            className="absolute top-1/2 left-0 h-1 bg-focus-blue -translate-y-1/2 z-0 transition-all duration-500"
                                                            style={{ width: `${(currentStep / ((content.steps?.length || 1) - 1)) * 100}%` }}
                                                        ></div>

                                                        <div className="relative z-10 flex justify-between">
                                                            {(content.steps || []).map((step, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => setCurrentStep(i)}
                                                                    className={`
                                                                        w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border-4
                                                                        ${i <= currentStep ? 'bg-focus-blue border-focus-blue text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-text-tertiary'}
                                                                    `}
                                                                >
                                                                    {i + 1}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 bg-bg-secondary/30 p-8 rounded-2xl border border-border animate-in fade-in zoom-in-95 duration-500">
                                                        <Badge className="mb-4 bg-focus-blue">Step {currentStep + 1}</Badge>
                                                        <p className="text-xl font-medium text-text-primary leading-relaxed">
                                                            {content.steps?.[currentStep]}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <Button
                                                            variant="outline"
                                                            disabled={currentStep === 0}
                                                            onClick={() => setCurrentStep(prev => prev - 1)}
                                                        >
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            className="bg-focus-blue"
                                                            disabled={currentStep === (content.steps?.length || 1) - 1}
                                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                                        >
                                                            Next Step
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* FLASHCARDS */}
                                            {content.type === "flashcards" && (
                                                <div className="space-y-6">
                                                    <h4 className="font-bold text-xl text-text-primary text-center">{content.content}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {(content.flashcards || []).map((card, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => setFlippedCards(prev => prev.includes(i) ? prev.filter(id => id !== i) : [...prev, i])}
                                                                className="h-48 cursor-pointer perspective-1000 group"
                                                            >
                                                                <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${flippedCards.includes(i) ? 'rotate-y-180' : ''}`}>
                                                                    {/* Front */}
                                                                    <div className="absolute inset-0 backface-hidden bg-bg-card border-2 border-focus-blue/20 rounded-2xl flex items-center justify-center p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                                                        <p className="text-xl font-bold text-focus-blue text-center">{card.front}</p>
                                                                        <Badge className="absolute bottom-4 right-4 bg-focus-blue/10 text-focus-blue border-none">Click to flip</Badge>
                                                                    </div>
                                                                    {/* Back */}
                                                                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-focus-blue text-white rounded-2xl flex items-center justify-center p-6 shadow-xl">
                                                                        <p className="text-lg font-medium text-center leading-relaxed">{card.back}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* CATEGORIZATION */}
                                            {content.type === "categorization" && (
                                                <div className="space-y-6">
                                                    <h4 className="font-bold text-xl text-text-primary">{content.content}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {(content.categorizationGroups || []).map((group, i) => (
                                                            <div key={i} className="space-y-4">
                                                                <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${i === 0 ? 'bg-math-purple/5 border-math-purple/20' : 'bg-ict-orange/5 border-ict-orange/20'}`}>
                                                                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-math-purple' : 'bg-ict-orange'}`}></div>
                                                                    <h5 className="font-bold text-lg text-text-primary">{group.title}</h5>
                                                                </div>
                                                                <div className="min-h-[150px] p-4 bg-bg-secondary/20 rounded-xl border-2 border-dashed border-border flex flex-wrap gap-2">
                                                                    {categorizedItems[group.title]?.map((item, idx) => (
                                                                        <Badge key={idx} className={`${i === 0 ? 'bg-math-purple' : 'bg-ict-orange'} px-4 py-2 text-sm shadow-sm animate-in zoom-in-90`}>{item}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-8 p-6 bg-bg-card border border-border rounded-2xl shadow-inner text-center">
                                                        <h6 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-4">Items to Categorize</h6>
                                                        <div className="flex flex-wrap justify-center gap-3">
                                                            {(content.categorizationGroups || []).flatMap(g => g.items).filter(item => !Object.values(categorizedItems).flat().includes(item)).map((item, idx) => (
                                                                <div key={idx} className="flex gap-1">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-full hover:bg-math-purple hover:text-white hover:border-math-purple transition-all"
                                                                        onClick={() => {
                                                                            const groupTitle = content.categorizationGroups?.[0].title || '';
                                                                            setCategorizedItems(prev => ({ ...prev, [groupTitle]: [...(prev[groupTitle] || []), item] }));
                                                                        }}
                                                                    >
                                                                        {item}
                                                                        <div className="w-2 h-2 rounded-full bg-math-purple ml-2"></div>
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-full hover:bg-ict-orange hover:text-white hover:border-ict-orange transition-all"
                                                                        onClick={() => {
                                                                            const groupTitle = content.categorizationGroups?.[1].title || '';
                                                                            setCategorizedItems(prev => ({ ...prev, [groupTitle]: [...(prev[groupTitle] || []), item] }));
                                                                        }}
                                                                    >
                                                                        <div className="w-2 h-2 rounded-full bg-ict-orange mr-2"></div>
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {(content.categorizationGroups || []).flatMap(g => g.items).filter(item => !Object.values(categorizedItems).flat().includes(item)).length === 0 && (
                                                                <div className="flex items-center gap-2 text-success-green font-bold">
                                                                    <Check size={20} /> All items categorized correctly!
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SCAFFOLDED */}
                                            {content.type === "scaffolded" && (
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center bg-bg-secondary/30 p-4 rounded-xl border border-border">
                                                        <h4 className="font-bold text-xl text-text-primary">Practice Levels</h4>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3].map(level => (
                                                                <div
                                                                    key={level}
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border-2 ${currentLevel === level ? 'bg-math-purple border-math-purple text-white shadow-md' : levelFeedback[level]?.isCorrect ? 'bg-success-green/20 border-success-green text-success-green' : 'bg-white border-gray-200 text-gray-400'}`}
                                                                >
                                                                    {level}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="min-h-[250px] p-8 bg-bg-card rounded-2xl border-2 border-math-purple/10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                                                        {content.scaffoldedLevels?.filter(l => l.level === currentLevel).map((levelData, i) => (
                                                            <div key={i} className="space-y-6">
                                                                <Badge className="bg-math-purple/10 text-math-purple border-none font-bold">Level {currentLevel}: {currentLevel === 1 ? 'Foundation' : currentLevel === 2 ? 'Standard' : 'Challenge'}</Badge>
                                                                <h5 className="text-2xl font-bold text-text-primary leading-tight">{levelData.question}</h5>

                                                                {levelFeedback[currentLevel]?.showHint && levelData.hint && (
                                                                    <div className="p-4 bg-warning-amber-light/20 border border-warning-amber/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                                                        <Zap size={20} className="text-warning-amber mt-1" />
                                                                        <p className="text-text-primary italic"><span className="font-bold">Hint:</span> {levelData.hint}</p>
                                                                    </div>
                                                                )}

                                                                <div className="flex gap-4 pt-4">
                                                                    <Button
                                                                        className="h-12 flex-1 bg-math-purple hover:bg-math-purple/90 shadow-md transform active:scale-95 transition-all"
                                                                        onClick={() => {
                                                                            setLevelFeedback(prev => ({ ...prev, [currentLevel]: { ...prev[currentLevel], isCorrect: true, showHint: false } }));
                                                                            toast({ title: "Correct!", description: `Great work on Level ${currentLevel}!` });
                                                                            if (currentLevel < 3) setTimeout(() => setCurrentLevel(prev => prev + 1), 1500);
                                                                        }}
                                                                    >
                                                                        Verify Solution
                                                                    </Button>
                                                                    {levelData.hint && !levelFeedback[currentLevel]?.showHint && (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-12 px-6 border-warning-amber text-warning-amber hover:bg-warning-amber-light/10"
                                                                            onClick={() => setLevelFeedback(prev => ({ ...prev, [currentLevel]: { ...prev[currentLevel], showHint: true } }))}
                                                                        >
                                                                            Need a Hint?
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {levelFeedback[3]?.isCorrect && (
                                                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in zoom-in-95">
                                                                <div className="bg-success-green/10 p-6 rounded-full text-success-green">
                                                                    <Star size={64} fill="currentColor" />
                                                                </div>
                                                                <h5 className="text-2xl font-bold text-text-primary">Mastery Achieved!</h5>
                                                                <p className="text-text-secondary">You've completed all levels of this challenge.</p>
                                                                <Button variant="ghost" className="text-math-purple font-bold" onClick={() => { setCurrentLevel(1); setLevelFeedback({}); }}>Reset Practice</Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* EXIT TICKET */}
                                            {content.type === "exit-ticket" && (
                                                <div className="space-y-8 p-4">
                                                    <div className="text-center space-y-2">
                                                        <h4 className="font-bold text-3xl text-text-primary">3-2-1 Exit Ticket</h4>
                                                        <p className="text-text-secondary">Reflect on your learning journey today</p>
                                                    </div>

                                                    <div className="space-y-8 max-w-2xl mx-auto">
                                                        {/* 3 Learnings */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-success-green text-white flex items-center justify-center font-bold">3</div>
                                                                <h5 className="font-bold text-lg text-text-primary">Things I learned today</h5>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2 pl-11">
                                                                {[0, 1, 2].map(i => (
                                                                    <input
                                                                        key={i}
                                                                        value={exitTicketData.learnings[i]}
                                                                        onChange={(e) => {
                                                                            const newLearnings = [...exitTicketData.learnings];
                                                                            newLearnings[i] = e.target.value;
                                                                            setExitTicketData(prev => ({ ...prev, learnings: newLearnings }));
                                                                        }}
                                                                        placeholder={`Learning ${i + 1}...`}
                                                                        className="bg-bg-secondary/50 border-b-2 border-border focus:border-success-green outline-none p-2 text-text-primary transition-all rounded-t-lg hover:bg-bg-secondary"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 2 Questions */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-focus-blue text-white flex items-center justify-center font-bold">2</div>
                                                                <h5 className="font-bold text-lg text-text-primary">Questions I still have</h5>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2 pl-11">
                                                                {[0, 1].map(i => (
                                                                    <input
                                                                        key={i}
                                                                        value={exitTicketData.questions[i]}
                                                                        onChange={(e) => {
                                                                            const newQs = [...exitTicketData.questions];
                                                                            newQs[i] = e.target.value;
                                                                            setExitTicketData(prev => ({ ...prev, questions: newQs }));
                                                                        }}
                                                                        placeholder={`Question ${i + 1}...`}
                                                                        className="bg-bg-secondary/50 border-b-2 border-border focus:border-focus-blue outline-none p-2 text-text-primary transition-all rounded-t-lg hover:bg-bg-secondary"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 1 Insight */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-math-purple text-white flex items-center justify-center font-bold">1</div>
                                                                <h5 className="font-bold text-lg text-text-primary">Central discovery or insight</h5>
                                                            </div>
                                                            <div className="pl-11">
                                                                <textarea
                                                                    value={exitTicketData.insight}
                                                                    onChange={(e) => setExitTicketData(prev => ({ ...prev, insight: e.target.value }))}
                                                                    placeholder="My single most important takeaway..."
                                                                    className="w-full bg-bg-secondary/50 border-2 border-border focus:border-math-purple outline-none p-4 rounded-xl text-text-primary h-32 transition-all hover:bg-bg-secondary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Confidence Slider */}
                                                        <div className="space-y-4 pt-4 border-t border-border">
                                                            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-widest">
                                                                <span>Not Confident</span>
                                                                <span className="text-math-purple bg-math-purple/10 px-3 py-1 rounded-full">Level: {confidence}%</span>
                                                                <span>Total Mastery</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={confidence}
                                                                onChange={(e) => setConfidence(parseInt(e.target.value))}
                                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-math-purple"
                                                            />
                                                            <p className="text-center text-lg font-bold text-text-primary animate-pulse">
                                                                {confidence < 30 ? "😰 I need more help!" : confidence < 70 ? "💪 I'm getting there!" : "🚀 I've got this!"}
                                                            </p>
                                                        </div>

                                                        <Button
                                                            className="w-full h-14 text-lg font-bold bg-success-green hover:bg-success-green/90 text-white shadow-lg shadow-green-900/10 rounded-2xl"
                                                            onClick={() => toast({ title: "Reflection Shared!", description: "Your exit ticket has been sent to the teacher." })}
                                                        >
                                                            Finalize Lesson & Submit
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* UNIVERSAL ENGAGE */}
                                            {content.type === "universal-engage" && (
                                                <div className="space-y-8 rounded-xl overflow-hidden border border-border shadow-lg bg-white">
                                                    {/* Header */}
                                                    <div className="bg-[#FF6B35] p-6 text-white flex justify-between items-center">
                                                        <h2 className="text-2xl font-bold tracking-tight">🎯 ENGAGE - First 5 Minutes</h2>
                                                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                                                            <Clock size={20} className="animate-pulse" />
                                                            <span className="font-mono text-xl font-bold">{timeLeft > 0 ? formattedTime() : "0:00"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 space-y-12">
                                                        {/* Section 1: Visual Hook */}
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                            <h3 className="text-xl font-bold text-[#FF6B35] flex items-center gap-2">
                                                                <span className="bg-[#FF6B35] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                                                Step 1: Grab Attention with an Image
                                                            </h3>
                                                            <p className="text-lg font-medium text-text-primary">"Upload a puzzling picture related to your topic here:"</p>

                                                            <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group cursor-pointer hover:bg-gray-50 transition-colors">
                                                                {content.universalEngage?.visualHookImage ? (
                                                                    <img src={content.universalEngage.visualHookImage} alt="Hook" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-center p-6">
                                                                        <ImageIcon size={48} className="mx-auto text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
                                                                        <p className="text-text-tertiary">Click to upload visual hook</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="bg-[#FF6B35]/10 p-4 rounded-lg text-sm text-text-secondary border-l-4 border-[#FF6B35]">
                                                                <span className="font-bold text-[#FF6B35]">Teacher Tip:</span> Download an image showing something incomplete, mysterious, or counterintuitive about your topic. Examples: for science - an unexpected experiment result; for math - a visual pattern; for history - an artifact; for language - a word puzzle.
                                                            </div>
                                                        </div>

                                                        {/* Section 2: Notice & Wonder */}
                                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                                            <h3 className="text-xl font-bold text-[#FF6B35] flex items-center gap-2">
                                                                <span className="bg-[#FF6B35] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                                                Step 2: What do you Notice? What do you Wonder?
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-2">
                                                                    <label className="font-bold text-text-primary">Students: Type your observations here:</label>
                                                                    <textarea className="w-full p-4 rounded-lg bg-gray-50 border border-border focus:border-[#FF6B35] h-32 resize-none transition-all" placeholder="I notice..." />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="font-bold text-text-primary">Students: What questions does this raise?</label>
                                                                    <textarea className="w-full p-4 rounded-lg bg-gray-50 border border-border focus:border-[#FF6B35] h-32 resize-none transition-all" placeholder="I wonder..." />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Section 3: Personal Connection */}
                                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                                            <h3 className="text-xl font-bold text-[#FF6B35] flex items-center gap-2">
                                                                <span className="bg-[#FF6B35] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                                                Step 3: Personal Connection Poll
                                                            </h3>
                                                            <p className="text-lg font-medium text-text-primary">"{content.universalEngage?.pollQuestion || "How does this relate to your experience?"}"</p>
                                                            <div className="space-y-3">
                                                                {(content.universalEngage?.pollOptions || ["I've seen something like this before", "This reminds me of...", "This is completely new to me"]).map((option, idx) => (
                                                                    <div key={idx} className="relative p-4 rounded-lg border border-gray-200 hover:border-[#FF6B35] cursor-pointer group bg-gray-50 hover:bg-[#FF6B35]/5 transition-all">
                                                                        <div className="flex justify-between relative z-10">
                                                                            <span className="font-medium text-text-primary group-hover:text-[#FF6B35] transition-colors">{option}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Section 4: Prediction */}
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                                            <h3 className="text-xl font-bold text-[#FF6B35] flex items-center gap-2">
                                                                <span className="bg-[#FF6B35] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                                                                Step 4: Make a Prediction
                                                            </h3>
                                                            <div className="space-y-2">
                                                                <label className="font-bold text-text-primary flex items-center gap-2">
                                                                    <Sparkles size={16} className="text-[#FF6B35]" />
                                                                    Based on this image and our discussion, predict what we'll learn today:
                                                                </label>
                                                                <textarea className="w-full p-4 rounded-lg bg-gray-50 border border-border focus:border-[#FF6B35] h-24 resize-none transition-all" placeholder="My prediction is..." />
                                                            </div>
                                                        </div>

                                                        {/* Section 5: Question Harvest */}
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                                                            <h3 className="text-xl font-bold text-[#FF6B35] flex items-center gap-2">
                                                                <span className="bg-[#FF6B35] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                                                                Step 5: Your Burning Question
                                                            </h3>
                                                            <div className="bg-[#FF6B35]/5 p-6 rounded-xl border border-[#FF6B35]/20">
                                                                <label className="font-bold text-lg text-text-primary block mb-3">What's the one question you most want answered today?</label>
                                                                <div className="flex gap-2">
                                                                    <input className="flex-1 p-4 rounded-lg border border-border focus:border-[#FF6B35] outline-none shadow-sm" placeholder="My burning question..." />
                                                                    <Button className="bg-[#FF6B35] hover:bg-[#E55A25] text-white h-auto px-6 font-bold">Ask!</Button>
                                                                </div>
                                                                <p className="text-sm text-[#FF6B35] mt-3 font-medium italic">"These questions will guide our lesson!"</p>
                                                            </div>
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

                        {/* Research Lab - Lesson-Level Guidance */}
                        {lesson?.researchNotes && (
                            <div className="mx-6 mb-6 p-4 bg-math-purple/5 border border-math-purple/10 rounded-xl animate-in fade-in duration-1000">
                                <div className="flex items-center gap-2 mb-3">
                                    <BrainCircuit size={18} className="text-math-purple" />
                                    <h4 className="text-sm font-bold text-math-purple uppercase tracking-wider">Research Foundation Lab</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {lesson.researchNotes.strategies && lesson.researchNotes.strategies.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-normal flex items-center gap-1">
                                                <Zap size={10} /> Teaching Strategies
                                            </span>
                                            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                                                {lesson.researchNotes.strategies.map((s: string, i: number) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {lesson.researchNotes.realWorldConnections && lesson.researchNotes.realWorldConnections.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-normal flex items-center gap-1">
                                                <Globe size={10} /> Real-World Context
                                            </span>
                                            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                                                {lesson.researchNotes.realWorldConnections.map((c: string, i: number) => (
                                                    <li key={i}>{c}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {lesson.worksheetContent && (
                                    <div className="mt-4 pt-4 border-t border-math-purple/10 flex justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const element = document.createElement("a");
                                                const file = new Blob([lesson.worksheetContent || ''], { type: 'text/markdown' });
                                                element.href = URL.createObjectURL(file);
                                                element.download = `Worksheet_${lesson.title.replace(/\s+/g, '_')}.md`;
                                                document.body.appendChild(element);
                                                element.click();
                                            }}
                                            className="bg-white border-math-purple text-math-purple hover:bg-math-purple/10 font-bold"
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Download AI Worksheet
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                </Card>
            </div >
        </div >
    );
};

export default LessonRunnable;
