import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, BookText, Laptop } from 'lucide-react';
import NavBar from '@/components/NavBar';
import SubjectSelector from '@/components/SubjectSelector';
import { supabase } from '@/lib/supabase';

const StudentJoin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>("math");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the quiz.",
        variant: "destructive",
      });
      return;
    }

    if (!accessCode.trim()) {
      toast({
        title: "Access code required",
        description: "Please enter the quiz access code provided by your teacher.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    // Clean up the access code
    const cleanAccessCode = accessCode.trim().toUpperCase();

    try {
      // 1. Check for Quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('access_code', cleanAccessCode)
        .maybeSingle();

      if (quizError) {
        throw quizError;
      }

      if (quizData) {
        // Quiz found!
        console.log("Joined quiz:", quizData.title);

        // Store student data
        const studentData = {
          name: name,
          quizId: quizData.id,
          quizTitle: quizData.title,
          gradeLevel: quizData.grade_level,
          subject: quizData.subject
        };

        localStorage.setItem('mathWithMalikStudent', JSON.stringify(studentData));

        toast({
          title: "Quiz joined!",
          description: `Welcome to ${quizData.title}. Good luck!`,
        });

        navigate('/student-quiz');
        return;
      }

      // If no quiz found:
      toast({
        title: "Invalid access code",
        description: "No quiz found with this access code. Please check and try again.",
        variant: "destructive",
      });

    } catch (error: any) {
      console.error("Error joining:", error);
      toast({
        title: "Error joining",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getSubjectIcon = () => {
    switch (selectedSubject) {
      case "math": return <BookOpen size={28} className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />;
      case "english": return <BookText size={28} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />;
      case "ict": return <Laptop size={28} className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
      default: return <BookOpen size={28} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />;
    }
  };

  const getSubjectColor = () => {
    switch (selectedSubject) {
      case "math": return "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/20";
      case "english": return "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20";
      case "ict": return "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-900/20";
      default: return "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-900/20";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary font-poppins relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <NavBar />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md shadow-2xl bg-bg-card/60 backdrop-blur-xl border-white/10 overflow-hidden">
          <div className={`h-1.5 w-full ${getSubjectColor().split(' ')[0]} ${getSubjectColor().split(' ')[1]} ${getSubjectColor().split(' ')[2]}`} />

          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                {getSubjectIcon()}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground tracking-tight">Join a Quiz</CardTitle>
            <CardDescription className="text-muted-foreground text-base mt-2">
              Enter your name and the access code to join
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleJoin}>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80 font-medium ml-1">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="bg-bg-input/50 border-input focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-foreground placeholder:text-muted-foreground transition-all hover:bg-bg-input/70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-foreground/80 font-medium ml-1">Access Code</Label>
                <Input
                  id="accessCode"
                  placeholder="ABC123"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  required
                  maxLength={6}
                  className="tracking-[0.5em] text-center uppercase font-mono text-xl bg-bg-input/50 border-input focus:border-purple-500/50 focus:ring-purple-500/20 h-14 rounded-xl text-foreground placeholder:text-muted-foreground transition-all hover:bg-bg-input/70 placeholder:tracking-normal placeholder:font-sans placeholder:text-base"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  The 6-letter code provided by your teacher
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-foreground/80 font-medium ml-1">Preferred Subject</Label>
                <SubjectSelector
                  selectedSubject={selectedSubject}
                  onChange={setSelectedSubject}
                />
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-4 pb-8 pt-2">
              <Button
                type="submit"
                className={`w-full h-12 text-lg font-bold text-white shadow-lg border-none transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl ${getSubjectColor()}`}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  'Join Quiz'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default StudentJoin;
