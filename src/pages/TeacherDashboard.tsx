
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Book, FileText, Users, BarChart, Laptop, BookText, Globe } from "lucide-react";
import { Quiz, Lesson, StudentQuizResult, TeacherData } from '@/types/quiz';
import QuizForm from '@/components/QuizForm';
import LessonBuilder from '@/components/teacher/LessonBuilder';
import ScaffoldedLessonBuilder from '@/components/teacher/ScaffoldedLessonBuilder';
import DashboardHeader from '@/components/teacher/DashboardHeader';
import DashboardFooter from '@/components/teacher/DashboardFooter';
import QuizzesTab from '@/components/teacher/tabs/QuizzesTab';
import PerformanceTab from '@/components/teacher/tabs/PerformanceTab';
import QuestionGeneratorTab from '@/components/teacher/tabs/QuestionGeneratorTab';
import LessonsTab from '@/components/teacher/tabs/LessonsTab';
import PublicLibrary from '@/components/teacher/PublicLibrary';
import SubjectSelector from '@/components/SubjectSelector';
import GradeSelector from '@/components/teacher/GradeSelector';
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
  const [results, setResults] = useState<StudentQuizResult[]>([]);

  // Persist active tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("activeDashboardTab") || "quizzes";
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showLessonBuilder, setShowLessonBuilder] = useState(false);
  const [showScaffoldedLessonBuilder, setShowScaffoldedLessonBuilder] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<"math" | "english" | "ict">("math");
  const [selectedGrades, setSelectedGrades] = useState<number[]>([1, 2, 3, 4, 5]);

  // Available grades are now 1-11 only
  const availableGrades = Array.from({ length: 11 }, (_, i) => i + 1);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/teacher-login');
    }
  }, [authLoading, user, navigate]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Fetch Quizzes (RLS will filter by created_by = user.id)
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;
      if (quizzesError) throw quizzesError;

      const mappedQuizzes = (quizzesData || []).map((q: any) => ({
        ...q,
        gradeLevel: q.grade_level,
        timeLimit: q.time_limit,
        accessCode: q.access_code,
        createdBy: q.created_by,
        isPublic: q.is_public
      }));

      setQuizzes(mappedQuizzes);

      // 2. Fetch Lessons (RLS will filter by created_by = user.id)
      // 2. Fetch Lessons (RLS will filter by created_by = user.id)
      // Note: DB seems to use 'createdat' based on user logs, but let's try to be safe.
      // If the user ran the SQL migration I provided, the columns SHOULD be there.
      // BUT, if the previous logs showed 'created_at' does not exist, then it means 'createdat' IS the column.
      // I will revert to 'createdat' for ordering, BUT I will map "gradelevel" OR "grade_level" to the frontend.

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('createdat', { ascending: false });

      if (lessonsError) {
        console.warn('Error fetching lessons:', lessonsError);
      } else {
        const mappedLessons = (lessonsData || []).map((l: any) => ({
          ...l,
          // Handle both cases just to be robust
          gradeLevel: l.grade_level || l.gradelevel,
          timeLimit: l.time_limit,
          learningType: l.learning_type || l.learningtype, // Just in case
          lessonStructure: l.lesson_structure || l.lessonstructure,
          accessCode: l.access_code || l.accesscode,
          createdBy: l.created_by || l.createdby,
          createdAt: l.created_at || l.createdat
        }));
        setLessons(mappedLessons);
      }

      // 3. Fetch Results
      const { data: resultsData, error: resultsError } = await supabase
        .from('quiz_results')
        .select('*');

      if (!resultsError && resultsData) {
        setResults(resultsData);
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateQuiz = async (quiz: Quiz) => {
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
  };

  const handleCreateLesson = async (lesson: Lesson) => {
    try {
      if (!user) return;

      // Handle file uploads if any (skipping for this iteration as it wasn't explicitly requested, but good to note)

      const payload = {
        title: lesson.title,
        description: lesson.description || '',
        grade_level: Number(lesson.gradeLevel),
        subject: lesson.subject,
        content: lesson.content,
        access_code: lesson.accessCode.toUpperCase(),
        learning_type: lesson.learningType || 'scaffolded',
        lesson_structure: lesson.lessonStructure || {},
        activity: lesson.activity || null,
        created_by: user.id,
        is_public: false
      };

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
        toast({ title: "Lesson created!", description: "Access code: " + payload.access_code });
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
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast({ title: "Quiz deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      toast({ title: "Lesson deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleTogglePublicQuiz = async (quiz: Quiz) => {
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
  };

  const handleTogglePublicLesson = async (lesson: Lesson) => {
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
  };



  const handleCopyCode = (title: string) => {
    toast({
      title: "Code copied!",
      description: `The access code for "${title}" has been copied to clipboard.`,
    });
  };

  const getSubjectIcon = () => {
    switch (selectedSubject) {
      case "math": return <Book className="text-purple-500" />;
      case "english": return <BookText className="text-green-500" />;
      case "ict": return <Laptop className="text-orange-500" />;
      default: return <Book className="text-purple-500" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-gray-500">Loading your classroom...</p>
      </div>
    );
  }

  const filteredQuizzes = quizzes.filter(quiz => quiz.subject === selectedSubject);
  const filteredLessons = lessons.filter(lesson => lesson.subject === selectedSubject);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader
        teacherName={user?.user_metadata?.full_name || user?.email || 'Teacher'}
        onLogout={handleLogout}
      />

      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Malik's Learning Lab</h1>
          {/* Could add a refresh button here */}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="w-full sm:w-1/2">
            <SubjectSelector
              selectedSubject={selectedSubject}
              onChange={(subject) => setSelectedSubject(subject as "math" | "english" | "ict")}
            />
          </div>
          <div className="w-full sm:w-1/2">
            <GradeSelector
              selectedGrades={selectedGrades}
              onChange={setSelectedGrades}
              subject={selectedSubject}
              availableGrades={availableGrades}
            />
          </div>
        </div>

        {!showQuizForm && !showLessonBuilder && !showScaffoldedLessonBuilder ? (
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val);
              localStorage.setItem("activeDashboardTab", val);
            }}
          >
            <TabsList className="mb-8 flex-wrap h-auto gap-2">
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <Book size={16} />
                <span>Quiz Zone</span>
              </TabsTrigger>
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <FileText size={16} />
                <span>Lesson Builder</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Globe size={16} />
                <span>Public Library</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart size={16} />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                {getSubjectIcon()}
                <span>Content Generator</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quizzes">
              <QuizzesTab
                quizzes={filteredQuizzes}
                onCreateQuiz={() => setShowQuizForm(true)}
                onCopyCode={handleCopyCode}
                onEditQuiz={(q) => { setEditingQuiz(q); setShowQuizForm(true); }}
                onDeleteQuiz={handleDeleteQuiz}
                onTogglePublic={handleTogglePublicQuiz}
                subject={selectedSubject}
              />
            </TabsContent>

            <TabsContent value="lessons">
              <LessonsTab
                lessons={filteredLessons}
                onCreateLesson={() => setShowScaffoldedLessonBuilder(true)}
                onCopyCode={handleCopyCode}
                onEditLesson={(l) => {
                  setEditingLesson(l);
                  if (l.learningType === 'scaffolded') {
                    setShowScaffoldedLessonBuilder(true);
                  } else {
                    setShowLessonBuilder(true);
                  }
                }}
                onDeleteLesson={handleDeleteLesson}
                onTogglePublic={handleTogglePublicLesson}
                onRunLesson={(id) => navigate(`/teacher/lesson/${id}/run`)}
                subject={selectedSubject}
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
                getLeaderboardEntries={(quizId) => getLeaderboardEntries(results, quizId)}
                findQuizById={(id) => findQuizById(quizzes, id)}
                subject={selectedSubject}
              />
            </TabsContent>

            <TabsContent value="generate">
              <QuestionGeneratorTab
                grades={selectedGrades}
                subject={selectedSubject}
                onCreateQuiz={handleCreateQuiz}
                onCreateLesson={handleCreateLesson}
              />
            </TabsContent>
          </Tabs>
        ) : showQuizForm ? (
          <QuizForm
            grades={selectedGrades}
            onSave={handleCreateQuiz}
            onCancel={() => { setShowQuizForm(false); setEditingQuiz(null); }}
            subject={selectedSubject}
            initialData={editingQuiz}
          />
        ) : showScaffoldedLessonBuilder ? (
          <ScaffoldedLessonBuilder
            grades={selectedGrades}
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
            grades={selectedGrades}
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

