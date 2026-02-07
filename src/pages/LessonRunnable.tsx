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
    Plus, Star, Image as ImageIcon, MoreHorizontal, CheckSquare, Loader2, Eye,
    Lightbulb, Trophy
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { QuizQuestion as GeminiQuizQuestion } from "@/utils/geminiAI";
import { CarouselActivity } from "@/components/teacher/CarouselActivity";
import { Lesson, LessonStructure, Flashcard, FlashcardSet } from '@/types/quiz';
import FlashcardModal from '@/components/teacher/FlashcardModal';
import { generateFlashcards } from '@/utils/geminiAI';
import { generateContent, AIConfig } from "@/services/aiService";
import { CollaborativeMap } from '@/components/teacher/CollaborativeMap';
import { PresentationActivity } from '@/components/teacher/PresentationActivity';
import ThemeToggle from '@/components/ThemeToggle';
import { InstructionalActivity } from '@/components/teacher/InstructionalActivity';
import { useAuth } from '@/context/AuthContext';
import AccessCodeCard from '@/components/AccessCodeCard';


const PHASES = ['engage', 'model', 'guidedPractice', 'independentPractice', 'reflect'] as const;

const LessonRunnable: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [completedPhases, setCompletedPhases] = useState<number[]>([]);

    // Flashcard Modal State for Instructional Activity
    const [flashcardModalState, setFlashcardModalState] = useState<{
        isOpen: boolean;
        initialData: FlashcardSet | null;
    }>({ isOpen: false, initialData: null });
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

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
    const [universalEngageResponses, setUniversalEngageResponses] = useState({ notice: '', wonder: '', prediction: '', question: '' });
    const [exitTicketData, setExitTicketData] = useState({ learnings: ['', '', ''], questions: ['', ''], insight: '' });
    const [confidence, setConfidence] = useState(50);
    const [generatingImage, setGeneratingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scaffoldedImageInputRef = useRef<HTMLInputElement>(null);
    const [targetLevelForUpload, setTargetLevelForUpload] = useState<number | null>(null);

    // Live Quiz Session State
    const [liveQuizSession, setLiveQuizSession] = useState<{ id: string, accessCode: string } | null>(null);
    const [isLaunchingQuiz, setIsLaunchingQuiz] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [lessonQuizzes, setLessonQuizzes] = useState<any[]>([]); // Store quizzes linked to this lesson

    const carouselStationsFromContent = React.useMemo(() => {
        if (!lesson?.lessonStructure) return [];
        const currentPhaseKey = PHASES[currentPhaseIndex];
        const phaseData = lesson.lessonStructure[currentPhaseKey];
        if (!phaseData?.content) return [];

        const stations: any[] = [];
        const seenStations = new Set();

        phaseData.content.forEach(c => {
            if (c.type === 'carousel' && c.carouselStations) {
                c.carouselStations.forEach((s: any) => {
                    if (!seenStations.has(s.station.toUpperCase())) {
                        stations.push(s);
                        seenStations.add(s.station.toUpperCase());
                    }
                });
            } else if (c.content?.trim().startsWith('{') && c.content.includes('"station"')) {
                try {
                    const parsed = JSON.parse(c.content.trim());
                    if (parsed.station && (parsed.task || parsed.description) && !seenStations.has(parsed.station.toUpperCase())) {
                        stations.push({
                            station: parsed.station,
                            task: parsed.task || parsed.description,
                            content: parsed.content || parsed.prompt || ""
                        });
                        seenStations.add(parsed.station.toUpperCase());
                    }
                } catch (e) { }
            }
        });
        return stations;
    }, [currentPhaseIndex, lesson]);

    const scaffoldedLevelsFromContent = React.useMemo(() => {
        if (!lesson?.lessonStructure) return [];
        const currentPhaseKey = PHASES[currentPhaseIndex];
        const phaseData = lesson.lessonStructure[currentPhaseKey];
        if (!phaseData?.content) return [];

        const levels: any[] = [];
        const seenLevels = new Set();

        phaseData.content.forEach((c, blockIdx) => {
            const blockId = (c as any).id || `block-${blockIdx}`;
            if (c.type === 'scaffolded' && c.scaffoldedLevels) {
                c.scaffoldedLevels.forEach((l: any, lvlIdx: number) => {
                    if (!seenLevels.has(l.level)) {
                        levels.push({ ...l, blockId, lvlIdx, blockIdx });
                        seenLevels.add(l.level);
                    }
                });
            } else if (c.content?.trim().startsWith('{') && (c.content.includes('"level"') || c.content.includes('"question"'))) {
                try {
                    const parsed = JSON.parse(c.content.trim());
                    // Only treat as scaffolded level if it actually has a level property
                    if (parsed.level && parsed.question && !seenLevels.has(parsed.level)) {
                        levels.push({
                            level: parsed.level,
                            question: parsed.question,
                            hint: parsed.hint || "",
                            solution: parsed.solution || parsed.answer || "",
                            imageUrl: parsed.imageUrl || "",
                            blockId,
                            blockIdx,
                            isJson: true
                        });
                        seenLevels.add(parsed.level);
                    }
                } catch (e) { }
            }
        });

        return levels.sort((a, b) => a.level - b.level);
    }, [currentPhaseIndex, lesson]);

    const reflectionPromptsFromContent = React.useMemo(() => {
        if (!lesson?.lessonStructure) return [];
        const currentPhaseKey = PHASES[currentPhaseIndex];
        const phaseData = lesson.lessonStructure[currentPhaseKey];
        if (!phaseData?.content) return [];

        const prompts: any[] = [];
        const seenPrompts = new Set();

        phaseData.content.forEach(c => {
            if (c.type === 'text' && c.content?.trim().startsWith('{') && c.content.includes('"prompt"')) {
                try {
                    const parsed = JSON.parse(c.content.trim());
                    if (parsed.prompt && !seenPrompts.has(parsed.prompt)) {
                        prompts.push({
                            prompt: parsed.prompt,
                            response: parsed.response || parsed.expectedResponse || "Write your reflection here..."
                        });
                        seenPrompts.add(parsed.prompt);
                    }
                } catch (e) { }
            }
        });

        return prompts;
    }, [currentPhaseIndex, lesson]);


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

    const handleLaunchLiveQuiz = async (questions: any[]) => {
        if (!lesson || isLaunchingQuiz) return;

        setIsLaunchingQuiz(true);
        try {
            const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 1. Create a new Quiz entry in 'quizzes' table
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .insert([{
                    title: `${lesson.title} - Live`,
                    description: `Live session from lesson: ${lesson.title}`,
                    grade_level: lesson.gradeLevel,
                    subject: lesson.subject,
                    time_limit: 600,
                    access_code: accessCode,
                    created_by: lesson.createdBy,
                    questions: questions,
                    is_public: true,
                    is_live_session: true,
                    live_status: 'waiting'
                }])
                .select()
                .single();

            if (quizError) throw quizError;

            setLiveQuizSession({
                id: quizData.id,
                accessCode: quizData.access_code
            });

            toast({
                title: "Quiz Live!",
                description: `Students can join with code: ${quizData.access_code}`,
            });

        } catch (error) {
            console.error("Failed to launch live quiz:", error);
            toast({
                title: "Launch Failed",
                description: "Could not start the live session.",
                variant: "destructive"
            });
        } finally {
            setIsLaunchingQuiz(false);
        }
    };

    const handleToggleLiveQuiz = async (quizId: string, enable: boolean) => {
        try {
            if (enable) {
                // Start live session
                const { data, error } = await supabase
                    .from('quizzes')
                    .update({ is_live_session: true, live_status: 'active' })
                    .eq('id', quizId)
                    .select()
                    .single();

                if (error) throw error;

                setLiveQuizSession({
                    id: data.id,
                    accessCode: data.access_code
                });

                toast({
                    title: "Quiz Live!",
                    description: `Students can join with code: ${data.access_code}`,
                });
            } else {
                // End live session
                const { error } = await supabase
                    .from('quizzes')
                    .update({ is_live_session: false, live_status: 'completed' })
                    .eq('id', quizId);

                if (error) throw error;

                setLiveQuizSession(null);

                toast({
                    title: "Session Ended",
                    description: "Live quiz session has been closed.",
                });
            }
        } catch (error) {
            console.error("Failed to toggle live quiz:", error);
            toast({
                title: "Action Failed",
                description: "Could not update quiz session.",
                variant: "destructive"
            });
        }
    };

    const handleCreateQuizInline = async () => {
        if (!lesson || isGeneratingQuiz) return;

        const apiKey = localStorage.getItem('aiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            toast({
                title: "API Key Required",
                description: "Configure in Settings first.",
                variant: "destructive"
            });
            return;
        }

        setIsGeneratingQuiz(true);
        const config: AIConfig = { provider: 'gemini', apiKey };
        const prompt = `Create a 5-question multiple choice quiz about "${lesson.topic || lesson.title}" for Grade ${lesson.gradeLevel}. 
        Return ONLY a JSON object with a "questions" array. 
        Each question must have: "text", "options" (array of 4 strings), and "correctOptionIndex" (0-3).
        
        CRITICAL: Ensure the JSON is strictly valid. No trailing commas. No text outside the JSON object.
        Format: { "questions": [{ "text": "...", "options": ["...", "...", "...", "..."], "correctOptionIndex": 0 }] }`;

        try {
            // Using 'quiz' type enables official JSON mode in aiService
            const response = await generateContent(config, prompt, 'quiz');
            if (response.error) throw new Error(response.error);

            const data = JSON.parse(response.content);
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid format from AI");
            }

            const questions = data.questions.map((q: any) => ({
                id: `q-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                text: q.text || q.question || "Untitled Question",
                options: q.options || ["", "", "", ""],
                correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : parseInt(q.correctOptionIndex) || 0
            }));

            // Generate unique access code
            const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Create quiz in database (not in lesson structure)
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .insert([{
                    title: `${lesson.title} - Try It Yourself Quiz`,
                    description: `Practice quiz for ${lesson.title}`,
                    grade_level: lesson.gradeLevel,
                    subject: lesson.subject,
                    time_limit: 600,
                    access_code: accessCode,
                    created_by: lesson.createdBy,
                    questions: questions,
                    is_public: true,
                    is_live_session: false,
                    lesson_id: lesson.id // Link to lesson
                }])
                .select()
                .single();

            if (quizError) throw quizError;

            // Add quiz reference to lesson structure
            const currentPhaseKey = PHASES[currentPhaseIndex];
            const updatedStructure = { ...lesson.lessonStructure };
            const currentPhaseData = updatedStructure[currentPhaseKey] || { content: [] };
            const phaseContent = [...(currentPhaseData.content || [])];

            phaseContent.push({
                id: `quiz-${Date.now()}`,
                type: 'quiz',
                content: 'Interactive Quiz',
                quizId: quizData.id,
                quizQuestions: questions
            });

            updatedStructure[currentPhaseKey] = {
                ...currentPhaseData,
                content: phaseContent
            };

            // Update lesson structure
            const { error } = await supabase
                .from('lessons')
                .update({ lesson_structure: updatedStructure })
                .eq('id', id);

            if (error) throw error;

            setLesson({
                ...lesson,
                lessonStructure: updatedStructure
            });

            // Add to lesson quizzes list
            setLessonQuizzes(prev => [...prev, quizData]);

            toast({
                title: "Quiz Created!",
                description: `Access Code: ${accessCode}`,
            });

        } catch (error: any) {
            console.error("Failed to create quiz inline:", error);
            toast({
                title: "Generation Failed",
                description: "AI returned malformed data. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleEditQuiz = async (quizId: string) => {
        // Navigate to quiz edit page or open modal
        navigate(`/teacher-dashboard?tab=quizzes&edit=${quizId}`);
    };

    const handleDeleteQuiz = async (quizId: string) => {
        try {
            // Delete from database
            const { error } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizId);

            if (error) throw error;

            // Remove from lesson structure
            const currentPhaseKey = PHASES[currentPhaseIndex];
            const updatedStructure = { ...lesson!.lessonStructure };
            const currentPhaseData = updatedStructure[currentPhaseKey] || { content: [] };
            const phaseContent = (currentPhaseData.content || []).filter(c => c.quizId !== quizId);

            updatedStructure[currentPhaseKey] = {
                ...currentPhaseData,
                content: phaseContent
            };

            // Update lesson
            await supabase
                .from('lessons')
                .update({ lesson_structure: updatedStructure })
                .eq('id', id);

            setLesson({
                ...lesson!,
                lessonStructure: updatedStructure
            });

            toast({
                title: "Quiz Deleted",
                description: "Quiz has been removed from this lesson.",
            });

        } catch (error) {
            console.error("Failed to delete quiz:", error);
            toast({
                title: "Delete Failed",
                description: "Could not delete quiz.",
                variant: "destructive"
            });
        }
    };

    const handleCopyQuizCode = (quizTitle: string, accessCode: string) => {
        navigator.clipboard.writeText(accessCode);
        toast({
            title: "Code Copied!",
            description: `Access code for "${quizTitle}" copied to clipboard.`,
        });
    };

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

            // Fetch quizzes linked to this lesson
            const { data: quizzesData, error: quizzesError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('lesson_id', id);

            if (!quizzesError && quizzesData) {
                setLessonQuizzes(quizzesData);
            }

        } catch (error: any) {
            console.error('Error loading lesson:', error);
            toast({ title: "Error", description: "Failed to load lesson", variant: "destructive" });
            navigate('/teacher-dashboard');
        } finally {
            setLoading(false);
        }
    };

    const updateUniversalEngageImage = async (imageUrl: string) => {
        if (!lesson) return;

        // Optimistic update
        const updatedLesson = { ...lesson };
        if (updatedLesson.lessonStructure?.engage?.content) {
            const engageContent = updatedLesson.lessonStructure.engage.content as any[];
            const universalBlock = engageContent.find(c => c.type === 'universal-engage');
            if (universalBlock) {
                if (!universalBlock.universalEngage) universalBlock.universalEngage = {};
                universalBlock.universalEngage.visualHookImage = imageUrl;
            }
        }
        setLesson(updatedLesson);

        // Persist to DB
        try {
            const { error } = await supabase
                .from('lessons')
                .update({ lesson_structure: updatedLesson.lessonStructure })
                .eq('id', lesson.id);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to save image update:", error);
            toast({ title: "Save Failed", description: "Could not persist image change.", variant: "destructive" });
        }
    };

    const handleScaffoldedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !lesson || targetLevelForUpload === null) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Image must be under 5MB", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;

            // Find which block and which level to update
            const currentPhaseKey = PHASES[currentPhaseIndex];
            const updatedLesson = { ...lesson };
            const phaseData = updatedLesson.lessonStructure[currentPhaseKey];

            if (!phaseData?.content) return;

            // Find the level data in scaffoldedLevelsFromContent to get its blockIdx and lvlIdx
            const levelData = scaffoldedLevelsFromContent.find(l => l.level === targetLevelForUpload);
            if (!levelData) return;

            const { blockIdx, lvlIdx, isJson } = levelData;
            const contentBlock = phaseData.content[blockIdx];

            if (contentBlock.type === 'scaffolded' && contentBlock.scaffoldedLevels && !isJson) {
                // Specialized block update
                contentBlock.scaffoldedLevels[lvlIdx].imageUrl = base64;
            } else if (isJson || (contentBlock.content?.trim().startsWith('{'))) {
                // JSON block update - need to parse, update, and re-stringify
                try {
                    const parsed = JSON.parse(contentBlock.content || "{}");
                    parsed.imageUrl = base64;
                    contentBlock.content = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    console.error("Failed to parse/update JSON block:", e);
                }
            }

            setLesson(updatedLesson);
            const savedLevel = targetLevelForUpload;
            setTargetLevelForUpload(null);

            // Persist
            try {
                const { error } = await supabase
                    .from('lessons')
                    .update({ lesson_structure: updatedLesson.lessonStructure })
                    .eq('id', lesson.id);

                if (error) throw error;
                toast({ title: "Image Updated", description: `Added photo to Level ${savedLevel}` });
            } catch (err) {
                console.error("Failed to save image:", err);
                toast({ title: "Save Failed", description: "Image updated locally, but failed to save to server.", variant: "destructive" });
            }
        };
        reader.readAsDataURL(file);
    };

    const updateInstructionalContent = async (file: File) => {
        if (!lesson) return;

        // Convert file to Base64 (for now - in real app would upload to Storage)
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;

            // Optimistic update
            const updatedLesson = { ...lesson };
            // Find the instructional block in the current phase content
            // Note: This assumes we are in the 'learn' phase mostly, but we should search correctly.
            // But since this function is passed TO the component which is rendered inside the map, 
            // we actually need to know WHICH block invoked it.
            // A better way is to pass a specialized handler to the mapped item.
            // But for simplicity, we will search in the 'learn' (model) phase first.

            const learnPhase = updatedLesson.lessonStructure?.model || (updatedLesson.lessonStructure as any)?.learn;
            if (learnPhase?.content) {
                const instructionalBlock = (learnPhase.content as any[]).find(c => c.type === 'instructional');
                if (instructionalBlock) {
                    if (!instructionalBlock.instructional) instructionalBlock.instructional = {};
                    instructionalBlock.instructional.customContent = {
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        url: base64,
                        name: file.name
                    };
                }
            }

            setLesson(updatedLesson);

            // Persist
            try {
                const { error } = await supabase
                    .from('lessons')
                    .update({ lesson_structure: updatedLesson.lessonStructure })
                    .eq('id', lesson.id);

                if (error) throw error;
                toast({ title: "Custom Material Uploaded", description: "Your custom content has been saved." });
            } catch (error) {
                console.error("Failed to save instructional update:", error);
                toast({ title: "Save Failed", description: "Could not persist change.", variant: "destructive" });
            }
        };
        reader.readAsDataURL(file);
    };

    // --- Flashcard Handlers for Instructional Activity ---

    const handleManualFlashcards = () => {
        if (!lesson) return;

        // Find existing flashcards in the instructional block
        const learnPhase = lesson.lessonStructure?.model || (lesson.lessonStructure as any)?.learn;
        const instructionalBlock = (learnPhase?.content as any[])?.find(c => c.type === 'instructional');
        const existingFlashcards = instructionalBlock?.instructional?.flashcards || [];

        // Create a temporary FlashcardSet wrapper for the modal
        const tempSet: FlashcardSet = {
            id: 'temp-instructional-set',
            title: `${lesson.topic || lesson.title} - Key Concepts`,
            description: "Flashcards generated for the instructional phase.",
            gradeLevel: lesson.gradeLevel,
            subject: lesson.subject,
            cards: existingFlashcards.length > 0 ? existingFlashcards : [],
            accessCode: '',
            createdBy: '',
            createdAt: new Date().toISOString()
        };

        setFlashcardModalState({
            isOpen: true,
            initialData: tempSet
        });
    };

    const handleSaveFlashcards = async (flashcardSet: FlashcardSet) => {
        if (!lesson) return;

        const updatedLesson = { ...lesson };
        const learnPhase = updatedLesson.lessonStructure?.model || (updatedLesson.lessonStructure as any)?.learn;

        if (learnPhase?.content) {
            const instructionalBlock = (learnPhase.content as any[]).find(c => c.type === 'instructional');
            if (instructionalBlock) {
                if (!instructionalBlock.instructional) instructionalBlock.instructional = {};

                // Update or add flashcards
                instructionalBlock.instructional.flashcards = flashcardSet.cards;
            }
        }

        setLesson(updatedLesson);
        setFlashcardModalState({ isOpen: false, initialData: null });

        // Persist
        try {
            const { error } = await supabase
                .from('lessons')
                .update({ lesson_structure: updatedLesson.lessonStructure })
                .eq('id', lesson.id);

            if (error) throw error;
            toast({ title: "Flashcards Saved", description: "Your instructional flashcards have been updated." });
        } catch (error) {
            console.error("Failed to save flashcards:", error);
            toast({ title: "Save Failed", description: "Could not persist flashcards.", variant: "destructive" });
        }
    };

    const handleAIFlashcards = async () => {
        if (!lesson) return;

        setIsGeneratingFlashcards(true);
        try {
            const cards = await generateFlashcards(
                lesson.subject,
                lesson.gradeLevel.toString(),
                lesson.topic || lesson.title,
                6 // Generate 6 cards by default
            );

            // Assign IDs
            const cardsWithIds: Flashcard[] = cards.map(c => ({
                id: crypto.randomUUID(),
                front: c.front,
                back: c.back
            }));

            // Update Lesson
            const updatedLesson = { ...lesson };
            const learnPhase = updatedLesson.lessonStructure?.model || (updatedLesson.lessonStructure as any)?.learn;

            if (learnPhase?.content) {
                const instructionalBlock = (learnPhase.content as any[]).find(c => c.type === 'instructional');
                if (instructionalBlock) {
                    if (!instructionalBlock.instructional) instructionalBlock.instructional = {};
                    instructionalBlock.instructional.flashcards = cardsWithIds;
                }
            }

            setLesson(updatedLesson);

            // Persist
            const { error } = await supabase
                .from('lessons')
                .update({ lesson_structure: updatedLesson.lessonStructure })
                .eq('id', lesson.id);

            if (error) throw error;
            toast({ title: "Flashcards Generated!", description: "AI has created flashcards for this lesson." });

        } catch (error) {
            console.error("AI Flashcard generation failed:", error);
            toast({ title: "Generation Failed", description: "Could not generate flashcards.", variant: "destructive" });
        } finally {
            setIsGeneratingFlashcards(false);
        }
    };
    const handleAIForgeImage = async () => {
        const apiKey = localStorage.getItem('aiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            toast({ title: "API Key Required", description: "Please configure your API key settings.", variant: "destructive" });
            return;
        }

        setGeneratingImage(true);
        try {
            const config: AIConfig = { provider: 'gemini', apiKey };
            const topic = lesson?.topic || "science";
            const imagePrompt = lesson?.lessonStructure?.engage?.visualMetadata?.imagePrompt || `Educational illustration for ${topic}`;

            const forgePrompt = `Subject: ${lesson?.subject || "general"}\nTopic: ${topic}\nGrade Level: ${lesson?.gradeLevel || "all"}\nTarget Image: ${imagePrompt}\n\nProvide a high-quality, professional educational image URL link (Unsplash preferred). \nIf you cannot find a specific high-res ID, provide a keyword-based fallback URL in this format: https://images.unsplash.com/photo-1?auto=format&fit=crop&q=80&w=1080&q=[KEYWORDS]\n\nRETURN ONLY THE URL starting with http.`;
            const response = await generateContent(config, forgePrompt, 'text');

            const content = response.content.trim();
            // Match any URL starting with http/https up to the first space, quote, or bracket
            const urlMatch = content.match(/https?:\/\/[^\s"'>\])]+/);
            let imageUrl = urlMatch ? urlMatch[0] : null;

            // Fallback: If AI returned keywords instead of a full photo ID in the URL, reform it
            if (imageUrl && (imageUrl.includes('keywords=') || imageUrl.includes('search='))) {
                const keywords = imageUrl.split('=').pop() || topic;
                imageUrl = `https://source.unsplash.com/featured/1600x900?${keywords}`;
            }

            if (imageUrl) {
                await updateUniversalEngageImage(imageUrl);
                toast({ title: "Image Generated", description: "Visual hook updated successfully!" });
            } else {
                console.error("Failed to extract URL from response:", content);
                // Last ditch effort: constructive fallback
                const fallbackUrl = `https://source.unsplash.com/featured/1600x900?${topic.replace(/\s+/g, ',')},education`;
                await updateUniversalEngageImage(fallbackUrl);
                toast({ title: "Forge Note", description: "Used a general topic image as fallback." });
            }
        } catch (error) {
            toast({ title: "Error", description: "AI Forge encountered an error.", variant: "destructive" });
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Image must be under 5MB", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateUniversalEngageImage(base64);
        };
        reader.readAsDataURL(file);
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
    // detailed mapping for AI generation (camelCase keys) vs internal keys
    const phaseKeyMap: Record<string, string> = {
        'model': 'learn',
        'guidedPractice': 'practiceTogether',
        'independentPractice': 'tryItYourself',
        'reflect': 'thinkAboutIt'
    };
    const currentPhaseData = lesson.lessonStructure[currentPhaseKey] || lesson.lessonStructure[phaseKeyMap[currentPhaseKey]];
    const phaseColors = getPhaseColorDetails(currentPhaseKey);

    // Calculate total lesson time
    const totalLessonTime = Object.values(lesson.lessonStructure).reduce(
        (total, phase) => total + (phase.timeInMinutes || 0), 0
    );



    return (
        <div className="min-h-screen bg-bg-page p-6 transition-colors duration-300"> {/* Fixed background class */}
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="gap-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary" onClick={() => navigate('/teacher-dashboard')}>
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle /> {/* Added ThemeToggle */}

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
                            <div className="space-y-10">
                                {/* 1. Carousel Activity */}
                                {((PHASES[currentPhaseIndex] === 'guidedPractice' && carouselStationsFromContent.length > 0) || currentPhaseData?.activityType === "carousel") && (
                                    <CarouselActivity
                                        stations={carouselStationsFromContent.length > 0 ? carouselStationsFromContent : (currentPhaseData?.content?.find((c) => c.type === 'carousel')?.carouselStations || [])}
                                        topic={lesson?.topic || lesson?.title || "Lesson Topic"}
                                    />
                                )}

                                {/* 2. Scaffolded Levels */}
                                {((PHASES[currentPhaseIndex] === 'independentPractice' && scaffoldedLevelsFromContent.length > 0) || currentPhaseData?.activityType === "scaffolded") && (
                                    <div className="space-y-6 p-8">
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
                                            {scaffoldedLevelsFromContent.length > 0 ? (
                                                scaffoldedLevelsFromContent.filter(l => l.level === currentLevel).map((levelData, i) => (
                                                    <div key={i} className="space-y-6">
                                                        <Badge className="bg-math-purple/10 text-math-purple border-none font-bold">Level {currentLevel}: {currentLevel === 1 ? 'Foundation' : currentLevel === 2 ? 'Standard' : 'Challenge'}</Badge>
                                                        {levelData.imageUrl ? (
                                                            <div className="relative group rounded-xl overflow-hidden border border-gray-100 bg-bg-secondary/50 p-2">
                                                                <img
                                                                    src={levelData.imageUrl}
                                                                    alt={`Level ${levelData.level} visual`}
                                                                    className="max-h-[300px] w-auto mx-auto object-contain rounded-lg"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="bg-white/90 text-math-purple hover:bg-white font-bold"
                                                                        onClick={() => {
                                                                            setTargetLevelForUpload(currentLevel);
                                                                            setTimeout(() => scaffoldedImageInputRef.current?.click(), 100);
                                                                        }}
                                                                    >
                                                                        <ImageIcon size={16} className="mr-2" />
                                                                        Change Photo
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 hover:bg-bg-secondary/50 transition-all">
                                                                <div className="bg-bg-secondary p-3 rounded-full text-text-tertiary">
                                                                    <ImageIcon size={32} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-text-secondary">No visual prompt for Level {currentLevel}</p>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="mt-2 text-math-purple hover:bg-math-purple/10 font-bold"
                                                                        onClick={() => {
                                                                            setTargetLevelForUpload(currentLevel);
                                                                            setTimeout(() => scaffoldedImageInputRef.current?.click(), 100);
                                                                        }}
                                                                    >
                                                                        <Plus size={16} className="mr-1" />
                                                                        Add Photo
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <h5 className="text-2xl font-bold text-text-primary leading-tight">{levelData.question}</h5>

                                                        {levelFeedback[currentLevel]?.showHint && levelData.hint && (
                                                            <div className="p-4 bg-warning-amber-light/20 border border-warning-amber/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                                                <Zap size={20} className="text-warning-amber mt-1" />
                                                                <p className="text-text-primary italic"><span className="font-bold">Hint:</span> {levelData.hint}</p>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-4 pt-4">
                                                            <Button
                                                                className="h-12 flex-1 bg-math-purple hover:bg-math-purple/90 shadow-md transform active:scale-95 transition-all text-white"
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
                                                ))
                                            ) : (
                                                currentPhaseData?.content?.filter(c => c.type === 'scaffolded').flatMap(c => c.scaffoldedLevels || []).filter(l => l.level === currentLevel).map((levelData, i) => (
                                                    <div key={i} className="space-y-6">
                                                        <Badge className="bg-math-purple/10 text-math-purple border-none font-bold">Level {currentLevel}: {currentLevel === 1 ? 'Foundation' : currentLevel === 2 ? 'Standard' : 'Challenge'}</Badge>
                                                        {levelData.imageUrl ? (
                                                            <div className="relative group rounded-xl overflow-hidden border border-gray-100 bg-bg-secondary/50 p-2">
                                                                <img
                                                                    src={levelData.imageUrl}
                                                                    alt={`Level ${levelData.level} visual`}
                                                                    className="max-h-[300px] w-auto mx-auto object-contain rounded-lg"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="bg-white/90 text-math-purple hover:bg-white font-bold"
                                                                        onClick={() => {
                                                                            setTargetLevelForUpload(currentLevel);
                                                                            setTimeout(() => scaffoldedImageInputRef.current?.click(), 100);
                                                                        }}
                                                                    >
                                                                        <ImageIcon size={16} className="mr-2" />
                                                                        Change Photo
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 hover:bg-bg-secondary/50 transition-all">
                                                                <div className="bg-bg-secondary p-3 rounded-full text-text-tertiary">
                                                                    <ImageIcon size={32} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-text-secondary">No visual prompt for Level {currentLevel}</p>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="mt-2 text-math-purple hover:bg-math-purple/10 font-bold"
                                                                        onClick={() => {
                                                                            setTargetLevelForUpload(currentLevel);
                                                                            setTimeout(() => scaffoldedImageInputRef.current?.click(), 100);
                                                                        }}
                                                                    >
                                                                        <Plus size={16} className="mr-1" />
                                                                        Add Photo
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <h5 className="text-2xl font-bold text-text-primary leading-tight">{levelData.question}</h5>

                                                        {levelFeedback[currentLevel]?.showHint && levelData.hint && (
                                                            <div className="p-4 bg-warning-amber-light/20 border border-warning-amber/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                                                <Zap size={20} className="text-warning-amber mt-1" />
                                                                <p className="text-text-primary italic"><span className="font-bold">Hint:</span> {levelData.hint}</p>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-4 pt-4">
                                                            <Button
                                                                className="h-12 flex-1 bg-math-purple hover:bg-math-purple/90 shadow-md transform active:scale-95 transition-all text-white"
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
                                                ))
                                            )}
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

                                {/* 3. Collaborative Map */}
                                {currentPhaseData?.activityType === "collaborative-map" && (
                                    <div className="animate-in fade-in duration-700">
                                        <div className="bg-bg-secondary p-4 rounded-xl mb-4 border border-border">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-focus-blue/10 p-2 rounded-lg text-focus-blue">
                                                    <BrainCircuit size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-text-primary">Collaborative Concept Mapping</h3>
                                                    <p className="text-text-secondary text-sm">
                                                        "Let's build a map of what we know about <strong>{lesson?.topic || lesson?.title}</strong>.
                                                        We'll start with key ideas, then draw connections, add examples, and finally note our questions."
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <CollaborativeMap topic={lesson?.topic || lesson?.title || "Lesson Topic"} />
                                    </div>
                                )}

                                {/* 4. Reflection Prompts */}
                                {(PHASES[currentPhaseIndex] === 'reflect' && reflectionPromptsFromContent.length > 0) && (
                                    <div className="space-y-8 p-8">
                                        <div className="bg-math-purple/5 p-6 rounded-2xl border border-math-purple/20">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-math-purple p-2.5 rounded-xl text-white shadow-lg shadow-purple-900/10">
                                                    <Brain size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xl text-text-primary">Final Reflection</h3>
                                                    <p className="text-text-secondary text-sm">Consolidate your learning before the lesson ends</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6 mt-8">
                                                {reflectionPromptsFromContent.map((item, i) => (
                                                    <div key={i} className="space-y-3 p-6 bg-bg-card rounded-xl border border-border shadow-sm group hover:border-math-purple/30 transition-all">
                                                        <h5 className="font-bold text-lg text-text-primary">
                                                            <span className="text-math-purple mr-2">{i + 1}.</span>
                                                            {item.prompt}
                                                        </h5>
                                                        <textarea
                                                            placeholder={item.response}
                                                            className="w-full h-24 p-4 rounded-lg bg-bg-secondary/50 border border-border focus:border-math-purple focus:ring-1 focus:ring-math-purple/20 transition-all outline-none text-text-primary resize-none"
                                                        />
                                                    </div>
                                                ))}

                                                <Button
                                                    className="w-full h-12 bg-math-purple hover:bg-math-purple/90 text-white font-bold rounded-xl shadow-lg shadow-purple-900/10"
                                                    onClick={() => toast({ title: "Reflection Saved", description: "Your thoughts have been recorded!" })}
                                                >
                                                    Submit Reflection
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 5. Generic Content Loop */}
                                {currentPhaseData?.content && currentPhaseData.content.length > 0 && (
                                    <div className="space-y-8">
                                        {currentPhaseData.content.map((content, idx) => {
                                            // Skip JSON blocks that have been consolidated into special activities
                                            const isJsonActivity = content.content?.trim().startsWith('{') &&
                                                (content.content.includes('"station"') ||
                                                    content.content.includes('"level"') ||
                                                    content.content.includes('"prompt"'));

                                            if (isJsonActivity) return null;
                                            if (content.type === 'scaffolded' && scaffoldedLevelsFromContent.length > 0) return null;
                                            if (content.type === 'carousel' && carouselStationsFromContent.length > 0) return null;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`
                                                    relative bg-bg-card p-8 rounded-2xl shadow-sm border border-border transition-all hover:shadow-md
                                                    border-l-[6px] ${phaseColors.border}
                                                `}
                                                >

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
                                                    {content.type === "quiz" && content.quizId && (() => {
                                                        const quiz = lessonQuizzes.find(q => q.id === content.quizId);
                                                        if (!quiz) return null;

                                                        return (
                                                            <div className="space-y-6">
                                                                <div className="bg-math-purple/5 p-4 rounded-xl border border-math-purple/20">
                                                                    <h3 className="text-lg font-bold text-text-primary mb-2">Try It Yourself Quiz</h3>
                                                                    <p className="text-text-secondary text-sm">Test your understanding with this interactive quiz</p>
                                                                </div>

                                                                <AccessCodeCard
                                                                    title={quiz.title}
                                                                    accessCode={quiz.access_code}
                                                                    isPublic={quiz.is_public}
                                                                    onCopy={() => handleCopyQuizCode(quiz.title, quiz.access_code)}
                                                                    onEdit={() => handleEditQuiz(quiz.id)}
                                                                    onDelete={() => handleDeleteQuiz(quiz.id)}
                                                                    onTogglePublic={() => {
                                                                        // Toggle public status
                                                                        supabase
                                                                            .from('quizzes')
                                                                            .update({ is_public: !quiz.is_public })
                                                                            .eq('id', quiz.id)
                                                                            .then(() => {
                                                                                setLessonQuizzes(prev =>
                                                                                    prev.map(q => q.id === quiz.id ? { ...q, is_public: !q.is_public } : q)
                                                                                );
                                                                                toast({
                                                                                    title: quiz.is_public ? "Quiz Made Private" : "Quiz Made Public",
                                                                                    description: quiz.is_public ? "Only you can see this quiz" : "Students can access this quiz"
                                                                                });
                                                                            });
                                                                    }}
                                                                    onToggleLive={() => handleToggleLiveQuiz(quiz.id, !quiz.is_live_session)}
                                                                    onStartQuiz={() => {
                                                                        // Navigate to quiz or start session
                                                                        navigate(`/quiz/${quiz.id}`);
                                                                    }}
                                                                    isLiveSession={quiz.is_live_session}
                                                                    liveStatus={quiz.live_status}
                                                                    subject={quiz.subject}
                                                                />
                                                            </div>
                                                        );
                                                    })()}


                                                    {/* UNIVERSAL ENGAGE OVERHAUL */}
                                                    {content.type === "universal-engage" && content.universalEngage && (
                                                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                                                            <div className="mb-10 text-center">
                                                                <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#FF6B35]/10 dark:bg-orange-500/10 rounded-full border border-[#FF6B35]/20 dark:border-orange-500/20 mb-4">
                                                                    <div className="w-2.5 h-2.5 bg-[#FF6B35] dark:bg-orange-500 rounded-full animate-pulse" />
                                                                    <span className="text-sm font-black text-[#FF6B35] dark:text-orange-500 uppercase tracking-widest">Active Lesson Hook</span>
                                                                </div>
                                                                <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-tight">
                                                                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF4500]">Ignite Your Curiosity?</span>
                                                                </h2>
                                                            </div>

                                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                                                <div className="lg:col-span-12 flex flex-col gap-8">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                        <div className="bg-bg-card p-6 rounded-2xl border-2 border-[#FF6B35]/20 dark:border-orange-500/20 shadow-xl overflow-hidden relative group">
                                                                            <div className="absolute top-0 right-0 p-3 transform rotate-12 opacity-10 group-hover:rotate-0 transition-transform">
                                                                                <Eye size={80} className="text-[#FF6B35]" />
                                                                            </div>
                                                                            <h3 className="text-xl font-black text-[#FF6B35] dark:text-orange-500 mb-4 uppercase tracking-tighter flex items-center gap-2">
                                                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white text-sm">1</span>
                                                                                Visual Hook
                                                                            </h3>
                                                                            {content.universalEngage.imageUrl ? (
                                                                                <div className="space-y-4">
                                                                                    <div className="relative group rounded-xl overflow-hidden border border-gray-100 bg-bg-secondary/50 p-2">
                                                                                        <img
                                                                                            src={content.universalEngage.imageUrl}
                                                                                            alt="Visual Lesson Hook"
                                                                                            className="max-h-[300px] w-auto mx-auto object-contain rounded-lg shadow-inner"
                                                                                        />
                                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <Button
                                                                                                variant="secondary"
                                                                                                size="sm"
                                                                                                className="bg-white/90 text-[#FF6B35] hover:bg-white font-bold"
                                                                                                onClick={() => {
                                                                                                    setTimeout(() => engageImageInputRef.current?.click(), 100);
                                                                                                }}
                                                                                            >
                                                                                                <ImageIcon size={16} className="mr-2" />
                                                                                                Change Photo
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="h-[250px] border-4 border-dashed border-[#FF6B35]/10 dark:border-orange-500/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-bg-secondary/30 group-hover:border-[#FF6B35]/30 transition-all">
                                                                                    <div className="w-16 h-16 bg-[#FF6B35]/5 dark:bg-orange-500/5 rounded-full flex items-center justify-center mb-4 text-[#FF6B35]/40 leading-none">
                                                                                        <ImageIcon size={40} />
                                                                                    </div>
                                                                                    <p className="text-[#FF6B35]/60 font-bold italic mb-4">"A picture is worth a thousand questions!"</p>
                                                                                    <div className="flex gap-2">
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            className="border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/10 font-bold"
                                                                                            onClick={() => engageImageInputRef.current?.click()}
                                                                                        >
                                                                                            <Plus size={16} className="mr-1" />
                                                                                            Select Photo
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            className="bg-[#FF6B35] hover:bg-orange-600 text-white font-bold"
                                                                                            onClick={() => handleForgeVisuals(currentPhaseKey)}
                                                                                        >
                                                                                            <Sparkles size={16} className="mr-1" />
                                                                                            AI Forge
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="bg-bg-card p-6 rounded-2xl border-2 border-math-purple/20 shadow-xl overflow-hidden relative group">
                                                                            <div className="absolute top-0 right-0 p-3 transform -rotate-12 opacity-10 group-hover:rotate-0 transition-transform">
                                                                                <Lightbulb size={80} className="text-math-purple" />
                                                                            </div>
                                                                            <h3 className="text-xl font-black text-math-purple mb-4 uppercase tracking-tighter flex items-center gap-2">
                                                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-math-purple text-white text-sm">2</span>
                                                                                The Big Question
                                                                            </h3>
                                                                            <div className="bg-math-purple/5 p-6 rounded-xl border border-math-purple/10 flex flex-col items-center justify-center text-center min-h-[200px]">
                                                                                <h4 className="text-2xl font-black text-text-primary leading-tight italic">
                                                                                    "{content.universalEngage.hookQuestion}"
                                                                                </h4>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                        <div className="bg-[#FF6B35]/5 dark:bg-orange-500/5 p-8 rounded-3xl border border-dashed border-[#FF6B35]/30 dark:border-orange-500/30">
                                                                            <h3 className="text-xl font-black text-[#FF6B35] dark:text-orange-500 mb-6 uppercase tracking-tighter flex items-center gap-3">
                                                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white text-sm">3</span>
                                                                                Step 1: Notice & Wonder
                                                                            </h3>
                                                                            <div className="space-y-4">
                                                                                <div>
                                                                                    <label className="font-bold text-text-primary block mb-2">What do you notice? (Facts/Observations)</label>
                                                                                    <textarea
                                                                                        value={universalEngageResponses.notice}
                                                                                        onChange={(e) => setUniversalEngageResponses(prev => ({ ...prev, notice: e.target.value }))}
                                                                                        className="w-full p-4 rounded-xl border border-border focus:border-[#FF6B35] focus:dark:border-orange-500 outline-none shadow-sm bg-bg-secondary text-text-primary h-24 resize-none"
                                                                                        placeholder="I see... / I notice that..."
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="font-bold text-text-primary block mb-2">What do you wonder? (Curiosity/Questions)</label>
                                                                                    <textarea
                                                                                        value={universalEngageResponses.wonder}
                                                                                        onChange={(e) => setUniversalEngageResponses(prev => ({ ...prev, wonder: e.target.value }))}
                                                                                        className="w-full p-4 rounded-xl border border-border focus:border-[#FF6B35] focus:dark:border-orange-500 outline-none shadow-sm bg-bg-secondary text-text-primary h-24 resize-none"
                                                                                        placeholder="I wonder why... / How does..."
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="bg-focus-blue/5 p-8 rounded-3xl border border-dashed border-focus-blue/30">
                                                                            <h3 className="text-xl font-black text-focus-blue mb-6 uppercase tracking-tighter flex items-center gap-3">
                                                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-focus-blue text-white text-sm">4</span>
                                                                                Step 2: Predictions
                                                                            </h3>
                                                                            <div className="space-y-6">
                                                                                <div className="bg-bg-card p-6 rounded-2xl border border-focus-blue/20 shadow-sm relative overflow-hidden">
                                                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                        <Globe size={40} className="text-focus-blue" />
                                                                                    </div>
                                                                                    <p className="font-bold text-text-secondary leading-relaxed mb-4">
                                                                                        "{content.universalEngage.predictionPrompt}"
                                                                                    </p>
                                                                                    <input
                                                                                        value={universalEngageResponses.prediction}
                                                                                        onChange={(e) => setUniversalEngageResponses(prev => ({ ...prev, prediction: e.target.value }))}
                                                                                        className="w-full p-4 rounded-lg border border-border focus:border-focus-blue outline-none shadow-sm bg-bg-secondary text-text-primary"
                                                                                        placeholder="Your prediction..."
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-bg-card p-8 rounded-3xl border-2 border-border shadow-2xl relative overflow-hidden">
                                                                        <div className="absolute top-0 right-0 p-10 transform -rotate-45 opacity-5 pointer-events-none">
                                                                            <Star size={200} fill="currentColor" className="text-[#FF6B35]" />
                                                                        </div>
                                                                        <h3 className="text-2xl font-black text-text-primary mb-6 uppercase tracking-tight flex items-center gap-3">
                                                                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-text-primary text-white text-lg">5</span>
                                                                            The Burning Question
                                                                        </h3>
                                                                        <div className="bg-[#FF6B35]/5 dark:bg-orange-500/10 p-6 rounded-xl border border-[#FF6B35]/20 dark:border-orange-500/20">
                                                                            <label className="font-bold text-lg text-text-primary block mb-3">What's the one question you most want answered today?</label>
                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    value={universalEngageResponses.question}
                                                                                    onChange={(e) => setUniversalEngageResponses(prev => ({ ...prev, question: e.target.value }))}
                                                                                    className="flex-1 p-4 rounded-lg border border-border focus:border-[#FF6B35] focus:dark:border-orange-500 outline-none shadow-sm bg-bg-secondary text-text-primary placeholder:text-text-tertiary"
                                                                                    placeholder="My burning question..."
                                                                                />
                                                                                <Button className="bg-[#FF6B35] hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white h-auto px-6 font-bold shadow-md">Ask!</Button>
                                                                            </div>
                                                                            <p className="text-sm text-[#FF6B35] dark:text-orange-400 mt-3 font-medium italic">"These questions will guide our lesson!"</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* INSTRUCTIONAL ACTIVITY (LEARN PHASE OVERHAUL) */}
                                                    {content.type === "instructional" && content.instructional && (
                                                        <InstructionalActivity
                                                            data={content.instructional}
                                                            topic={lesson?.topic || "Lesson"}
                                                            onUploadCustom={updateInstructionalContent}
                                                            onAddFlashcards={handleManualFlashcards}
                                                            onGenerateFlashcards={handleAIFlashcards}
                                                        />
                                                    )}

                                                    {/* NEW INTERACTIVE TYPES */}

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

                                                    {/* PRESENTATION */}
                                                    {content.type === "presentation" && (
                                                        <PresentationActivity slides={content.slides} topic={lesson?.topic || "Lesson Topic"} />
                                                    )}

                                                    {/* CAROUSEL */}
                                                    {content.type === "carousel" && (
                                                        <CarouselActivity
                                                            stations={content.carouselStations || []}
                                                            topic={lesson?.topic || "Lesson Topic"}
                                                        />
                                                    )}

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
                                                                    className="bg-focus-blue text-white"
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
                                                                            <div className="absolute inset-0 backface-hidden bg-bg-card border-2 border-focus-blue/20 rounded-2xl flex items-center justify-center p-6 shadow-sm group-hover:shadow-md transition-shadow">
                                                                                <p className="text-xl font-bold text-focus-blue text-center">{card.front}</p>
                                                                                <Badge className="absolute bottom-4 right-4 bg-focus-blue/10 text-focus-blue border-none">Click to flip</Badge>
                                                                            </div>
                                                                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-focus-blue text-white rounded-2xl flex items-center justify-center p-6 shadow-xl text-center">
                                                                                <p className="text-lg font-medium leading-relaxed">{card.back}</p>
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
                                                                                <Badge key={idx} className={`${i === 0 ? 'bg-math-purple' : 'bg-ict-orange'} px-4 py-2 text-sm shadow-sm animate-in zoom-in-90 text-white`}>{item}</Badge>
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

                                                    {/* EXIT TICKET */}
                                                    {content.type === "exit-ticket" && (
                                                        <div className="space-y-8 p-4">
                                                            <div className="text-center space-y-2">
                                                                <h4 className="font-bold text-3xl text-text-primary">3-2-1 Exit Ticket</h4>
                                                                <p className="text-text-secondary">Reflect on your learning journey today</p>
                                                            </div>

                                                            <div className="space-y-8 max-w-2xl mx-auto">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-success-green text-white flex items-center justify-center font-bold">3</div>
                                                                        <h5 className="font-bold text-lg text-text-primary">Things I learned today</h5>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-2 pl-11">
                                                                        {[0, 1, 2].map(i => (
                                                                            <input
                                                                                key={i}
                                                                                value={exitTicketData.learnings[i] || ""}
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

                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-focus-blue text-white flex items-center justify-center font-bold">2</div>
                                                                        <h5 className="font-bold text-lg text-text-primary">Questions I still have</h5>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-2 pl-11">
                                                                        {[0, 1].map(i => (
                                                                            <input
                                                                                key={i}
                                                                                value={exitTicketData.questions[i] || ""}
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
                                                                    <p className="text-center text-lg font-bold text-text-primary">
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

                                                    {/* FALLBACK FOR UNKNOWN TYPES */}
                                                    {!['text', 'image', 'video', 'quiz', 'activity', 'file', 'resource', 'presentation', 'carousel', 'poll', 'brainstorm', 'steps', 'flashcards', 'categorization', 'scaffolded', 'exit-ticket', 'universal-engage', 'instructional'].includes(content.type) && (
                                                        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
                                                            <h4 className="font-bold">Unknown Content Type: {content.type}</h4>
                                                            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Add Quiz Button if missing (Only for Teachers/Owners in Independent Practice Phase) */}
                                        {(user?.id === lesson?.createdBy) &&
                                            PHASES[currentPhaseIndex] === 'independentPractice' &&
                                            !currentPhaseData?.content?.some(c => c.type === 'quiz') && (
                                                <div className="pt-8">
                                                    <Button
                                                        onClick={handleCreateQuizInline}
                                                        disabled={isGeneratingQuiz}
                                                        className="w-full h-16 bg-white border-2 border-dashed border-math-purple/30 text-math-purple hover:bg-math-purple/5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all group"
                                                    >
                                                        {isGeneratingQuiz ? (
                                                            <Loader2 className="animate-spin" />
                                                        ) : (
                                                            <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                                        )}
                                                        <span>{isGeneratingQuiz ? "Generating Quiz Questions..." : "Add Interactive Quiz to this Phase"}</span>
                                                    </Button>
                                                </div>
                                            )}
                                    </div>
                                )}

                                {(!currentPhaseData?.content?.length &&
                                    !carouselStationsFromContent.length &&
                                    !scaffoldedLevelsFromContent.length &&
                                    !reflectionPromptsFromContent.length &&
                                    currentPhaseData?.activityType !== "collaborative-map") && (
                                        <div className="text-center py-24 bg-bg-card rounded-2xl border border-dashed border-border">
                                            <div className="bg-bg-secondary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-text-tertiary">
                                                <Layout size={40} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-text-secondary">No content added yet</h3>
                                            <p className="text-text-tertiary mt-2">Check the Lesson Builder to add activities for this phase.</p>
                                        </div>
                                    )}
                            </div>
                        </CardContent >
                    </div >

                    {/* Hidden inputs for player-side updates */}
                    < input
                        type="file"
                        ref={scaffoldedImageInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleScaffoldedImageUpload}
                    />

                    {/* Research Lab - Lesson-Level Guidance (Show mainly in Learn phase to reduce repetition) */}
                    {
                        lesson?.researchNotes && currentPhaseIndex <= 1 && (
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
                        )
                    }

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
                </Card >

                {/* Flashcard Modal */}
                {
                    flashcardModalState.isOpen && (
                        <FlashcardModal
                            isOpen={flashcardModalState.isOpen}
                            onClose={() => setFlashcardModalState({ isOpen: false, initialData: null })}
                            onSave={handleSaveFlashcards}
                            initialData={flashcardModalState.initialData}
                            subject={lesson?.subject || "math"}
                            gradeLevel={lesson?.gradeLevel || 1}
                        />
                    )
                }

                {/* AI Loading Overlay */}
                {
                    isGeneratingFlashcards && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="bg-bg-card p-8 rounded-2xl shadow-xl border border-border flex flex-col items-center gap-4">
                                <Sparkles className="w-12 h-12 text-math-purple animate-pulse" />
                                <h3 className="text-xl font-bold text-text-primary">Generating Flashcards...</h3>
                                <p className="text-text-secondary">AI is creating study cards for this lesson.</p>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default LessonRunnable;
