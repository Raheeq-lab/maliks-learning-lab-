
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from '@/components/NavBar';
import TeacherSignupForm from '@/components/teacher/TeacherSignupForm';
import SignupImageSection from '@/components/teacher/SignupImageSection';

const TeacherSignup: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary font-poppins relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <NavBar />

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl bg-bg-card/60 backdrop-blur-xl border-white/10 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 to-blue-600" />

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold text-white tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-gray-400 text-base mt-2">
                Join to build interactive quizzes and lessons
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <TeacherSignupForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherSignup;
