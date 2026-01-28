import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, ArrowLeft, RotateCcw, Clock } from "lucide-react";
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
        if (currentPhaseIndex < PHASES.length - 1) {
            setCurrentPhaseIndex(prev => prev + 1);
        } else {
            toast({ title: "Lesson Complete!", description: "Great job!" });
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

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading Lesson...</div>;
    }

    if (!lesson || !lesson.lessonStructure) {
        return <div className="h-screen flex items-center justify-center">Lesson data not valid.</div>;
    }

    const currentPhaseKey = PHASES[currentPhaseIndex];
    const currentPhaseData = lesson.lessonStructure[currentPhaseKey];
    const phaseTitle = currentPhaseData?.title || currentPhaseKey.toUpperCase();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/teacher-dashboard')}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{lesson.title}</h1>
                        <p className="text-sm text-gray-500">Grade {lesson.gradeLevel} • {lesson.subject}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-black text-white px-4 py-2 rounded-md font-mono text-xl font-bold flex items-center gap-2">
                        <Clock size={20} />
                        {formattedTime()}
                    </div>
                    <Button
                        variant={isRunning ? "secondary" : "default"}
                        onClick={handleToggleTimer}
                        className={isRunning ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-600 hover:bg-green-700"}
                    >
                        {isRunning ? <><Pause className="mr-2" size={16} /> Pause</> : <><Play className="mr-2" size={16} /> Start</>}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleResetTimer}>
                        <RotateCcw size={16} />
                    </Button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Phase Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <h3 className="font-semibold text-gray-700 mb-4">Lesson Phases</h3>
                            {PHASES.map((phase, idx) => {
                                const isActive = idx === currentPhaseIndex;
                                const isCompleted = idx < currentPhaseIndex;
                                const pData = lesson.lessonStructure?.[phase];

                                return (
                                    <div
                                        key={phase}
                                        onClick={() => !isActive && setCurrentPhaseIndex(idx)}
                                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors
                       ${isActive ? 'bg-purple-100 border border-purple-200' : isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-white border hover:bg-gray-50'}
                     `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                         ${isActive ? 'bg-purple-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                       `}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${isActive ? 'text-purple-900' : ''}`}>{pData?.title || phase}</p>
                                                <p className="text-xs text-gray-500">{pData?.timeInMinutes} mins</p>
                                            </div>
                                        </div>
                                        {isActive && isRunning && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Active Phase Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Phase Progress</span>
                            <span>{Math.round(getProgress())}%</span>
                        </div>
                        <Progress value={getProgress()} className="h-2" />
                    </div>

                    <Card className="min-h-[500px] flex flex-col">
                        <div className="p-6 border-b bg-gray-50">
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Current Phase</span>
                            <h2 className="text-3xl font-bold mt-1">{phaseTitle}</h2>
                        </div>
                        <CardContent className="flex-1 p-8 text-lg leading-relaxed text-gray-800">
                            {currentPhaseData?.content ? (
                                <div className="space-y-6">
                                    {Array.isArray(currentPhaseData.content) ? (
                                        currentPhaseData.content.map((block, i) => (
                                            <div key={i} className="p-4 bg-white border rounded-lg shadow-sm">
                                                {block.type === 'text' && <p>{block.content}</p>}
                                                {/* Add logic for other types if needed */}
                                            </div>
                                        ))
                                    ) : (
                                        <p>No content available for this phase.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 italic mt-20">
                                    No content activities defined for this phase.
                                </div>
                            )}
                        </CardContent>
                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <Button variant="ghost" disabled={currentPhaseIndex === 0} onClick={() => setCurrentPhaseIndex(prev => prev - 1)}>
                                Previous Phase
                            </Button>
                            <Button onClick={handleNextPhase} className="bg-purple-600 hover:bg-purple-700">
                                Next Phase <SkipForward size={16} className="ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default LessonRunnable;
