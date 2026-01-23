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
      case "math": return <BookOpen size={24} className="text-purple-500" />;
      case "english": return <BookText size={24} className="text-green-500" />;
      case "ict": return <Laptop size={24} className="text-orange-500" />;
      default: return <BookOpen size={24} className="text-purple-500" />;
    }
  };

  const getSubjectColor = () => {
    switch (selectedSubject) {
      case "math": return "bg-purple-600 hover:bg-purple-700";
      case "english": return "bg-green-600 hover:bg-green-700";
      case "ict": return "bg-orange-600 hover:bg-orange-700";
      default: return "bg-purple-600 hover:bg-purple-700";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getSubjectIcon()}
            </div>
            <CardTitle className="text-2xl gradient-text">Join a Quiz</CardTitle>
            <CardDescription>
              Enter your name and the access code to join
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleJoin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  placeholder="Enter 6-digit code (e.g., ABC123)"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  required
                  maxLength={6}
                  className="tracking-widest text-center uppercase font-mono"
                />
                <p className="text-xs text-gray-500">
                  The 6-letter code provided by your teacher
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Preferred Subject</Label>
                <SubjectSelector
                  selectedSubject={selectedSubject}
                  onChange={setSelectedSubject}
                />
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className={`w-full ${getSubjectColor()}`}
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Now'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default StudentJoin;
