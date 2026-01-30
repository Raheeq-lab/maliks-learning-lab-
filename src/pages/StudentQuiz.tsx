import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Clock, CheckCircle, XCircle, Zap, ArrowRight, Award, Users, BookOpen, BookText, Laptop, PauseCircle } from "lucide-react";
import { StudentAnswer } from '@/types/quiz';
import PowerMeter from '@/components/PowerMeter';
import { supabase } from '@/lib/supabase';

interface StudentData {
  name: string;
  quizId: string;
  quizTitle: string;
  gradeLevel: number;
}

const StudentQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [resultId, setResultId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [sessionTerminated, setSessionTerminated] = useState(false);

  // Power meter state
  const [power, setPower] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const maxPower = 100;

  // 1. Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedStudentData = localStorage.getItem('mathWithMalikStudent');
        if (!storedStudentData) {
          toast({ title: "Error", description: "No student data found.", variant: "destructive" });
          navigate('/student-join');
          return;
        }

        const student = JSON.parse(storedStudentData);
        setStudentData(student);

        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', student.quizId)
          .single();

        if (error || !quizData || !quizData.questions?.length) {
          toast({ title: "Error", description: "Quiz not found or empty.", variant: "destructive" });
          navigate('/student-join');
          return;
        }

        setQuiz(quizData);
        setTimeLeft(quizData.time_limit || 30);
        setIsLoading(false);

        // Initialize quiz result
        const { data: resultData, error: resultError } = await supabase
          .from('quiz_results')
          .insert([{
            student_name: student.name || "Unknown Student",
            quiz_id: quizData.id,
            score: 0,
            total_questions: quizData.questions.length,
            time_taken: 0,
            current_question: 0,
            status: 'in-progress',
            answers: []
          }])
          .select()
          .single();

        if (!resultError && resultData) {
          setResultId(resultData.id);
        }
      } catch (err) {
        console.error("Load error:", err);
        navigate('/student-join');
      }
    };
    loadData();
  }, [navigate]);

  // 2. Realtime subscription for synchronized start
  useEffect(() => {
    if (!quiz?.id || !quiz.is_live_session) return;

    const channel = supabase
      .channel(`quiz-status-${quiz.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quizzes', filter: `id=eq.${quiz.id}` },
        (payload) => {
          setQuiz(prev => ({ ...prev, live_status: payload.new.live_status }));
          if (payload.new.live_status === 'active') {
            toast({ title: "Quiz Started!", description: "The teacher has started the quiz. Good luck!" });
          } else if (payload.new.live_status === 'idle') {
            setSessionTerminated(true);
            toast({ title: "Session Ended", description: "The teacher has ended this live session.", variant: "destructive" });
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [quiz?.id, quiz?.is_live_session]);

  // 3. Timer effect
  useEffect(() => {
    if (isLoading || quizCompleted || sessionTerminated || (quiz?.is_live_session && quiz?.live_status === 'waiting')) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, quizCompleted, currentQuestionIndex, quiz?.is_live_session, quiz?.live_status]);

  // Logic helpers
  const getSubjectColor = () => {
    if (!quiz?.subject) return { header: "bg-bg-secondary border-b-gray-200", button: "bg-focus-blue", selected: "border-focus-blue bg-focus-blue-light", text: "text-focus-blue", completed: "text-focus-blue" };
    switch (quiz.subject) {
      case "math": return { header: "bg-math-purple/10 border-b-math-purple", button: "bg-math-purple", selected: "border-math-purple bg-math-purple/10", text: "text-math-purple", completed: "text-math-purple" };
      case "english": return { header: "bg-english-green/10 border-b-english-green", button: "bg-english-green", selected: "border-english-green bg-english-green/10", text: "text-english-green", completed: "text-english-green" };
      case "ict": return { header: "bg-ict-orange/10 border-b-ict-orange", button: "bg-ict-orange", selected: "border-ict-orange bg-ict-orange/10", text: "text-ict-orange", completed: "text-ict-orange" };
      default: return { header: "bg-bg-secondary border-b-gray-200", button: "bg-focus-blue", selected: "border-focus-blue bg-focus-blue-light", text: "text-focus-blue", completed: "text-focus-blue" };
    }
  };

  const getSubjectIcon = () => {
    const colors = getSubjectColor();
    switch (quiz?.subject) {
      case "math": return <BookOpen size={20} className={colors.text} />;
      case "english": return <BookText size={20} className={colors.text} />;
      case "ict": return <Laptop size={20} className={colors.text} />;
      default: return <BookOpen size={20} className={colors.text} />;
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    const powerChange = isCorrect ? 10 : -5;
    const newPower = Math.max(0, Math.min(maxPower, power + powerChange));

    setFeedbackMessage(isCorrect ? "Correct! +10 Power!" : "Incorrect!");
    setShowFeedback(true);
    setIsAnimating(true);
    setPower(newPower);

    const answer: StudentAnswer = { questionId: currentQuestion.id, selectedOptionIndex: selectedOption, isCorrect, timeTaken: (quiz.time_limit || 30) - timeLeft };
    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);
    if (isCorrect) setScore(prev => prev + 1);

    if (resultId) {
      supabase.from('quiz_results').update({ score: updatedAnswers.filter(a => a.isCorrect).length, current_question: currentQuestionIndex + 1, answers: updatedAnswers }).eq('id', resultId).then();
    }

    setTimeout(() => {
      setShowFeedback(false);
      setIsAnimating(false);
      if (currentQuestionIndex === quiz.questions.length - 1) {
        completeQuiz(updatedAnswers);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setTimeLeft(quiz.time_limit || 30);
      }
    }, 2000);
  };

  const completeQuiz = async (finalAnswers: StudentAnswer[]) => {
    setQuizCompleted(true);
    const totalTimeTaken = Math.floor((Date.now() - startTime) / 1000);
    if (resultId) {
      await supabase.from('quiz_results').update({ score: finalAnswers.filter(a => a.isCorrect).length, time_taken: totalTimeTaken, status: 'completed', answers: finalAnswers }).eq('id', resultId);
    }
    toast({ title: "Quiz completed!", description: "Your results have been submitted." });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Rendering
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const colors = getSubjectColor();

  if (!isLoading && quiz?.is_live_session && quiz?.live_status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-4">
        <Card className="w-full max-w-xl shadow-2xl bg-bg-card border-none overflow-hidden relative z-10">
          <div className="h-2 bg-gradient-to-r from-math-purple via-focus-blue to-english-green"></div>
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-24 h-24 bg-bg-secondary rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Zap size={48} className="text-warning-amber fill-warning-amber/20 animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-bold text-text-primary mb-2">Waiting Room</CardTitle>
            <p className="text-text-secondary text-lg">Get ready, {studentData?.name}!</p>
          </CardHeader>
          <CardContent className="text-center py-6 px-10 space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 bg-bg-secondary/50 px-6 py-3 rounded-2xl border border-border animate-bounce-subtle">
                <span className="font-bold text-focus-blue">Teacher is preparing the quiz...</span>
              </div>
              <p className="text-sm text-text-secondary">Stay on this page. The quiz will start automatically.</p>
            </div>
          </CardContent>
          <CardFooter className="pb-10 pt-4 flex justify-center text-sm text-text-tertiary">
            <Users size={14} className="mr-2" /> Stay on this page to join the race
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (sessionTerminated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-4">
        <Card className="w-full max-w-xl shadow-2xl bg-bg-card border-t-8 border-error-coral overflow-hidden">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto w-24 h-24 bg-error-coral/10 rounded-full flex items-center justify-center mb-6">
              <PauseCircle size={48} className="text-error-coral" />
            </div>
            <CardTitle className="text-3xl font-bold text-text-primary mb-2">Session Ended</CardTitle>
            <p className="text-text-secondary text-lg">The teacher has ended this live session.</p>
          </CardHeader>
          <CardContent className="text-center py-6 px-10">
            <p className="text-text-secondary">Your progress has been saved, but the live race is no longer active.</p>
          </CardContent>
          <CardFooter className="pb-10 pt-4 flex justify-center">
            <Button onClick={() => navigate('/student-join')} className="bg-bg-secondary text-text-primary hover:bg-bg-secondary/80 px-8 py-6 rounded-xl font-bold">
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
        <Card className="w-full max-w-lg shadow-xl border-t-8 border-focus-blue bg-bg-card">
          <CardHeader className="text-center pt-8">
            <Award size={40} className="text-success-green mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Quiz Completed!</CardTitle>
            <p className="text-text-secondary">Great job, {studentData?.name}!</p>
          </CardHeader>
          <CardContent className="space-y-8 text-center pt-6">
            <div className="text-7xl font-bold">{score}/{quiz?.questions.length}</div>
            <div className="bg-bg-primary p-4 rounded-xl border border-gray-200">
              <PowerMeter power={power} animate={false} />
            </div>
          </CardContent>
          <CardFooter className="p-6">
            <Button className="w-full py-6 text-lg" onClick={() => navigate('/student-join')}>Join Another</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercentage = (currentQuestionIndex / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary font-poppins">
      <header className={`shadow-md px-6 py-4 bg-bg-card/80 backdrop-blur-md sticky top-0 z-20 border-b-4 ${colors.header.split(" ").pop()}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.selected}`}>{getSubjectIcon()}</div>
            <h1 className="text-lg font-bold">{quiz?.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 10 ? 'bg-error-coral/10 text-error-coral' : 'bg-bg-secondary/50'}`}>
              <Clock size={18} />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
          <div className="h-full bg-focus-blue transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center max-w-4xl">
        <div className="w-full max-w-2xl mb-6 space-y-2">
          <div className="flex justify-between items-end px-2">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-success-green tracking-wider">Correct</span>
                <span className="text-2xl font-black text-text-primary leading-none">{score}</span>
              </div>
              <div className="flex flex-col border-l border-border pl-4">
                <span className="text-[10px] uppercase font-bold text-error-coral tracking-wider">Wrong</span>
                <span className="text-2xl font-black text-text-primary leading-none">{answers.filter(a => !a.isCorrect).length}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Progress</span>
              <p className="text-sm font-bold text-text-secondary">{currentQuestionIndex + 1} / {quiz?.questions.length}</p>
            </div>
          </div>
          <PowerMeter power={power} animate={isAnimating} />
        </div>

        <Card className="w-full max-w-3xl shadow-xl rounded-2xl bg-bg-card relative overflow-hidden border">
          <div className={`absolute left-0 top-0 bottom-0 w-2 ${colors.button}`}></div>
          <CardHeader className="pt-8 px-8">
            {showFeedback && <div className="p-4 rounded-xl mb-6 text-center bg-bg-secondary font-bold text-lg">{feedbackMessage}</div>}
            <CardTitle className="text-2xl font-bold">{currentQuestion?.text}</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 gap-4 mt-4">
              {currentQuestion?.options.map((option: string, index: number) => {
                const isCorrect = index === currentQuestion.correctOptionIndex;
                const isSelected = selectedOption === index;

                let feedbackClass = "border-border hover:bg-bg-secondary";
                if (showFeedback) {
                  if (isCorrect) {
                    feedbackClass = "border-success-green bg-success-green text-white shadow-lg scale-[1.02] z-10";
                  } else if (isSelected && !isCorrect) {
                    feedbackClass = "border-error-coral bg-error-coral text-white shadow-lg scale-[1.02] z-10";
                  } else {
                    feedbackClass = "border-border opacity-40 grayscale-[0.5]";
                  }
                } else if (isSelected) {
                  feedbackClass = `${colors.selected.split(' ')[0]} border-current ring-4 ring-current/10`;
                }

                return (
                  <div
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 transform ${feedbackClass} ${!showFeedback && 'hover:scale-[1.01] active:scale-[0.99]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${isSelected ? 'bg-white text-current' : 'bg-bg-secondary text-text-tertiary'}`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-lg font-bold">{option}</span>
                      </div>
                      {showFeedback && isCorrect && <CheckCircle className="text-white animate-in zoom-in duration-300" size={28} fill="currentColor" />}
                      {showFeedback && isSelected && !isCorrect && <XCircle className="text-white animate-in zoom-in duration-300" size={28} fill="currentColor" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="px-8 py-6 border-t flex justify-between items-center">
            <span className="font-medium text-text-secondary">{studentData?.name}</span>
            <Button onClick={handleNextQuestion} disabled={selectedOption === null || showFeedback} className={`${colors.button} text-white px-8 py-6 rounded-xl font-bold`}>
              {currentQuestionIndex === quiz.questions.length - 1 ? "Finish" : "Next"} <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default StudentQuiz;
