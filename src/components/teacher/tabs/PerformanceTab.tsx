
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Quiz } from '@/types/quiz';
import { BarChart, BookOpen, BookText, Laptop, Zap, Play, Radio, Users, PauseCircle, Trash2 } from 'lucide-react';
import LiveRaceView from '@/components/teacher/LiveRaceView';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

interface PerformanceTabProps {
  quizzes: Quiz[];
  getTotalStudents: () => number;
  getTotalCompletions: () => number;
  findQuizById: (id: string) => Quiz | undefined;
  subject?: "math" | "english" | "ict";
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({
  quizzes,
  getTotalStudents,
  getTotalCompletions,
  findQuizById,
  subject = "math"
}) => {
  const { toast } = useToast();
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearResults = async () => {
    if (!selectedQuizId) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('quiz_results')
        .delete()
        .eq('quiz_id', selectedQuizId);

      if (error) throw error;

      setLiveResults([]);
      setShowClearConfirm(false);

      toast({
        title: "Session Cleared",
        description: "All previous results for this quiz have been removed. You can now start a fresh session.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear session data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

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

  const selectedQuiz = filteredQuizzes.find(q => q.id === selectedQuizId);

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

      <Tabs defaultValue="live-race" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live-race" className="flex items-center gap-1.5">
            <Zap size={14} className="text-focus-blue" />
            Live Race
          </TabsTrigger>
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
                  <div className="space-y-6">
                    {/* Live Session Controls */}
                    <div className="bg-bg-secondary/40 p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedQuiz?.is_live_session ? 'bg-success-green/20 text-success-green' : 'bg-bg-secondary text-text-tertiary'}`}>
                          <Radio size={20} className={selectedQuiz?.is_live_session ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary flex items-center gap-2">
                            Live Session Mode
                            {selectedQuiz?.is_live_session && (
                              <span className="flex h-2 w-2 rounded-full bg-success-green"></span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary">Students wait for your signal to start</p>
                        </div>
                        <Switch
                          checked={selectedQuiz?.is_live_session || false}
                          onCheckedChange={async (checked) => {
                            setIsUpdating(true);
                            const { error } = await supabase
                              .from('quizzes')
                              .update({
                                is_live_session: checked,
                                live_status: checked ? 'waiting' : 'idle'
                              })
                              .eq('id', selectedQuizId);

                            if (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update quiz settings.",
                                variant: "destructive"
                              });
                            } else {
                              toast({
                                title: checked ? "Live Session Enabled" : "Live Session Disabled",
                                description: checked ? "Students will now wait for you to start the quiz." : "Students can start the quiz normally."
                              });
                            }
                            setIsUpdating(false);
                          }}
                          disabled={isUpdating}
                        />
                      </div>

                      {selectedQuiz?.is_live_session && (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                              <Users size={16} />
                              {liveResults.length} Students Joined
                            </div>
                            <p className="text-xs text-text-tertiary">
                              {selectedQuiz.live_status === 'waiting' ? 'Ready to begin' : 'Session active'}
                            </p>
                          </div>

                          {selectedQuiz.live_status === 'waiting' ? (
                            <Button
                              onClick={async () => {
                                setIsUpdating(true);
                                const { error } = await supabase
                                  .from('quizzes')
                                  .update({ live_status: 'active' })
                                  .eq('id', selectedQuizId);

                                if (error) {
                                  toast({ title: "Error", description: "Failed to start quiz.", variant: "destructive" });
                                } else {
                                  toast({ title: "Quiz Started!", description: "All joined students have been signaled to start." });
                                }
                                setIsUpdating(false);
                              }}
                              className="bg-focus-blue hover:bg-focus-blue/90 text-white gap-2 px-6"
                              disabled={isUpdating || liveResults.length === 0}
                            >
                              <Play size={18} fill="currentColor" />
                              START QUIZ FOR ALL
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                setIsUpdating(true);
                                await supabase
                                  .from('quizzes')
                                  .update({ live_status: 'waiting' })
                                  .eq('id', selectedQuizId);
                                setIsUpdating(false);
                              }}
                              className="gap-2 border-error-coral text-error-coral hover:bg-error-coral/10"
                            >
                              <PauseCircle size={18} />
                              RESET TO WAITING
                            </Button>
                          )}
                        </div>
                      )}


                      <div className="flex items-center gap-2 border-l border-border pl-4 ml-2">
                        {showClearConfirm ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                            <p className="text-xs font-bold text-error-coral">Delete results?</p>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-3 text-xs"
                              onClick={handleClearResults}
                              disabled={isUpdating}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-xs"
                              onClick={() => setShowClearConfirm(false)}
                              disabled={isUpdating}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-text-tertiary hover:text-error-coral hover:bg-error-coral/10 gap-1.5 transition-colors"
                            onClick={() => setShowClearConfirm(true)}
                            disabled={!selectedQuizId || isUpdating}
                          >
                            <Trash2 size={16} />
                            <span className="text-xs font-medium">Clear Data</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <LiveRaceView
                      students={liveResults}
                      quizTitle={selectedQuiz?.title || "Live Race"}
                    />
                  </div>
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


      </Tabs>
    </div >
  );
};

export default PerformanceTab;
