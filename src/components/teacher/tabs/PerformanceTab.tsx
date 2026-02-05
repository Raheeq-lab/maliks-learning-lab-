
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
  initialSelectedQuizId?: string;
}

const PerformanceTab: React.FC<PerformanceTabProps> = React.memo(({
  quizzes,
  getTotalStudents,
  getTotalCompletions,
  findQuizById,
  subject = "math",
  initialSelectedQuizId
}) => {
  const { toast } = useToast();
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Auto-select quiz from prop
  React.useEffect(() => {
    if (initialSelectedQuizId) {
      setSelectedQuizId(initialSelectedQuizId);
    }
  }, [initialSelectedQuizId]);

  const handleKickStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;

    try {
      const { error } = await supabase
        .from('quiz_results')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      // Optimistic update
      setLiveResults(prev => prev.filter(r => r.id !== studentId));

      toast({ title: "Student Removed", description: "The student has been kicked from the session." });
    } catch (error: any) {
      console.error("Error kicking student:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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
            <Radio size={24} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            Live Performance Dashboard
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
                    {/* Live Session Controls Section */}
                    <div className="bg-bg-card border-4 border-focus-blue/20 p-6 rounded-2xl shadow-inner space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-6">
                        {/* Session Toggle */}
                        <div className="flex items-center gap-4 bg-bg-secondary/50 p-3 rounded-xl border border-border">
                          <div className={`p-2 rounded-lg ${selectedQuiz?.is_live_session ? 'bg-success-green/20 text-success-green' : 'bg-bg-secondary text-text-tertiary'}`}>
                            <Radio size={24} className={selectedQuiz?.is_live_session ? 'animate-pulse' : ''} />
                          </div>
                          <div>
                            <p className="font-bold text-text-primary text-sm flex items-center gap-2">
                              Live Session Mode
                              {selectedQuiz?.is_live_session && (
                                <span className="flex h-2 w-2 rounded-full bg-success-green animate-ping"></span>
                              )}
                            </p>
                            <p className="text-[10px] text-text-tertiary uppercase font-bold">Synchronized Start</p>
                            {selectedQuiz?.accessCode && (
                              <div className="mt-2 px-3 py-1 bg-white border-2 border-dashed border-focus-blue/30 rounded-lg inline-block">
                                <p className="text-[10px] uppercase font-bold text-text-tertiary">Join Code</p>
                                <p className="text-xl font-black text-focus-blue tracking-widest">{selectedQuiz.accessCode}</p>
                              </div>
                            )}
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
                                toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
                              } else {
                                toast({ title: checked ? "Mode Enabled" : "Mode Disabled" });
                              }
                              setIsUpdating(false);
                            }}
                            disabled={isUpdating}
                          />
                        </div>

                        {/* Start/Reset Buttons */}
                        {selectedQuiz?.is_live_session && (
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block px-4 border-r border-border">
                              <p className="text-xs font-bold text-text-tertiary uppercase">{liveResults.length} Students</p>
                              <p className="text-xs text-text-secondary">{selectedQuiz.live_status === 'waiting' ? 'Ready to Start' : 'Running'}</p>
                            </div>

                            {selectedQuiz.live_status === 'waiting' ? (
                              <Button
                                onClick={async () => {
                                  setIsUpdating(true);
                                  await supabase.from('quizzes').update({ live_status: 'active' }).eq('id', selectedQuizId);
                                  setIsUpdating(false);
                                  toast({ title: "Quiz Started!" });
                                }}
                                className="bg-focus-blue hover:bg-focus-blue-dark text-white font-bold h-12 px-8 rounded-xl shadow-lg animate-bounce-subtle"
                                disabled={isUpdating || liveResults.length === 0}
                              >
                                <Play size={20} className="mr-2" fill="currentColor" />
                                START QUIZ NOW
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  setIsUpdating(true);
                                  await supabase.from('quizzes').update({ live_status: 'waiting' }).eq('id', selectedQuizId);
                                  setIsUpdating(false);
                                }}
                                className="h-12 px-6 border-error-coral text-error-coral hover:bg-error-coral/10 font-bold rounded-xl"
                                disabled={isUpdating}
                              >
                                <PauseCircle size={20} className="mr-2" />
                                RESET TO WAITING
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Cleanup Section */}
                        <div className="flex items-center gap-3 ml-auto">
                          {showClearConfirm ? (
                            <div className="flex items-center gap-2 bg-error-coral/10 p-2 rounded-lg border border-error-coral animate-in fade-in slide-in-from-right-2">
                              <span className="text-xs font-bold text-error-coral">Delete previous results?</span>
                              <Button size="sm" variant="destructive" onClick={handleClearResults} disabled={isUpdating}>Delete</Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(false)} disabled={isUpdating}>Exit</Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              className="text-text-tertiary hover:text-error-coral hover:bg-error-coral/10 flex flex-col h-auto py-2 px-3"
                              onClick={() => setShowClearConfirm(true)}
                              disabled={isUpdating}
                            >
                              <Trash2 size={20} />
                              <span className="text-[10px] font-bold mt-1 uppercase">Clear Data</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <LiveRaceView
                      students={liveResults}
                      quizTitle={selectedQuiz?.title || "Live Race"}
                      onKickStudent={handleKickStudent}
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
});

export default PerformanceTab;
