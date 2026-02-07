import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Book, FileText, Users, BarChart, Laptop, BookText, Globe, Sparkles, Layers } from "lucide-react";
import { Quiz, Lesson, StudentQuizResult, TeacherData, FlashcardSet } from '@/types/quiz';
import QuizForm from '@/components/QuizForm';
import LessonBuilder from '@/components/teacher/LessonBuilder';
import ScaffoldedLessonBuilder from '@/components/teacher/ScaffoldedLessonBuilder';
import DashboardHeader from '@/components/teacher/DashboardHeader';
import DashboardFooter from '@/components/teacher/DashboardFooter';
import QuizzesTab from '@/components/teacher/tabs/QuizzesTab';
import PerformanceTab from '@/components/teacher/tabs/PerformanceTab';
import QuestionGeneratorTab from '@/components/teacher/tabs/QuestionGeneratorTab';
import LessonsTab from '@/components/teacher/tabs/LessonsTab';
import FlashcardsTab from '@/components/teacher/tabs/FlashcardsTab';
import PublicLibrary from '@/components/teacher/PublicLibrary';
import SubjectSelector from '@/components/SubjectSelector';
import { AIStatusCard } from "@/components/teacher/AIStatusCard";
// GradeSelector removed
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getLeaderboardEntries,
  findQuizById,
  getTotalStudents,
  getTotalCompletions
} from '@/utils/dashboardUtils';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [results, setResults] = useState<StudentQuizResult[]>([]);

  // Persist active tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("activeDashboardTab") || "quizzes";
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(true);
  const [isLessonsLoading, setIsLessonsLoading] = useState(true);
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(true);
  const [isResultsLoading, setIsResultsLoading] = useState(true);

  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showLessonBuilder, setShowLessonBuilder] = useState(false);
  const [showScaffoldedLessonBuilder, setShowScaffoldedLessonBuilder] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<"math" | "english" | "ict">("math");
  // selectedGrades removed, using local state in tabs or defaults

  // Available grades are now 1-11 only
  const availableGrades = Array.from({ length: 11 }, (_, i) => i + 1);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/teacher-login');
    }
  }, [authLoading, user, navigate]);

  const loadData = React.useCallback(async () => {
    if (!user) return;

    // Set all to loading initially
    setIsQuizzesLoading(true);
    setIsLessonsLoading(true);
    setIsFlashcardsLoading(true);
    setIsResultsLoading(true);

    try {
      // Independent fetch functions
      const fetchQuizzes = async () => {
        try {
          const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          setQuizzes((data || []).map((q: any) => ({
            ...q,
            gradeLevel: q.grade_level,
            timeLimit: q.time_limit,
            accessCode: q.access_code,
            createdBy: q.created_by,
            isPublic: q.is_public
          })));
        } catch (e) { console.error("Quizzes fetch error", e); }
        finally { setIsQuizzesLoading(false); }
      };

      const fetchLessons = async () => {
        try {
          const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('created_by', user.id)
            .order('createdat', { ascending: false });

          if (error) throw error;

          setLessons((data || []).map((l: any) => ({
            ...l,
            gradeLevel: l.grade_level || l.gradelevel,
            timeLimit: l.time_limit,
            learningType: l.learning_type || l.learningtype,
            researchNotes: l.research_notes || l.researchnotes,
            visualTheme: l.visual_theme || l.visualtheme,
            assessmentSettings: l.assessment_settings || l.assessmentsettings,
            requiredResources: l.required_resources || l.requiredresources,
            accessCode: l.access_code || l.accesscode,
            createdBy: l.created_by || l.createdby,
            createdAt: l.created_at || l.createdat
          })));
        } catch (e) { console.error("Lessons fetch error", e); }
        finally { setIsLessonsLoading(false); }
      };

      const fetchFlashcards = async () => {
        try {
          const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          setFlashcardSets((data || []).map((s: any) => ({
            ...s,
            gradeLevel: s.grade_level,
            accessCode: s.access_code,
            createdBy: s.created_by,
            createdAt: s.created_at,
            isPublic: s.is_public
          })));
        } catch (e) {
          console.error("Flashcards fetch error", e);
        } finally {
          setIsFlashcardsLoading(false);
        }
      };

      // Results fetch removed as a global fetch - PerformanceTab fetches per quiz
      setIsResultsLoading(false);

      fetchQuizzes();
      fetchLessons();
      fetchFlashcards();

    } catch (error: any) {
      console.error('Unexpected error:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateQuiz = React.useCallback(async (quiz: Quiz) => {
    try {
      if (!user) return;

      const payload = {
        title: quiz.title,
        description: quiz.description || '',
        grade_level: Number(quiz.gradeLevel),
        subject: quiz.subject,
        time_limit: Number(quiz.timeLimit),
        access_code: quiz.accessCode.toUpperCase(),
        questions: quiz.questions,
        created_by: user.id,
        is_public: false // Default to private
      };

      if (editingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .update(payload)
          .eq('id', editingQuiz.id);

        if (error) throw error;
        toast({ title: "Quiz updated!" });
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert([payload]);

        if (error) throw error;
        toast({ title: "Quiz created!", description: "Access code: " + payload.access_code });

        // Auto-switch subject if different so user sees their new quiz
        if (payload.subject && payload.subject !== selectedSubject) {
          setSelectedSubject(payload.subject as "math" | "english" | "ict");
        }
      }

      setShowQuizForm(false);
      setEditingQuiz(null);
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error saving quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [user, editingQuiz, selectedSubject, loadData, toast]);
  const handleCreateLesson = React.useCallback(async (lesson: Lesson) => {
    try {
      if (!user) return;

      const payload: any = {
        title: lesson.title,
        description: lesson.description || '',
        grade_level: Number(lesson.gradeLevel) || 1,
        subject: lesson.subject,
        content: lesson.content || [],
        access_code: lesson.accessCode ? lesson.accessCode.toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase(),
        learning_type: lesson.learningType || 'scaffolded',
        lesson_structure: lesson.lessonStructure || {},
        created_by: user.id,
        is_public: false
      };

      if (lesson.researchNotes) payload.research_notes = lesson.researchNotes;
      if (lesson.visualTheme) payload.visual_theme = lesson.visualTheme;
      if (lesson.assessmentSettings) payload.assessment_settings = lesson.assessmentSettings;
      if (lesson.requiredResources) payload.required_resources = lesson.requiredResources;
      if (lesson.activity) payload.activity = lesson.activity;

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(payload)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: "Lesson updated!" });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([payload]);

        if (error) throw error;
        const desc = payload.access_code ? "Access code: " + payload.access_code : "Teacher-led lesson created.";
        toast({ title: "Lesson created!", description: desc });
      }

      setShowLessonBuilder(false);
      setShowScaffoldedLessonBuilder(false);
      setEditingLesson(null);
      loadData();
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error saving lesson",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [user, editingLesson, loadData, toast]);

  const handleCreateFlashcardSet = React.useCallback(async (set: FlashcardSet) => {
    try {
      if (!user) return;

      const payload = {
        title: set.title,
        description: set.description || '',
        grade_level: Number(set.gradeLevel) || 1,
        subject: set.subject,
        cards: set.cards,
        access_code: set.accessCode ? set.accessCode.toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase(),
        created_by: user.id,
        is_public: false
      };

      const { error } = await supabase
        .from('flashcards')
        .insert([payload]);

      if (error) throw error;
      toast({ title: "Flashcards created!", description: "Access code: " + payload.access_code });

      loadData();
    } catch (error: any) {
      console.error("Error saving flashcards:", error);
      toast({
        title: "Error saving flashcards",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [user, loadData, toast]);


  const handleEditQuiz = React.useCallback(async (q: Quiz) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('id', q.id)
        .single();

      if (error) throw error;

      setEditingQuiz({ ...q, questions: data.questions });
      setShowQuizForm(true);
    } catch (err) {
      console.error("Error fetching full quiz:", err);
      toast({ title: "Error", description: "Failed to load quiz details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditLesson = React.useCallback(async (l: Lesson) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('lesson_structure, content')
        .eq('id', l.id)
        .single();

      if (error) throw error;

      const fullLesson = { ...l, ...data };
      setEditingLesson(fullLesson);
      if (l.learningType === 'scaffolded' || l.learningType === 'scaffolded-lesson') {
        setShowScaffoldedLessonBuilder(true);
      } else {
        setShowLessonBuilder(true);
      }
    } catch (err) {
      console.error("Error fetching full lesson:", err);
      toast({ title: "Error", description: "Failed to load lesson details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRunLesson = React.useCallback((lessonId: string) => {
    navigate(`/teacher/lesson/${lessonId}/run`);
  }, [navigate]);

  const handleDeleteQuiz = React.useCallback(async (quizId: string) => {
    // Removed sync confirm() - now handled by inline UI
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast({ title: "Quiz deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, []);

  const handleDeleteLesson = React.useCallback(async (lessonId: string) => {
    // Removed sync confirm() - now handled by inline UI
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      toast({ title: "Lesson deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, []);

  const handleTogglePublicQuiz = React.useCallback(async (quiz: Quiz) => {
    try {
      // Use isPublic (frontend state) as primary source, fallback to is_public
      const currentStatus = quiz.isPublic !== undefined ? quiz.isPublic : (quiz as any).is_public;
      const newStatus = !currentStatus;

      // Optimistic update first for instant feedback mechanism
      setQuizzes(prev => prev.map(q =>
        q.id === quiz.id ? { ...q, isPublic: newStatus, is_public: newStatus } : q
      ));

      const { error } = await supabase
        .from('quizzes')
        .update({ is_public: newStatus })
        .eq('id', quiz.id);

      if (error) {
        // Revert on error
        setQuizzes(prev => prev.map(q =>
          q.id === quiz.id ? { ...q, isPublic: currentStatus, is_public: currentStatus } : q
        ));
        throw error;
      }

      toast({
        title: "Visibility updated",
        description: `Quiz is now ${newStatus ? 'Public' : 'Private'}`
      });
    } catch (error: any) {
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive"
      });
    }
  }, []);

  const handleTogglePublicLesson = React.useCallback(async (lesson: Lesson) => {
    try {
      const currentStatus = lesson.isPublic !== undefined ? lesson.isPublic : (lesson as any).is_public;
      const newStatus = !currentStatus;

      // Optimistic update
      setLessons(prev => prev.map(l =>
        l.id === lesson.id ? { ...l, isPublic: newStatus, is_public: newStatus } : l
      ));

      const { error } = await supabase
        .from('lessons')
        .update({ is_public: newStatus })
        .eq('id', lesson.id);

      if (error) {
        // Revert on error
        setLessons(prev => prev.map(l =>
          l.id === lesson.id ? { ...l, isPublic: currentStatus, is_public: currentStatus } : l
        ));
        throw error;
      }

      toast({
        title: "Visibility updated",
        description: `Lesson is now ${newStatus ? 'Public' : 'Private'}`
      });
    } catch (error: any) {
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive"
      });
    }
  }, []);

  const handleCopyCode = React.useCallback((title: string) => {
    toast({
      title: "Code copied!",
      description: `The access code for "${title}" has been copied to clipboard.`,
    });
  }, []);

  const handleToggleLiveQuiz = React.useCallback(async (quiz: Quiz) => {
    try {
      const newLiveStatus = !quiz.is_live_session;

      // Optimistic update
      setQuizzes(prev => prev.map(q =>
        q.id === quiz.id ? { ...q, is_live_session: newLiveStatus, live_status: newLiveStatus ? 'waiting' : 'idle' } : q
      ));

      const { error } = await supabase
        .from('quizzes')
        .update({
          is_live_session: newLiveStatus,
          live_status: newLiveStatus ? 'waiting' : 'idle'
        })
        .eq('id', quiz.id);

      if (error) {
        // Revert on error
        setQuizzes(prev => prev.map(q =>
          q.id === quiz.id ? { ...q, is_live_session: quiz.is_live_session, live_status: quiz.live_status } : q
        ));
        throw error;
      }

      toast({
        title: newLiveStatus ? "Live Session Mode Enabled" : "Live Session Mode Disabled",
        description: newLiveStatus ? "Students will now wait for you to start the quiz." : "Students can start the quiz normally."
      });
    } catch (error: any) {
      toast({
        title: "Error updating live mode",
        description: error.message,
        variant: "destructive"
      });
    }
  }, []);

  const [targetLiveQuizId, setTargetLiveQuizId] = useState<string | undefined>(undefined);

  const handleStartLiveQuiz = async (quiz: Quiz) => {
    try {
      // 1. Optimistic update
      setQuizzes(prev => prev.map(q =>
        q.id === quiz.id ? { ...q, live_status: 'active' } : q
      ));

      // 2. Database update
      const { error } = await supabase
        .from('quizzes')
        .update({ live_status: 'active' })
        .eq('id', quiz.id);

      if (error) {
        // Revert on error
        setQuizzes(prev => prev.map(q =>
          q.id === quiz.id ? { ...q, live_status: 'waiting' } : q
        ));
        throw error;
      }

      toast({
        title: "Quiz Started!",
        description: "Redirecting to Live Race view..."
      });

      // 3. Auto-navigate
      setTargetLiveQuizId(quiz.id);
      setActiveTab('performance');
      localStorage.setItem("activeDashboardTab", "performance");

    } catch (error: any) {
      toast({
        title: "Error starting quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSubjectIcon = () => {
    switch (selectedSubject) {
      case "math": return <Book className="text-math-purple" />;
      case "english": return <BookText className="text-english-green" />;
      case "ict": return <Laptop className="text-ict-orange" />;
      default: return <Book className="text-focus-blue" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-focus-blue"></div>
        <p className="text-text-secondary">Loading your classroom...</p>
      </div>
    );
  }

  const filteredQuizzes = quizzes.filter(quiz => quiz.subject === selectedSubject);
  const filteredLessons = lessons.filter(lesson => lesson.subject === selectedSubject);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary font-poppins">
      <DashboardHeader
        teacherName={user?.user_metadata?.full_name || user?.email || 'Teacher'}
        onLogout={handleLogout}
      />

      <main className="flex-1 main-container py-5">


        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-1/2">
            <SubjectSelector
              selectedSubject={selectedSubject}
              onChange={(subject) => setSelectedSubject(subject as "math" | "english" | "ict")}
            />
          </div>
        </div>

        {!showQuizForm && !showLessonBuilder && !showScaffoldedLessonBuilder ? (
          <>
            <AIStatusCard />
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                localStorage.setItem("activeDashboardTab", val);
              }}
              className="space-y-6"
            >
              <TabsList className="flex-wrap h-auto gap-1 bg-bg-secondary p-1 border border-border rounded-lg shadow-inner">
                <TabsTrigger
                  value="quizzes"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm text-text-secondary hover:text-text-primary transition-all rounded-md"
                >
                  <Book size={14} />
                  <span>Quiz Zone</span>
                </TabsTrigger>
                <TabsTrigger
                  value="lessons"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm text-text-secondary hover:text-text-primary transition-all rounded-md"
                >
                  <FileText size={14} />
                  <span>Lesson Builder</span>
                </TabsTrigger>
                <TabsTrigger
                  value="flashcards"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm text-text-secondary hover:text-text-primary transition-all rounded-md"
                >
                  <Layers size={14} />
                  <span>Flashcards</span>
                </TabsTrigger>
                <TabsTrigger
                  value="library"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm text-text-secondary hover:text-text-primary transition-all rounded-md"
                >
                  <Globe size={14} />
                  <span>Public Library</span>
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm text-text-secondary hover:text-text-primary transition-all rounded-md"
                >
                  <BarChart size={14} />
                  <span>Performance</span>
                </TabsTrigger>
                <TabsTrigger
                  value="generate"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm text-text-secondary hover:text-text-primary transition-all rounded-md"
                >
                  {getSubjectIcon()}
                  <span>Content Generator</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quizzes">
                <QuizzesTab
                  quizzes={filteredQuizzes}
                  onCreateQuiz={() => setShowQuizForm(true)}
                  onCopyCode={handleCopyCode}
                  onEditQuiz={handleEditQuiz}
                  onDeleteQuiz={handleDeleteQuiz}
                  onTogglePublic={handleTogglePublicQuiz}
                  onToggleLive={handleToggleLiveQuiz}
                  onStartQuiz={handleStartLiveQuiz}
                  subject={selectedSubject}
                  isLoading={isQuizzesLoading}
                />
              </TabsContent>

              <TabsContent value="lessons">
                <LessonsTab
                  lessons={filteredLessons}
                  onCreateLesson={() => setShowScaffoldedLessonBuilder(true)}
                  onCopyCode={handleCopyCode}
                  onEditLesson={handleEditLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onTogglePublic={handleTogglePublicLesson}
                  onRunLesson={handleRunLesson}
                  subject={selectedSubject}
                  isLoading={isLessonsLoading}
                />
              </TabsContent>

              <TabsContent value="flashcards">
                <FlashcardsTab
                  flashcardSets={flashcardSets.filter(s => s.subject === selectedSubject)}
                  onCreateSet={handleCreateFlashcardSet}
                  onUpdateSet={async (set) => {
                    try {
                      // Optimistic Update
                      setFlashcardSets(prev => prev.map(s => s.id === set.id ? set : s));

                      const { error } = await supabase
                        .from('flashcards')
                        .update({
                          title: set.title,
                          description: set.description,
                          cards: set.cards,
                          grade_level: set.gradeLevel
                        })
                        .eq('id', set.id);

                      if (error) throw error;
                      toast({ title: "Flashcard Set Updated!" });
                    } catch (error: any) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                      loadData(); // Revert on error
                    }
                  }}
                  onCopyCode={handleCopyCode}
                  onDeleteSet={async (id) => {
                    // Optimistic Delete
                    setFlashcardSets(prev => prev.filter(s => s.id !== id));

                    try {
                      const { error } = await supabase.from('flashcards').delete().eq('id', id);
                      if (error) throw error;
                      toast({ title: "Flashcard Set Deleted" });
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                      loadData(); // Revert on error
                    }
                  }}
                  onTogglePublic={async (id, isPublic) => {
                    try {
                      const { error } = await supabase.from('flashcards').update({ is_public: isPublic }).eq('id', id);
                      if (error) throw error;
                      setFlashcardSets(prev => prev.map(s => s.id === id ? { ...s, isPublic } : s));
                      toast({ title: isPublic ? "Set is now Public" : "Set is now Private" });
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    }
                  }}
                  subject={selectedSubject}
                  isLoading={isFlashcardsLoading}
                />
              </TabsContent>

              <TabsContent value="library">
                <PublicLibrary onCopySuccess={loadData} />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceTab
                  quizzes={quizzes}
                  getTotalStudents={() => getTotalStudents(results)}
                  getTotalCompletions={() => getTotalCompletions(results)}
                  findQuizById={(id) => findQuizById(quizzes, id)}
                  subject={selectedSubject}
                  initialSelectedQuizId={targetLiveQuizId}
                />
              </TabsContent>

              <TabsContent value="generate" forceMount={true} className={activeTab === "generate" ? "" : "hidden"}>
                <QuestionGeneratorTab
                  availableGrades={availableGrades}
                  subject={selectedSubject}
                  onCreateQuiz={handleCreateQuiz}
                  onCreateLesson={handleCreateLesson}
                  onCreateFlashcardSet={handleCreateFlashcardSet}
                />
              </TabsContent>
            </Tabs>
          </>
        ) : showQuizForm ? (
          <QuizForm
            grades={availableGrades}
            onSave={handleCreateQuiz}
            onCancel={() => { setShowQuizForm(false); setEditingQuiz(null); }}
            subject={selectedSubject}
            initialData={editingQuiz}
          />
        ) : showScaffoldedLessonBuilder ? (
          <ScaffoldedLessonBuilder
            grades={availableGrades}
            onSave={handleCreateLesson}
            onCancel={() => { setShowScaffoldedLessonBuilder(false); setEditingLesson(null); }}
            subject={selectedSubject}
            initialData={editingLesson}
            onSwitchToGeneric={() => {
              setShowScaffoldedLessonBuilder(false);
              setShowLessonBuilder(true);
            }}
          />
        ) : (
          <LessonBuilder
            grades={availableGrades}
            onSave={handleCreateLesson}
            onCancel={() => { setShowLessonBuilder(false); setEditingLesson(null); }}
            subject={selectedSubject}
            initialData={editingLesson}
          />
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};

export default TeacherDashboard;
