
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Quiz, Lesson } from '@/types/quiz';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, Copy, BookOpen, BookText, Laptop, ArrowRight, Loader2 } from "lucide-react";

interface PublicLibraryProps {
    onCopySuccess: () => void;
}

const PublicLibrary: React.FC<PublicLibraryProps> = ({ onCopySuccess }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"quizzes" | "lessons">("quizzes");
    const [searchQuery, setSearchQuery] = useState("");
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copyingId, setCopyingId] = useState<string | null>(null);

    // Search filter
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedGrade, setSelectedGrade] = useState<string>("all");

    const fetchPublicContent = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "quizzes") {
                let query = supabase
                    .from('quizzes')
                    .select('*')
                    .eq('is_public', true)
                    .neq('created_by', user?.id || ''); // Don't show my own quizzes in public library (optional)

                if (searchQuery) {
                    query = query.ilike('title', `%${searchQuery}%`);
                }
                if (selectedSubject !== "all") {
                    query = query.eq('subject', selectedSubject);
                }
                if (selectedGrade !== "all") {
                    query = query.eq('grade_level', parseInt(selectedGrade));
                }

                const { data, error } = await query;
                if (error) throw error;
                setQuizzes((data as unknown as Quiz[]) || []);
            } else {
                let query = supabase
                    .from('lessons')
                    .select('*')
                    .eq('is_public', true)
                    .neq('created_by', user?.id || '');

                if (searchQuery) {
                    query = query.ilike('title', `%${searchQuery}%`);
                }
                if (selectedSubject !== "all") {
                    query = query.eq('subject', selectedSubject);
                }
                if (selectedGrade !== "all") {
                    query = query.eq('grade_level', parseInt(selectedGrade));
                }

                const { data, error } = await query;
                if (error) throw error;
                setLessons((data as unknown as Lesson[]) || []);
            }
        } catch (error: any) {
            console.error("Error fetching public content:", error);
            toast({
                title: "Error loading library",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPublicContent();
    }, [activeTab, searchQuery, selectedSubject, selectedGrade, user?.id]);

    const handleCopy = async (item: Quiz | Lesson, type: "quiz" | "lesson") => {
        if (!user) return;
        setCopyingId(item.id);

        try {
            const newAccessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            if (type === "quiz") {
                const { id, created_at, createdBy, ...quizData } = item as any;

                const { error } = await supabase.from('quizzes').insert({
                    title: `${quizData.title} (Copy)`,
                    description: quizData.description,
                    grade_level: quizData.gradeLevel || quizData.grade_level,
                    subject: quizData.subject,
                    time_limit: quizData.timeLimit || quizData.time_limit,
                    access_code: newAccessCode,
                    questions: quizData.questions,
                    is_public: false,
                    created_by: user.id,
                    copied_from: item.id
                });

                if (error) throw error;
            } else {
                const { id, created_at, createdBy, ...lessonData } = item as any;

                const { error } = await supabase.from('lessons').insert({
                    title: `${lessonData.title} (Copy)`,
                    description: lessonData.description,
                    grade_level: lessonData.gradeLevel || lessonData.grade_level,
                    subject: lessonData.subject,
                    content: lessonData.content,
                    access_code: newAccessCode,
                    is_public: false,
                    created_by: user.id,
                    copied_from: item.id,
                    learning_type: lessonData.learningType || lessonData.learning_type,
                    lesson_structure: lessonData.lessonStructure || lessonData.lesson_structure,
                    activity: lessonData.activity
                });

                if (error) throw error;
            }

            toast({
                title: "Copied successfully!",
                description: "This item has been added to your dashboard.",
            });
            onCopySuccess(); // Refresh dashboard

        } catch (error: any) {
            console.error("Error copying item:", error);
            toast({
                title: "Copy failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setCopyingId(null);
        }
    };

    const getSubjectIcon = (subject: string) => {
        switch (subject) {
            case "math": return <BookOpen className="h-4 w-4 text-purple-500" />;
            case "english": return <BookText className="h-4 w-4 text-green-500" />;
            case "ict": return <Laptop className="h-4 w-4 text-orange-500" />;
            default: return <BookOpen className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                    <Input
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        <option value="all">All Subjects</option>
                        <option value="math">Math</option>
                        <option value="english">English</option>
                        <option value="ict">ICT</option>
                    </select>
                </div>
                <div className="w-full md:w-32">
                    <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                    >
                        <option value="all">All Grades</option>
                        {[...Array(11)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                        ))}
                    </select>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quizzes">Public Quizzes</TabsTrigger>
                    <TabsTrigger value="lessons">Public Lessons</TabsTrigger>
                </TabsList>

                <TabsContent value="quizzes" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No public quizzes found matching your search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes.map((quiz) => (
                                <Card key={quiz.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                {getSubjectIcon(quiz.subject)}
                                                <Badge variant="outline" className="capitalize">{quiz.subject}</Badge>
                                            </div>
                                            <Badge variant="secondary">Grade {quiz.gradeLevel || (quiz as any).grade_level}</Badge>
                                        </div>
                                        <CardTitle className="mt-2 text-lg line-clamp-2">{quiz.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-gray-500">
                                            {(quiz.questions || []).length} questions • {(quiz.timeLimit || (quiz as any).time_limit) / 60} mins
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full gap-2"
                                            onClick={() => handleCopy(quiz, "quiz")}
                                            disabled={copyingId === quiz.id}
                                        >
                                            {copyingId === quiz.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Copying...
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    Copy to My Dashboard
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="lessons" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : lessons.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No public lessons found matching your search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lessons.map((lesson) => (
                                <Card key={lesson.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                {getSubjectIcon(lesson.subject)}
                                                <Badge variant="outline" className="capitalize">{lesson.subject}</Badge>
                                            </div>
                                            <Badge variant="secondary">Grade {lesson.gradeLevel || (lesson as any).grade_level}</Badge>
                                        </div>
                                        <CardTitle className="mt-2 text-lg line-clamp-2">{lesson.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        {/* Try to show some content summary */}
                                        <p className="text-sm text-gray-500">
                                            {lesson.content ? lesson.content.length : 0} content blocks
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full gap-2"
                                            onClick={() => handleCopy(lesson, "lesson")}
                                            disabled={copyingId === lesson.id}
                                        >
                                            {copyingId === lesson.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Copying...
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    Copy to My Dashboard
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PublicLibrary;
