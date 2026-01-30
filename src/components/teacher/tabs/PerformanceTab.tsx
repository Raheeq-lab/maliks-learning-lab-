
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeaderboardComponent from '@/components/LeaderboardComponent';
import { Quiz, LeaderboardEntry } from '@/types/quiz';
import { BarChart, BookOpen, BookText, Laptop, Zap } from 'lucide-react';
import LiveRaceView from '@/components/teacher/LiveRaceView';
import { supabase } from '@/lib/supabase';

interface PerformanceTabProps {
  quizzes: Quiz[];
  getTotalStudents: () => number;
  getTotalCompletions: () => number;
  getLeaderboardEntries: (quizId: string) => LeaderboardEntry[];
  findQuizById: (id: string) => Quiz | undefined;
  subject?: "math" | "english" | "ict";
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({
  quizzes,
  getTotalStudents,
  getTotalCompletions,
  getLeaderboardEntries,
  findQuizById,
  subject = "math"
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [liveResults, setLiveResults] = useState<any[]>([]);

  // Subscribe to live results when a quiz is selected
  React.useEffect(() => {
    if (!selectedQuizId) {
      setLiveResults([]);
      return;
    }

    // 1. Fetch initial results for this quiz
    const fetchInitialResults = async () => {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('quiz_id', selectedQuizId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLiveResults(data);
      }
    };

    fetchInitialResults();

    // 2. Set up realtime subscription
    const channel = supabase
      .channel(`live-quiz-${selectedQuizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_results',
          filter: `quiz_id=eq.${selectedQuizId}`
        },
        (payload) => {
          console.log("Realtime event received:", payload.eventType, payload.new);
          if (payload.eventType === 'INSERT') {
            setLiveResults(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLiveResults(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
          } else if (payload.eventType === 'DELETE') {
            setLiveResults(prev => prev.filter(r => r.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedQuizId]);

  // Filter quizzes by selected subject AND grade
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSubject = quiz.subject === subject;
    const matchesGrade = filterGrade === "all" || quiz.gradeLevel === parseInt(filterGrade) || (quiz as any).grade_level === parseInt(filterGrade);
    return matchesSubject && matchesGrade;
  });

  const leaderboard = selectedQuizId ? getLeaderboardEntries(selectedQuizId) : [];
  const selectedQuiz = selectedQuizId ? findQuizById(selectedQuizId) : undefined;

  // Get color based on subject
  const getSubjectColor = () => {
    switch (subject) {
      case "math": return "border-l-purple-500 from-purple-50 to-white";
      case "english": return "border-l-green-500 from-green-50 to-white";
      case "ict": return "border-l-orange-500 from-orange-50 to-white";
      default: return "border-l-purple-500 from-purple-50 to-white";
    }
  };

  const getSubjectHeaderColor = () => {
    switch (subject) {
      case "math": return "text-purple-700";
      case "english": return "text-green-700";
      case "ict": return "text-orange-700";
      default: return "text-purple-700";
    }
  };

  const getSubjectIcon = () => {
    switch (subject) {
      case "math": return <BookOpen size={20} className="text-purple-500" />;
      case "english": return <BookText size={20} className="text-green-500" />;
      case "ict": return <Laptop size={20} className="text-orange-500" />;
      default: return <BookOpen size={20} className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-bg-secondary ${subject === 'math' ? 'text-math-purple' : subject === 'english' ? 'text-english-green' : 'text-ict-orange'
            }`}>
            <BarChart size={24} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            {subject.charAt(0).toUpperCase() + subject.slice(1)} Performance Analytics
          </h2>
        </div>
        <div className="w-[180px]">
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="bg-bg-input border-border">
              <SelectValue placeholder="Filter by Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {[...Array(11)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>Grade {i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-10 ${subject === 'math' ? 'bg-math-purple' : subject === 'english' ? 'bg-english-green' : 'bg-ict-orange'
            }`}></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-4xl font-bold text-text-primary">{getTotalStudents()}</CardTitle>
            <CardDescription className="font-medium text-text-secondary">Total Students</CardDescription>
          </CardHeader>
          <div className={`h-1.5 w-full absolute bottom-0 left-0 ${subject === 'math' ? 'bg-math-purple' : subject === 'english' ? 'bg-english-green' : 'bg-ict-orange'
            }`}></div>
        </Card>

        <Card className="border-none shadow-lg relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-10 ${subject === 'math' ? 'bg-math-purple' : subject === 'english' ? 'bg-english-green' : 'bg-ict-orange'
            }`}></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-4xl font-bold text-text-primary">{getTotalCompletions()}</CardTitle>
            <CardDescription className="font-medium text-text-secondary">Total Quiz Completions</CardDescription>
          </CardHeader>
          <div className={`h-1.5 w-full absolute bottom-0 left-0 ${subject === 'math' ? 'bg-math-purple' : subject === 'english' ? 'bg-english-green' : 'bg-ict-orange'
            }`}></div>
        </Card>

        <Card className="border-none shadow-lg relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-10 ${subject === 'math' ? 'bg-math-purple' : subject === 'english' ? 'bg-english-green' : 'bg-ict-orange'
            }`}></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-4xl font-bold text-text-primary">{filteredQuizzes.length}</CardTitle>
            <CardDescription className="font-medium text-text-secondary">Total {subject.charAt(0).toUpperCase() + subject.slice(1)} Quizzes</CardDescription>
          </CardHeader>
          <div className={`h-1.5 w-full absolute bottom-0 left-0 ${subject === 'math' ? 'bg-math-purple' : subject === 'english' ? 'bg-english-green' : 'bg-ict-orange'
            }`}></div>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="live-race" className="flex items-center gap-1.5">
            <Zap size={14} className="text-focus-blue" />
            Live Race
          </TabsTrigger>
          <TabsTrigger value="analytics">Detailed Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="live-race">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={20} className="text-focus-blue" />
                Live Student Progress
              </CardTitle>
              <CardDescription>Watch your students race through the quiz in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="max-w-md">
                  <label className="text-sm font-medium mb-1 block">Select Active Quiz</label>
                  <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quiz to watch" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredQuizzes.map(quiz => (
                        <SelectItem key={quiz.id} value={quiz.id}>{quiz.title} (Grade {quiz.gradeLevel})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedQuizId ? (
                  <LiveRaceView
                    students={liveResults}
                    quizTitle={selectedQuiz?.title || "Live Race"}
                  />
                ) : (
                  <div className="text-center py-16 bg-bg-secondary/20 rounded-xl border-2 border-dashed border-border">
                    <Zap size={48} className="mx-auto mb-4 text-text-tertiary" />
                    <h3 className="text-lg font-bold text-text-primary">Ready to Race?</h3>
                    <p className="text-text-secondary max-w-sm mx-auto">
                      Select a quiz above to see your students' progress as they answer questions live!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Leaderboard</CardTitle>
              <CardDescription>View top performers for each quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Quiz</label>
                  <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quiz" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredQuizzes.map(quiz => (
                        <SelectItem key={quiz.id} value={quiz.id}>{quiz.title} (Grade {quiz.gradeLevel})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedQuizId && leaderboard.length > 0 ? (
                  <LeaderboardComponent
                    entries={leaderboard}
                    quizTitle={selectedQuiz?.title || "Quiz"}
                  />
                ) : selectedQuizId ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No results for this quiz yet.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center mb-2">
                      {getSubjectIcon()}
                    </div>
                    <p className="text-gray-500">Select a quiz to view its leaderboard.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>Insights into student performance</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <BarChart size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Detailed analytics coming soon!</p>
                <p className="text-sm text-gray-400">This feature is under development.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceTab;
