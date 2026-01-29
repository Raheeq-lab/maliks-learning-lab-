import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Play, Pause, SkipForward, ArrowLeft, RotateCcw, Clock,
    BookOpen, PenTool, FileText, Brain, Check, Lock, Globe, File, Layout
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
                accessCode: data.access_code,
                createdBy: data.created_by,
            };

            setLesson(mappedLesson);
        } catch (error: any) {
            console.error('Error loading lesson:', error);
            toast({ title: "Error", description: "Failed to load lesson", variant: "destructive" });
            navigate('/teacher/dashboard');
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

    const getPhaseColor = (phase: keyof LessonStructure) => {
        switch (phase) {
            case "engage": return "bg-blue-500 text-white";
            case "model": return "bg-purple-500 text-white";
            case "guidedPractice": return "bg-green-500 text-white";
            case "independentPractice": return "bg-orange-500 text-white";
            case "reflect": return "bg-pink-500 text-white";
            default: return "bg-gray-500 text-white";
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
        return <div className="h-screen flex items-center justify-center">Loading Lesson...</div>;
    }

    if (!lesson || !lesson.lessonStructure) {
        return <div className="h-screen flex items-center justify-center">Lesson data not valid.</div>;
    }

    const currentPhaseKey = PHASES[currentPhaseIndex];
    const currentPhaseData = lesson.lessonStructure[currentPhaseKey];

    // Calculate total lesson time
    const totalLessonTime = Object.values(lesson.lessonStructure).reduce(
        (total, phase) => total + (phase.timeInMinutes || 0), 0
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2" onClick={() => navigate('/teacher/dashboard')}>
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white border px-4 py-2 rounded-lg font-mono text-lg font-bold flex items-center gap-2 shadow-sm">
                            <Clock size={18} className="text-gray-500" />
                            <span className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-gray-900"}>
                                {formattedTime()}
                            </span>
                        </div>
                        <Button
                            variant={isRunning ? "secondary" : "default"}
                            onClick={handleToggleTimer}
                            className={isRunning ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-600 hover:bg-green-700 shadow-md"}
                        >
                            {isRunning ? <><Pause className="mr-2" size={16} /> Pause</> : <><Play className="mr-2" size={16} /> Start</>}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleResetTimer}>
                            <RotateCcw size={16} />
                        </Button>
                    </div>
                </div>

                {/* Main Lesson Card */}
                <Card className="border-2 border-blue-300 shadow-lg overflow-hidden">
                    {/* Gradient Header */}
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-poppins">{lesson.title}</CardTitle>
                                <p className="opacity-90 text-sm mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/20 text-white border-white/10 hover:bg-white/30">
                                        Grade {lesson.gradeLevel}
                                    </Badge>
                                    <span>•</span>
                                    <span>{lesson.topic || lesson.subject}</span>
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-white/20 text-white border-white/10 px-3 py-1 text-sm font-medium">
                                <Clock size={14} className="mr-2" /> {totalLessonTime} min Total
                            </Badge>
                        </div>
                    </CardHeader>

                    {/* Phase Navigation Bar */}
                    <div className="p-4 bg-white border-b">
                        <div className="flex flex-wrap md:flex-nowrap justify-between gap-2 overflow-x-auto pb-2 md:pb-0">
                            {PHASES.map((phase, index) => (
                                <div
                                    key={phase}
                                    onClick={() => setCurrentPhaseIndex(index)}
                                    className={`
                                        cursor-pointer flex-1 min-w-[100px] rounded-lg border transition-all duration-200
                                        ${index === currentPhaseIndex
                                            ? 'border-2 border-blue-500 shadow-md transform scale-105 z-10'
                                            : 'border-gray-200 hover:border-blue-300 opacity-80 hover:opacity-100'
                                        } 
                                        ${index < currentPhaseIndex ? 'bg-gray-50' : 'bg-white'}
                                    `}
                                >
                                    <div className={`rounded-t-md p-2 flex justify-center items-center gap-1.5 ${getPhaseColor(phase)}`}>
                                        {phaseIcons[phase]}
                                        <span className="text-xs font-bold uppercase tracking-wide">{phaseNames[phase]}</span>
                                    </div>
                                    <div className="p-2 text-center text-xs space-y-1">
                                        <div className="font-semibold text-gray-700">
                                            {lesson.lessonStructure?.[phase].timeInMinutes} min
                                        </div>
                                        {completedPhases.includes(index) || index < currentPhaseIndex ? (
                                            <div className="flex justify-center text-green-500">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="h-3.5"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overall Progress */}
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Lesson Progress</span>
                            <Progress value={((currentPhaseIndex) / PHASES.length) * 100} className="h-2 flex-1" />
                            <span className="text-xs font-medium text-gray-500">{Math.round(((currentPhaseIndex) / PHASES.length) * 100)}%</span>
                        </div>
                    </div>

                    {/* Active Phase Content */}
                    <div className="bg-gray-50/50 min-h-[400px]">
                        {/* Phase Specific Header */}
                        <div className={`px-6 py-3 border-b flex justify-between items-center ${getPhaseColor(currentPhaseKey)} bg-opacity-10 !text-gray-800`}>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className={`p-1.5 rounded-full ${getPhaseColor(currentPhaseKey)}`}>
                                    {phaseIcons[currentPhaseKey]}
                                </span>
                                {phaseNames[currentPhaseKey]} Phase
                            </h2>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span>Phase Timer:</span>
                                <Progress value={getProgress()} className="w-24 h-2.5 bg-gray-200" indicatorClassName={timeLeft < 60 ? "bg-red-500" : "bg-blue-600"} />
                            </div>
                        </div>

                        <CardContent className="p-8">
                            {currentPhaseData?.content && currentPhaseData.content.length > 0 ? (
                                <div className="space-y-6">
                                    {currentPhaseData.content.map((content, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">

                                            {/* TEXT CONTENT */}
                                            {content.type === "text" && (
                                                <div className="prose max-w-none text-gray-800 leading-relaxed text-lg">
                                                    {content.content}
                                                </div>
                                            )}

                                            {/* IMAGE CONTENT */}
                                            {content.type === "image" && content.imageUrl && (
                                                <div className="space-y-3">
                                                    <div className="rounded-lg overflow-hidden border bg-gray-50">
                                                        <img
                                                            src={content.imageUrl}
                                                            alt={content.content || "Lesson image"}
                                                            className="max-h-[400px] w-auto mx-auto object-contain"
                                                        />
                                                    </div>
                                                    {content.content && (
                                                        <p className="text-center text-gray-600 italic border-l-4 border-blue-400 pl-3 py-1 bg-blue-50 rounded-r">
                                                            {content.content}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* VIDEO CONTENT */}
                                            {content.type === "video" && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg text-white">
                                                        <div className="bg-red-600 p-2 rounded-full">
                                                            <Play size={24} fill="white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-lg">{content.fileName || "Video Resource"}</p>
                                                            <p className="text-gray-400 text-sm">Click to play video</p>
                                                        </div>
                                                    </div>
                                                    {content.content && <p className="text-gray-700">{content.content}</p>}
                                                </div>
                                            )}

                                            {/* QUIZ CONTENT */}
                                            {content.type === "quiz" && (
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-bold uppercase mt-1">Question</span>
                                                        <p className="font-medium text-lg text-gray-900">{content.content}</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-4">
                                                        {(content.quizQuestions?.[0]?.options || ["Option A", "Option B", "Option C", "Option D"]).map((option, i) => (
                                                            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors group">
                                                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 border border-gray-300 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-colors font-bold">
                                                                    {String.fromCharCode(65 + i)}
                                                                </div>
                                                                <span className="text-gray-700 group-hover:text-purple-900">{option}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ACTIVITY CONTENT */}
                                            {content.type === "activity" && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Layout className="text-orange-500" size={20} />
                                                        <h4 className="font-bold text-gray-800">Classroom Activity</h4>
                                                    </div>
                                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-gray-800">
                                                        {content.content}
                                                    </div>
                                                    {content.aiToolUsed && (
                                                        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full w-fit">
                                                            <Globe size={12} />
                                                            <span>Supported by {content.aiToolUsed}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* FILE/RESOURCE CONTENT */}
                                            {(content.type === "file" || content.type === "resource") && (
                                                <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <div className="bg-blue-100 p-2 rounded-lg">
                                                        <File className="text-blue-600" size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900">{content.fileName || "Attached Resource"}</h4>
                                                        <p className="text-gray-600 text-sm mt-1">{content.content || "Downloadable content for this lesson."}</p>
                                                        {content.fileUrl && (
                                                            <a href={content.fileUrl} download className="inline-flex items-center mt-3 text-sm font-bold text-blue-600 hover:underline">
                                                                Download File
                                                            </a>
                                                        )}
                                                        {(!content.fileUrl && content.resourceUrl) && (
                                                            <a href={content.resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center mt-3 text-sm font-bold text-blue-600 hover:underline">
                                                                Open Resource
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Layout size={40} />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-400">No content added for this phase yet.</h3>
                                    <p className="text-gray-400 mt-2">Check the Lesson Builder to add activities.</p>
                                </div>
                            )}
                        </CardContent>

                        {/* Footer Navigation */}
                        <CardFooter className="p-6 bg-white border-t flex justify-between items-center sticky bottom-0 z-10">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (currentPhaseIndex > 0) setCurrentPhaseIndex(prev => prev - 1);
                                }}
                                disabled={currentPhaseIndex === 0}
                                className="w-32"
                            >
                                <ArrowLeft size={16} className="mr-2" /> Previous
                            </Button>

                            <div className="hidden md:flex gap-2">
                                {completedPhases.length > 0 && (
                                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white cursor-default">
                                        +{completedPhases.length * 10} XP Earned
                                    </Badge>
                                )}
                            </div>

                            <Button
                                onClick={handleNextPhase}
                                className="w-32 bg-purple-600 hover:bg-purple-700"
                            >
                                {currentPhaseIndex === PHASES.length - 1 ? "Finish" : "Next Phase"}
                                {currentPhaseIndex < PHASES.length - 1 && <SkipForward size={16} className="ml-2" />}
                            </Button>
                        </CardFooter>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LessonRunnable;
