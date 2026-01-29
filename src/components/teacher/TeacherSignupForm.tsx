
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  school: z.string().optional(),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const TeacherSignupForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      school: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.name,
            school: values.school,
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Malik's Learning Lab!",
        });
        navigate('/teacher-dashboard');
      } else if (data.user) {
        // If email confirmation is enabled, session might be null.
        toast({
          title: "Account created! Please verify email.",
          description: "We've sent a confirmation link to your email. Please check your inbox and spam folder.",
          duration: 6000,
        });
        // Optional: navigate to login or stay here to let them read the message
        navigate('/teacher-login');
      }

    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = error.message || "Could not create account";

      if (errorMessage.includes("already registered")) {
        errorMessage = "An account with this email already exists. Please sign in.";
      } else if (errorMessage.includes("password")) {
        errorMessage = "Password should be at least 6 characters.";
      }

      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300 font-medium ml-1">Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Smith"
                  {...field}
                  className="bg-bg-input/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-white placeholder:text-gray-500 transition-all hover:bg-bg-input/70"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300 font-medium ml-1">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="teacher@school.edu"
                  {...field}
                  className="bg-bg-input/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-white placeholder:text-gray-500 transition-all hover:bg-bg-input/70"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300 font-medium ml-1">School (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Springfield Elementary"
                  {...field}
                  className="bg-bg-input/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-white placeholder:text-gray-500 transition-all hover:bg-bg-input/70"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300 font-medium ml-1">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="bg-bg-input/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-white placeholder:text-gray-500 transition-all hover:bg-bg-input/70"
                />
              </FormControl>
              <FormDescription className="text-gray-400 text-xs ml-1">
                Must be at least 6 characters.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl mt-4"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Teacher Account"}
        </Button>
        <div className="text-center text-sm text-gray-400 mt-6 pt-4 border-t border-white/5">
          Already have an account?{" "}
          <Link to="/teacher-login" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default TeacherSignupForm;
