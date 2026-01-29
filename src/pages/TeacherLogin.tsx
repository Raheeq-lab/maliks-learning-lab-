
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';
import SignupImageSection from '@/components/teacher/SignupImageSection';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
});

const TeacherLogin: React.FC = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                toast({
                    title: "Welcome back!",
                    description: "You have successfully signed in.",
                });
                navigate('/teacher-dashboard');
            }
        } catch (error: any) {
            toast({
                title: "Login failed",
                description: error.message || "Invalid credentials",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                            <CardTitle className="text-3xl font-bold text-white tracking-tight">Teacher Login</CardTitle>
                            <CardDescription className="text-gray-400 text-base mt-2">
                                Sign in to manage your quizzes and lessons
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                                                        className="bg-bg-input/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-text-primary placeholder:text-gray-500 transition-all hover:bg-bg-input/70"
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
                                                        className="bg-bg-input/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-xl text-text-primary placeholder:text-gray-500 transition-all hover:bg-bg-input/70"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl mt-4"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing in..." : "Sign In"}
                                    </Button>

                                </form>
                            </Form>

                            <div className="mt-4 flex flex-col gap-4">
                                <div className="text-center">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-sm text-purple-400 hover:text-purple-300 px-0 font-normal">
                                                Forgot your password?
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md bg-bg-card border-border">
                                            <DialogHeader>
                                                <DialogTitle className="text-text-primary">Reset Password</DialogTitle>
                                                <DialogDescription className="text-text-secondary">
                                                    Enter your email address and we'll send you a link to reset your password.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);
                                                const email = formData.get('reset-email') as string;

                                                if (!email) return;

                                                try {
                                                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                                        redirectTo: `${window.location.origin}/update-password`,
                                                    });
                                                    if (error) throw error;

                                                    toast({
                                                        title: "Reset link sent",
                                                        description: "Check your email for the password reset link.",
                                                    });
                                                } catch (error: any) {
                                                    toast({
                                                        title: "Error",
                                                        description: error.message,
                                                        variant: "destructive",
                                                    });
                                                }
                                            }} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="reset-email" className="text-text-primary">Email</Label>
                                                    <Input
                                                        id="reset-email"
                                                        name="reset-email"
                                                        type="email"
                                                        placeholder="teacher@school.edu"
                                                        required
                                                        className="bg-bg-input border-border text-text-primary"
                                                    />
                                                </div>
                                                <DialogFooter className="sm:justify-start">
                                                    <DialogClose asChild>
                                                        <Button type="button" variant="secondary">Cancel</Button>
                                                    </DialogClose>
                                                    <Button type="submit" className="bg-focus-blue text-white hover:bg-focus-blue-dark">
                                                        Send Reset Link
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="text-center text-sm text-gray-400 pt-4 border-t border-white/5">
                                    Don't have an account?{" "}
                                    <Link to="/teacher-signup" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors hover:underline">
                                        Sign up
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default TeacherLogin;
