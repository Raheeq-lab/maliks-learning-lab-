
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Info, Shield, FileText, CheckCircle, AlertTriangle, BookOpen, Heart } from "lucide-react";

// Reusable Section Component for Modals
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

const DashboardFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-quiz-dark text-white/80 py-8 mt-auto border-t border-white/10 font-poppins">
      <div className="container mx-auto px-4 flex flex-col items-center gap-6">

        {/* TOP ROW: LINKS */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm font-medium">

          {/* 1. ABOUT US */}
          <Dialog>
            <DialogTrigger className="hover:text-white transition-colors duration-200">
              About Us
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-focus-blue">
                  <Info className="w-8 h-8" /> About Us
                </DialogTitle>
              </DialogHeader>

              <div className="px-1">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-focus-blue mb-6">
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Founder: Malik Raheeq Tahir</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Teacher & Learning Scientist in Neuroscience-Informed Education</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">📧 raimalik544@gmail.com</p>
                </div>

                <Section title="My Background" icon={BookOpen}>
                  Certified Mathematics and ICT educator with 5+ years of international teaching experience across Malaysia, Pakistan, Uzbekistan, Russia, and Germany. Hold a Master's degree in Science of Learning and Assessment, bridging neuroscience research with practical classroom tools.
                </Section>

                <Section title="Why This Platform Exists" icon={Heart}>
                  After teaching worldwide and completing neuroscience research, I saw that great educational research stays locked in academic journals while teachers lack practical tools. This platform puts neuroscience-backed education directly into teachers' hands—for free.
                </Section>

                <Section title="What Makes Us Different" icon={CheckCircle}>
                  <ul className="space-y-2 mt-2">
                    <li className="flex gap-2"><div className="font-bold min-w-[140px]">1. Brain-Based Design:</div> Every feature uses proven neuroscience principles.</li>
                    <li className="flex gap-2"><div className="font-bold min-w-[140px]">2. Global Experience:</div> Tools tested across 5 countries for diverse classrooms.</li>
                    <li className="flex gap-2"><div className="font-bold min-w-[140px]">3. 100% Free AI:</div> 10,000+ free AI requests daily using Cloudflare's infrastructure.</li>
                    <li className="flex gap-2"><div className="font-bold min-w-[140px]">4. Research-to-Practice:</div> Direct translation of cognitive science into usable tools.</li>
                  </ul>
                </Section>

                <Section title="My Credentials" icon={Shield}>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Master's Thesis on "Collaborative Learning in Multilingual STEM Environments"</li>
                    <li>Built and deployed two full-stack educational websites</li>
                    <li>5+ years teaching Mathematics and ICT internationally</li>
                    <li>Neuroscience-informed curriculum design expertise</li>
                  </ul>
                </Section>

                <blockquote className="italic border-l-4 border-gray-300 pl-4 py-2 mt-6 text-gray-500 dark:text-gray-400">
                  "Great teaching shouldn't require a PhD in neuroscience or unlimited budget. This platform is what I wish I had when I started teaching."
                  <footer className="text-sm font-bold mt-1">— Malik Raheeq Tahir</footer>
                </blockquote>
              </div>
            </DialogContent>
          </Dialog>

          {/* 2. CONTACT SUPPORT */}
          <Dialog>
            <DialogTrigger className="hover:text-white transition-colors duration-200">
              Contact Support
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-math-purple">
                  <Mail className="w-8 h-8" /> Contact Support
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl text-center border border-purple-100 dark:border-purple-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📞 Need Help?</h3>
                  <div className="inline-block bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm text-math-purple font-mono font-bold mb-3">
                    raimalik544@gmail.com
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Response Time: 24-48 hours • For Urgent: Add "[URGENT]" to subject</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><Info size={16} /> Support Categories</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                      <li>1. Technical Issues (Bugs)</li>
                      <li>2. Feature Requests</li>
                      <li>3. Teaching Help</li>
                      <li>4. Account Issues</li>
                      <li>5. AI Questions</li>
                    </ul>
                  </div>
                  <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><CheckCircle size={16} /> Before Contacting</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                      <li>✅ Check FAQ section</li>
                      <li>✅ Include screenshots</li>
                      <li>✅ Mention browser/device</li>
                      <li>✅ Steps to reproduce</li>
                    </ul>
                  </div>
                </div>

                <Section title="Account Deletion Support" icon={AlertTriangle}>
                  <p>If you need help deleting your account:</p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Email: <strong>raimalik544@gmail.com</strong></li>
                    <li>Subject: "Account Deletion Request"</li>
                    <li>Include: Your registered email</li>
                    <li>We'll verify and process within 24 hours.</li>
                  </ol>
                </Section>

                <div className="text-center text-xs text-gray-400 mt-4 border-t pt-4">
                  Office Hours: Mon-Fri 9AM-5PM EST • Weekends: Emergency support only
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 3. TERMS OF SERVICE */}
          <Dialog>
            <DialogTrigger className="hover:text-white transition-colors duration-200">
              Terms of Service
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-gray-800 dark:text-white">
                  <FileText className="w-6 h-6" /> Terms of Service
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <Section title="1. Free Tier Promise">
                  <ul className="list-disc pl-5">
                    <li>10,000+ AI requests/day will always be free.</li>
                    <li>No credit card required for basic features.</li>
                    <li>We reserve right to limit abusive usage.</li>
                  </ul>
                </Section>

                <Section title="2. Account Management">
                  <p className="font-semibold mt-2">Creating Accounts:</p>
                  <ul className="list-disc pl-5 mb-2">
                    <li>Must be 18+ years old.</li>
                    <li>Use valid email address.</li>
                  </ul>
                  <p className="font-semibold">Deleting Accounts:</p>
                  <p>Go to Profile → Settings → "Delete Account". Deletion is immediate and permanent.</p>
                </Section>

                <Section title="3. Teacher Responsibilities">
                  You own all content you create. You are responsible for student data privacy and complying with your school's policies. Always review AI-generated content.
                </Section>

                <Section title="4. Acceptable Use">
                  Educational purposes only. No automated bots or scraping. Respect standard daily API limits.
                </Section>

                <Section title="5. AI Limitations">
                  AI (Cloudflare/Gemini) may produce incorrect information or "hallucinations". Always verify critical information. We are not responsible for AI errors.
                </Section>

                <Section title="6. Changes to Service">
                  Free tier remains free forever. 30-day notice for major changes. Optional premium features may be added in future, but current features won't be paywalled.
                </Section>
              </div>
            </DialogContent>
          </Dialog>

          {/* 4. PRIVACY POLICY */}
          <Dialog>
            <DialogTrigger className="hover:text-white transition-colors duration-200">
              Privacy Policy
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-success-green">
                  <Shield className="w-6 h-6" /> Privacy Policy
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">✅ What We Collect</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Email (for account)</li>
                      <li>Name (optional)</li>
                      <li>School (optional)</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                    <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">❌ We Never Collect</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Student names/PII</li>
                      <li>Student grades</li>
                      <li>Payment info</li>
                      <li>Location tracking</li>
                    </ul>
                  </div>
                </div>

                <Section title="Student Privacy (Anonymous)">
                  <p>Students join via access codes only. No student accounts required. No PII stored. Session data deleted after 30 days. No long-term profiling.</p>
                </Section>

                <Section title="Your Data Rights">
                  <p className="font-semibold">Access & Export:</p>
                  <p className="mb-2">View your data anytime. Export lessons/quizzes.</p>
                  <p className="font-semibold">Deletion:</p>
                  <p>Delete via Profile Settings (Immediate) or email <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">raimalik544@gmail.com</span>.</p>
                </Section>

                <Section title="AI & Your Content">
                  Your generated content remains yours. We don't train AI on your materials. Content is private unless shared.
                </Section>

                <Section title="Security & Third Parties">
                  <p>HTTPS encryption everywhere. Cloudflare AI used for generation (anonymous prompts). Google Gemini as backup only.</p>
                </Section>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-center text-sm">
                  <p className="font-bold">Contact Privacy Officer</p>
                  <p>raimalik544@gmail.com  •  Subject: "Privacy Request"</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>

        {/* BOTTOM ROW: COPYRIGHT */}
        <div className="border-t border-white/10 w-full pt-6 text-center text-xs text-gray-500">
          &copy; {currentYear} Malik's Learning Lab. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
