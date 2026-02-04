
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  BookOpen,
  Users,
  Award,
  Laptop,
  BookText,
  Sparkles,
  Zap,
  CheckCircle2,
  Mail, Info, Shield, FileText, CheckCircle, AlertTriangle, Heart
} from "lucide-react";
import NavBar from '@/components/NavBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Reusable Section Component for Footer Modals
const Section = ({ title, icon: Icon, children }: { title: string, icon?: any, children: React.ReactNode }) => (
  <div className="mb-6 last:mb-0">
    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
      {Icon && <Icon size={18} className="text-focus-blue" />}
      {title}
    </h3>
    <div className="text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed text-sm">
      {children}
    </div>
  </div>
);

const Index: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col font-poppins bg-bg-primary transition-colors duration-300">
      <NavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-focus-blue-light/50 filter blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-success-green-light/50 filter blur-3xl"></div>
          <div className="absolute top-[40%] left-[20%] w-64 h-64 rounded-full bg-warning-amber-light/40 filter blur-3xl"></div>
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-focus-blue-light/50 text-focus-blue-dark font-semibold text-sm mb-6 animate-fade-in shadow-sm border border-focus-blue-light">
            <Sparkles size={16} />
            <span>The Future of Learning is Here</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-text-primary tracking-tight leading-tight">
            Learning Made <span className="bg-clip-text text-transparent bg-gradient-to-r from-focus-blue to-purple-600">Fun & Focus-Friendly</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            An interactive platform designed to boost engagement and retention in Math, English, and ICT through color-driven lessons.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/student-join">
              <Button size="lg" className="h-14 px-8 text-lg bg-focus-blue hover:bg-focus-blue-dark text-white rounded-full shadow-lg transition-transform hover:scale-105">
                Join as Student
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/teacher-signup">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-gray-200 hover:border-text-primary hover:bg-bg-secondary text-text-primary rounded-full transition-all">
                Sign Up as Teacher
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-section relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] rounded-t-[3rem] transition-colors duration-300">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Explore Our Subjects</h2>
            <div className="h-1 w-24 bg-focus-blue mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Math */}
            <div className="group bg-bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-math-purple"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-math-purple/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-math-purple/10 text-math-purple mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-text-primary group-hover:text-math-purple transition-colors">Mathematics</h3>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Engaging math concepts from arithmetic to algebra through interactive quizzes and lessons designed to build confidence.
              </p>
              <div className="text-sm font-semibold text-math-purple bg-math-purple/5 py-1 px-3 rounded-full w-fit">
                Grades 3-10
              </div>
            </div>

            {/* English */}
            <div className="group bg-bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-english-green"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-english-green/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-english-green/10 text-english-green mb-6 group-hover:scale-110 transition-transform">
                <BookText className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-text-primary group-hover:text-english-green transition-colors">English</h3>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Vocabulary, grammar, and reading comprehension through picture-based lessons and immersive storytelling.
              </p>
              <div className="text-sm font-semibold text-english-green bg-english-green/5 py-1 px-3 rounded-full w-fit">
                Grades 3-10
              </div>
            </div>

            {/* ICT */}
            <div className="group bg-bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-ict-orange"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-ict-orange/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ict-orange/10 text-ict-orange mb-6 group-hover:scale-110 transition-transform">
                <Laptop className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-text-primary group-hover:text-ict-orange transition-colors">ICT</h3>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Computer hardware, software, and digital literacy through interactive lessons and real-world scenarios.
              </p>
              <div className="text-sm font-semibold text-ict-orange bg-ict-orange/5 py-1 px-3 rounded-full w-fit">
                Grades 3-10
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-bg-secondary transition-colors duration-300">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">How It Works</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">
              Simple steps for teachers to create and students to learn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="bg-bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative border border-border">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-focus-blue text-white rounded-full flex items-center justify-center text-xl font-bold border-4 border-bg-secondary">1</div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold mb-3 text-text-primary">Create Content</h3>
                <p className="text-text-secondary leading-relaxed">
                  Teachers utilize our scaffolded builder to create quizzes and color-coded lessons.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative border border-border">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-focus-blue text-white rounded-full flex items-center justify-center text-xl font-bold border-4 border-bg-secondary">2</div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold mb-3 text-text-primary">Share Code</h3>
                <p className="text-text-secondary leading-relaxed">
                  A unique 6-digit access code is generated instantly to share with the classroom.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-bg-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative border border-border">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-focus-blue text-white rounded-full flex items-center justify-center text-xl font-bold border-4 border-bg-secondary">3</div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold mb-3 text-text-primary">Learn & Grow</h3>
                <p className="text-text-secondary leading-relaxed">
                  Students join, engage with the content, and get immediate, encouraging feedback.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Teacher Benefits */}
      <section className="py-24 px-4 bg-bg-card relative overflow-hidden transition-colors duration-300 text-text-primary">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-blue-50/50 dark:bg-blue-900/10 skew-x-[-10deg] pointer-events-none"></div>

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold rounded-full text-sm mb-4">FOR EDUCATORS</div>
              <h2 className="text-4xl font-bold mb-6 text-text-primary">Empower Your Classroom</h2>
              <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                Our tools are designed to save you time and increase student participation through proven gamification and color psychology strategies.
              </p>

              <ul className="space-y-6">
                {[
                  { title: "Quiz Zone", desc: "Create multiple choice, true/false, and other quiz types.", icon: <Zap className="text-warning-amber" fill="currentColor" /> },
                  { title: "Lesson Builder", desc: "Design interactive picture-based lessons with ease.", icon: <BookOpen className="text-focus-blue" /> },
                  { title: "Performance Tracking", desc: "Monitor student progress and identify gaps.", icon: <Award className="text-success-green" /> }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl hover:bg-bg-secondary transition-colors">
                    <div className="mt-1 h-12 w-12 flex-shrink-0 rounded-full bg-bg-card border border-border shadow-sm flex items-center justify-center p-2.5">
                      {item.icon}
                    </div>
                    <div>
                      <span className="font-bold text-lg block text-text-primary mb-1">{item.title}</span>
                      <span className="text-text-secondary">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link to="/teacher-signup">
                  <Button size="lg" className="h-12 px-8 bg-focus-blue hover:bg-focus-blue-dark text-white rounded-full shadow-md">
                    Create Teacher Account
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transform rotate-3 opacity-20 filter blur-lg"></div>
              <div className="relative bg-bg-card border border-border rounded-2xl shadow-2xl p-8 transform hover:-translate-y-2 transition-transform duration-500">
                <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Quiz Creator</h3>
                    <p className="text-sm text-text-secondary">Drafting: Algebra Basics</p>
                  </div>
                  <span className="text-xs font-bold bg-math-purple/10 text-math-purple px-3 py-1 rounded-full uppercase">Math Quiz</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-text-secondary mb-2 block">Question 1</label>
                    <div className="p-4 border-2 border-focus-blue-light/50 rounded-xl bg-bg-secondary/30 text-lg font-medium text-text-primary">
                      What is the sum of 28 + 14?
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border-2 border-focus-blue bg-focus-blue/5 rounded-lg flex items-center gap-3 cursor-pointer">
                      <div className="h-6 w-6 rounded-full bg-focus-blue text-white flex items-center justify-center text-xs font-bold">A</div>
                      <span className="font-bold text-focus-blue-dark">42</span>
                      <CheckCircle2 size={16} className="text-focus-blue ml-auto" />
                    </div>
                    <div className="p-3 border border-border rounded-lg flex items-center gap-3 opacity-60">
                      <div className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">B</div>
                      <span className="text-text-primary">32</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-2">
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-focus-blue"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Benefits */}
      <section className="py-20 px-4 bg-bg-secondary text-text-primary transition-colors duration-300">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Benefits for Students</h2>
            <div className="h-1 w-24 bg-success-green mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success-green/10 text-success-green mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Instant Feedback</h3>
              <p className="text-text-secondary">
                Students receive immediate, colorful feedback to reinforce learning and correct mistakes instantly.
              </p>
            </div>

            <div className="bg-bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-focus-blue/10 text-focus-blue mb-6">
                <BookText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Interactive Learning</h3>
              <p className="text-text-secondary">
                Engage with visual content, videos, and interactive exercises that make learning feel like play.
              </p>
            </div>

            <div className="bg-bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ict-orange/10 text-ict-orange mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Easy Access</h3>
              <p className="text-text-secondary">
                Join quizzes and lessons with simple 6-digit codes on any device—tablet, laptop, or phone.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block p-1 bg-bg-card rounded-full border border-border shadow-lg">
              <Link to="/student-join">
                <Button size="lg" className="h-14 px-10 text-lg bg-success-green hover:bg-[#059669] text-white rounded-full">
                  Join a Quiz or Lesson Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RICH FOOTER WITH MODALS (THEMED) */}
      <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-text-primary dark:text-white py-16 px-4 transition-colors duration-300">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Malik's Learning Lab</h2>
            <p className="text-text-secondary mb-8 text-lg">
              Transforming education through interactive learning experiences, powered by color psychology.
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-12">

              {/* About Us */}
              <Dialog>
                <DialogTrigger className="text-gray-600 dark:text-gray-300 hover:text-focus-blue dark:hover:text-white transition-colors border-b border-transparent hover:border-focus-blue dark:hover:border-white pb-0.5">
                  About Us
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-focus-blue"><Info className="w-8 h-8" /> About Us</DialogTitle>
                  </DialogHeader>
                  <div className="px-1 text-left">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-focus-blue mb-6">
                      <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Founder: Malik Raheeq Tahir</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">Teacher & Learning Scientist in Neuroscience-Informed Education</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">📧 raimalik544@gmail.com</p>
                    </div>
                    <Section title="My Background" icon={BookOpen}>Certified Mathematics and ICT educator with 5+ years of international teaching experience across Malaysia, Pakistan, Uzbekistan, Russia, and Germany. Hold a Master's degree in Science of Learning and Assessment, bridging neuroscience research with practical classroom tools.</Section>
                    <Section title="Why This Platform Exists" icon={Heart}>After teaching worldwide and completing neuroscience research, I saw that great educational research stays locked in academic journals while teachers lack practical tools. This platform puts neuroscience-backed education directly into teachers' hands—for free.</Section>
                    <Section title="What Makes Us Different" icon={CheckCircle}>Every feature uses proven neuroscience principles. 100% Free AI (10,000+ requests/day). Direct translation of cognitive science into usable tools.</Section>
                    <Section title="My Credentials" icon={Shield}>Master's Thesis on "Collaborative Learning". Built 2 educational websites. 5+ years international teaching.</Section>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Contact Support */}
              <Dialog>
                <DialogTrigger className="text-gray-600 dark:text-gray-300 hover:text-focus-blue dark:hover:text-white transition-colors border-b border-transparent hover:border-focus-blue dark:hover:border-white pb-0.5">
                  Contact Support
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white dark:bg-quiz-card dark:text-gray-100 text-left">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-math-purple"><Mail className="w-8 h-8" /> Contact Support</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl text-center border border-purple-100 dark:border-purple-800">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📞 Need Help?</h3>
                      <div className="inline-block bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm text-math-purple font-mono font-bold mb-3">raimalik544@gmail.com</div>
                      <p className="text-xs text-gray-500">Response Time: 24-48 hours</p>
                    </div>
                    <Section title="Support Categories" icon={Info}>Technical Issues, Feature Requests, Teaching Help, Account Issues, AI Questions.</Section>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Terms */}
              <Dialog>
                <DialogTrigger className="text-gray-600 dark:text-gray-300 hover:text-focus-blue dark:hover:text-white transition-colors border-b border-transparent hover:border-focus-blue dark:hover:border-white pb-0.5">Terms of Service</DialogTrigger>
                <DialogContent className="max-w-3xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto text-left">
                  <DialogHeader><DialogTitle>Terms of Service</DialogTitle></DialogHeader>
                  <Section title="1. Free Tier Promise">10,000+ AI requests/day will always be free. No credit card required.</Section>
                  <Section title="2. Account Management">Teachers must be 18+. Account deletion is permanent.</Section>
                  <Section title="3. Responsibilities">You own your content. Comply with school policies.</Section>
                </DialogContent>
              </Dialog>

              {/* Privacy */}
              <Dialog>
                <DialogTrigger className="text-gray-600 dark:text-gray-300 hover:text-focus-blue dark:hover:text-white transition-colors border-b border-transparent hover:border-focus-blue dark:hover:border-white pb-0.5">Privacy Policy</DialogTrigger>
                <DialogContent className="max-w-3xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto text-left">
                  <DialogHeader><DialogTitle>Privacy Policy</DialogTitle></DialogHeader>
                  <p className="mb-4">We respect your privacy regarding any information we may collect.</p>
                  <Section title="What We Collect">Email (for account). We NEVER collect student names/PII or payment info.</Section>
                  <Section title="Student Privacy">Anonymous access via codes. Session data deleted after 30 days.</Section>
                </DialogContent>
              </Dialog>

            </div>

            <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-text-secondary text-sm">
              &copy; {currentYear} Malik's Learning Lab. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
