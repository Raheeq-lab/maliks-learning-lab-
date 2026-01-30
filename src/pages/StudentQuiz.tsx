import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Clock, CheckCircle, XCircle, Zap, ArrowRight, Award, ThumbsUp } from "lucide-react";
import { StudentAnswer } from '@/types/quiz';
import { BookOpen, BookText, Laptop } from "lucide-react";
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

  // Power meter state
  const [power, setPower] = useState(50); // Starting power at 50%
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const maxPower = 100;

  // Load student data and quiz
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get student data
        const storedStudentData = localStorage.getItem('mathWithMalikStudent');
        if (!storedStudentData) {
          toast({
            title: "Error",
            description: "No student data found. Please join the quiz again.",
            variant: "destructive",
          });
          navigate('/student-join');
          return;
        }

        const student = JSON.parse(storedStudentData);
        setStudentData(student);

        // Get quiz data from Supabase
        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', student.quizId)
          .single();

        if (error || !quizData) {
          console.error("Error loading quiz:", error);
          toast({
            title: "Error",
            description: "Quiz not found or could not be loaded. Please contact your teacher.",
            variant: "destructive",
          });
          navigate('/student-join');
          return;
        }

        if (!quizData.questions || quizData.questions.length === 0) {
          toast({
            title: "Error",
            description: "This quiz doesn't have any questions. Please contact your teacher.",
            variant: "destructive",
          });
          navigate('/student-join');
          return;
        }

        setQuiz(quizData);
        setTimeLeft(quizData.time_limit || 30); // Use time_limit from database
        setIsLoading(false);

        // 3. Create initial quiz result for live tracking
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
          console.log("Live race result initialized:", resultData.id);
          setResultId(resultData.id);
        } else if (resultError) {
          console.error("Error creating live race result:", resultError.message || resultError);
        }
      } catch (error) {
        console.error("Error loading quiz:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz data. Please try again.",
          variant: "destructive",
        });
        navigate('/student-join');
      }
    };

    loadData();
  }, [navigate, toast]);

  // Timer effect
  useEffect(() => {
    if (isLoading || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up for this question, move to the next
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, quizCompleted, currentQuestionIndex]);

  // Updated Color Psychology Theme Logic
  const getSubjectColor = () => {
    if (!quiz || !quiz.subject) return {};

    switch (quiz.subject) {
      case "math":
        return {
          header: "bg-math-purple/10 border-b-math-purple",
          button: "bg-math-purple hover:bg-purple-700",
          selected: "border-math-purple bg-math-purple/10",
          text: "text-math-purple",
          border: "border-math-purple",
          completed: "text-math-purple"
        };
      case "english":
        return {
          header: "bg-english-green/10 border-b-english-green",
          button: "bg-english-green hover:bg-green-700",
          selected: "border-english-green bg-english-green/10",
          text: "text-english-green",
          border: "border-english-green",
          completed: "text-english-green"
        };
      case "ict":
        return {
          header: "bg-ict-orange/10 border-b-ict-orange",
          button: "bg-ict-orange hover:bg-orange-700",
          selected: "border-ict-orange bg-ict-orange/10",
          text: "text-ict-orange",
          border: "border-ict-orange",
          completed: "text-ict-orange"
        };
      default:
        return {
          header: "bg-bg-secondary border-b-gray-200",
          button: "bg-focus-blue hover:bg-focus-blue-dark",
          selected: "border-focus-blue bg-focus-blue-light",
          text: "text-focus-blue",
          border: "border-focus-blue",
          completed: "text-focus-blue"
        };
    }
  };

  const getSubjectIcon = () => {
    if (!quiz || !quiz.subject) return null;

    const colors = getSubjectColor();

    switch (quiz.subject) {
      case "math": return <BookOpen size={20} className={colors.text} />;
      case "english": return <BookText size={20} className={colors.text} />;
      case "ict": return <Laptop size={20} className={colors.text} />;
      default: return <BookOpen size={20} className={colors.text} />;
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (showFeedback) return; // Prevent selecting while showing feedback
    setSelectedOption(optionIndex);
  };

  // Motivation messages based on power level
  const getMotivationMessage = (power: number): string => {
    if (power >= 90) return "Incredible! You're unstoppable!";
    if (power >= 75) return "Amazing! Keep up the great work!";
    if (power >= 50) return "You're doing well! Keep going!";
    if (power >= 25) return "You can do better! Focus!";
    return "Don't give up! Every question is a new chance!";
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    // Save answer
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;

    // Update power based on answer
    const powerChange = isCorrect ? 10 : -5;
    const newPower = Math.max(0, Math.min(maxPower, power + powerChange));

    // Set feedback message
    const feedbackMsg = isCorrect
      ? `Correct! +10 Power! ${getMotivationMessage(newPower)}`
      : `Incorrect! That wasn't quite right. ${getMotivationMessage(newPower)}`;

    setFeedbackMessage(feedbackMsg);
    setShowFeedback(true);
    setIsAnimating(true);

    // Update power with animation
    setPower(newPower);

    // Play sound effect (will be silent if browser blocks autoplay)
    const sound = new Audio(isCorrect ? '/correct-sound.mp3' : '/incorrect-sound.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => { }); // Catch and ignore autoplay errors

    const answer: StudentAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIndex: selectedOption,
      isCorrect: isCorrect,
      timeTaken: (quiz.time_limit || 30) - timeLeft
    };

    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);

    // Update score
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Report progress to Supabase for Live Race
    if (resultId) {
      supabase
        .from('quiz_results')
        .update({
          score: updatedAnswers.filter(a => a.isCorrect).length,
          current_question: currentQuestionIndex + 1,
          answers: updatedAnswers
        })
        .eq('id', resultId)
        .then(({ error }) => {
          if (error) console.error("Error updating progress:", error);
          else console.log("Progress updated for question:", currentQuestionIndex + 1);
        });
    }

    // Hide feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setIsAnimating(false);

      // Check if this was the last question
      if (currentQuestionIndex === quiz.questions.length - 1) {
        // Quiz completed
        completeQuiz(updatedAnswers);
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setTimeLeft(quiz.time_limit || 30);
      }
    }, 2500); // Increased time slightly to allow reading feedback
  };

  const completeQuiz = async (finalAnswers: StudentAnswer[]) => {
    setQuizCompleted(true);

    const totalTimeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      // Finalize results in Supabase
      if (resultId) {
        const { error } = await supabase
          .from('quiz_results')
          .update({
            score: finalAnswers.filter(a => a.isCorrect).length,
            time_taken: totalTimeTaken,
            status: 'completed',
            answers: finalAnswers
          })
          .eq('id', resultId);

        if (error) throw error;
      } else {
        // Fallback: Insert new if somehow resultId is missing
        const { error } = await supabase
          .from('quiz_results')
          .insert([{
            student_name: studentData?.name || "Unknown Student",
            quiz_id: quiz.id,
            score: finalAnswers.filter(a => a.isCorrect).length,
            total_questions: quiz.questions.length,
            time_taken: totalTimeTaken,
            status: 'completed',
            answers: finalAnswers
          }]);

        if (error) throw error;
      }

      toast({
        title: "Quiz completed!",
        description: "Your results have been submitted.",
      });
    } catch (err) {
      console.error("Error in completeQuiz:", err);
      toast({
        title: "Warning",
        description: "Could not save results to server. Please show your score to the teacher.",
        variant: "destructive",
      });
    }

  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-4">
        <Card className="w-full max-w-md shadow-lg bg-bg-card border border-gray-100">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-focus-blue">Loading Quiz...</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-bg-secondary"></div>
              <div className="h-4 w-3/4 bg-bg-secondary rounded"></div>
              <div className="h-4 w-1/2 bg-bg-secondary rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const colors = getSubjectColor();

  if (quizCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
        <Card className="w-full max-w-lg shadow-xl border-t-8 border-focus-blue overflow-hidden bg-bg-card">
          <CardHeader className="text-center bg-bg-secondary/30 pb-0 pt-8">
            <div className="mx-auto w-20 h-20 bg-success-green/10 rounded-full flex items-center justify-center mb-4">
              <Award size={40} className="text-success-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-text-primary">Quiz Completed!</CardTitle>
            <p className="text-text-secondary">Here is how you did, {studentData?.name}</p>
          </CardHeader>
          <CardContent className="space-y-8 text-center pt-6">
            <div className="py-2">
              <div className={`text-7xl font-bold mb-2 ${colors.completed}`}>{score}/{quiz?.questions.length}</div>
              <p className="text-text-tertiary font-medium uppercase tracking-wide">Final Score</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg-secondary border border-gray-100">
                <p className="text-text-secondary text-sm mb-1">Time taken</p>
                <p className="text-lg font-bold text-text-primary">{formatTime(Math.floor((Date.now() - startTime) / 1000))}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary border border-gray-100">
                <p className="text-text-secondary text-sm mb-1">Accuracy</p>
                <p className="text-lg font-bold text-text-primary">{Math.round((score / quiz?.questions.length) * 100)}%</p>
              </div>
            </div>

            <div className="bg-bg-primary p-4 rounded-xl border border-gray-200">
              <p className="text-text-secondary mb-3 flex items-center justify-center gap-2">
                <Zap size={16} className="text-warning-amber" fill="currentColor" /> Final Power Level
              </p>
              <PowerMeter power={power} animate={false} />
            </div>

            <div className="flex items-center justify-center gap-2 text-xl font-bold text-focus-blue-dark">
              {power >= 80 ? "Superstar Status! 🌟" : power >= 60 ? "Champion! 🏆" : power >= 40 ? "Great Effort! 👍" : "Keep Practicing! 📚"}
            </div>
          </CardContent>
          <CardFooter className="bg-bg-secondary/30 p-6">
            <Button
              className={`w-full py-6 text-lg shadow-md transition-transform hover:scale-[1.02] ${colors.button} text-white`}
              onClick={() => navigate('/student-join')}
            >
              Join Another Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Make sure we have a quiz and questions before trying to render
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center p-8 bg-bg-card rounded-xl shadow-lg border border-error-coral/20">
          <p className="text-xl text-error-coral font-bold mb-4">No questions found for this quiz.</p>
          <Button
            className="bg-focus-blue hover:bg-focus-blue-dark text-white"
            onClick={() => navigate('/student-join')}
          >
            Return to Join Page
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary font-poppins">
      <header className={`shadow-md px-6 py-4 bg-bg-card/80 backdrop-blur-md sticky top-0 z-20 border-b-4 ${colors.header.split(" ").pop()}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.selected}`}>
              {getSubjectIcon()}
            </div>
            <div>
              <h1 className={`text-lg font-bold flex items-center gap-2 text-text-primary`}>
                {quiz?.title}
              </h1>
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <span className="font-medium bg-bg-secondary px-2 py-0.5 rounded text-xs uppercase">{quiz?.subject}</span>
                <span>Grade {quiz?.gradeLevel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Question</p>
              <p className="font-bold text-text-primary">{currentQuestionIndex + 1} <span className="text-text-tertiary text-sm font-normal">of {quiz?.questions.length}</span></p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-inner border border-border ${timeLeft < 10 ? 'bg-error-coral/10' : 'bg-bg-secondary/50'}`}>
              <Clock size={18} className={timeLeft < 10 ? "text-error-coral animate-pulse" : "text-text-secondary"} />
              <span className={`font-mono font-bold text-lg ${timeLeft < 10 ? "text-error-coral" : "text-text-primary"}`}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
          <div
            className={`h-full transition-all duration-500 ease-out bg-gradient-to-r from-progress-start via-progress-middle to-progress-end`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center max-w-4xl">

        {/* Power Meter floating above */}
        <div className="w-full max-w-2xl mb-6">
          <div className="bg-bg-card/60 backdrop-blur-md p-3 rounded-full shadow-sm border border-border flex items-center justify-between gap-4">
            <span className="ml-4 font-bold text-sm text-text-secondary uppercase">Power Level</span>
            <div className="flex-1">
              <PowerMeter power={power} animate={isAnimating} showIcon={false} />
            </div>
            <div className="mr-4 font-bold text-focus-blue">{power}%</div>
          </div>
        </div>

        <Card className="w-full max-w-3xl shadow-xl border-0 overflow-hidden rounded-2xl bg-bg-card/80 backdrop-blur-xl transition-all duration-300 relative border border-white/5">

          {/* Accent Border Left */}
          <div className={`absolute left-0 top-0 bottom-0 w-2 ${colors.button}`}></div>

          <CardHeader className="pt-8 pb-4 px-8">
            {showFeedback && feedbackMessage && (
              <div className={`p-4 rounded-xl mb-6 text-center animate-bounce-subtle shadow-sm ${feedbackMessage.includes("Correct")
                ? "bg-success-green-light border-2 border-success-green text-green-900"
                : "bg-error-coral-light border-2 border-error-coral text-red-900"
                }`}>
                <div className="flex items-center justify-center gap-3">
                  {feedbackMessage.includes("Correct")
                    ? <CheckCircle size={24} className="text-success-green fill-green-100" />
                    : <XCircle size={24} className="text-error-coral fill-red-100" />
                  }
                  <p className="font-bold text-lg">{feedbackMessage}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <span className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary text-text-tertiary font-bold text-sm mt-1`}>
                {currentQuestionIndex + 1}
              </span>
              <CardTitle className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
                {currentQuestion?.text}
              </CardTitle>
            </div>

            {currentQuestion?.imageUrl && (
              <div className="mt-6">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="mx-auto max-h-80 rounded-xl border border-border shadow-sm"
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 gap-4 mt-4">
              {currentQuestion?.options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  className={`
                    p-5 rounded-xl cursor-pointer border-2 transition-all duration-200 group relative overflow-hidden
                    ${selectedOption === index
                      ? `${colors.selected} shadow-md transform scale-[1.01]`
                      : 'border-border hover:border-focus-blue-light hover:bg-bg-secondary/50 bg-bg-secondary/20'
                    }
                    ${showFeedback && selectedOption === index
                      ? (feedbackMessage?.includes("Correct")
                        ? "!border-success-green !bg-success-green-light"
                        : "!border-error-coral !bg-error-coral-light")
                      : ""}
                  `}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`
                        w-10 h-10 flex items-center justify-center rounded-full border-2 text-lg font-bold transition-colors
                        ${selectedOption === index
                        ? `${colors.text} border-current bg-bg-card`
                        : 'bg-bg-secondary/80 text-text-secondary border-transparent group-hover:bg-bg-card group-hover:border-focus-blue-light group-hover:text-focus-blue'
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={`text-lg font-medium ${selectedOption === index ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                      {option}
                    </span>

                    {selectedOption === index && (
                      <div className="ml-auto">
                        {showFeedback ? (
                          feedbackMessage?.includes("Correct")
                            ? <CheckCircle className="text-success-green" fill="currentColor" />
                            : <XCircle className="text-error-coral" fill="currentColor" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full ${colors.button}`}></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="px-8 py-6 bg-bg-secondary/20 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-8 h-8 rounded-full bg-focus-blue-light text-focus-blue flex items-center justify-center font-bold">
                {studentData?.name.charAt(0)}
              </div>
              <span className="font-medium">{studentData?.name}</span>
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={selectedOption === null || showFeedback}
              className={`
                px-8 py-6 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl rounded-xl
                ${colors.button} text-white disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {currentQuestionIndex === quiz?.questions.length - 1 ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default StudentQuiz;
