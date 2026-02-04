
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Info, Shield, FileText } from "lucide-react";

const DashboardFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-quiz-dark text-white py-8 mt-auto border-t border-white/10">
      <div className="container mx-auto px-4">

        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 text-sm">

          {/* Copyright */}
          <div className="text-gray-400">
            &copy; {currentYear} Malik's Learning Lab. All rights reserved.
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap justify-center gap-6">

            {/* About Us */}
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 hover:text-focus-blue transition-colors">
                <Info size={14} /> About Us
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-quiz-card dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-focus-blue">
                    <Info className="w-6 h-6" /> About Malik's Learning Lab
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-justify leading-relaxed text-gray-700 dark:text-gray-300">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-focus-blue mb-4">
                    <p className="italic font-medium">
                      "Bridging advanced cognitive neuroscience research with practical, culturally-aware classroom application."
                    </p>
                  </div>
                  <p>
                    My name is <strong>Malik Raheeq Tahir</strong>, a Teacher & Learning Scientist specializing in Neuroscience-Informed Education.
                    I am a Certified Mathematics and ICT educator with <strong>5+ years of international teaching and research experience</strong> across Malaysia, Pakistan, Uzbekistan, Russia, and Germany.
                  </p>
                  <p>
                    Grounded in a Master’s degree in the Science of Learning and Assessment, my unique global perspective allows me to bridge the gap between academic research and real-world teaching.
                  </p>
                  <p>
                    I have built and deployed two full-stack educational websites and published a master's thesis on collaborative learning, directly translating academic research into practical tools.
                    My expertise lies in creating data-driven teaching strategies, interactive curricula, and educational technology to foster critical thinking and reduce subject anxiety in diverse, multilingual STEM environments.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contact Support */}
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 hover:text-focus-blue transition-colors">
                <Mail size={14} /> Contact Support
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-quiz-card dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-math-purple" /> Contact Support
                  </DialogTitle>
                  <DialogDescription>
                    We are here to help!
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p>For inquiries, technical support, or feedback, please email:</p>
                  <a href="mailto:raimalik544@gmail.com" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:border-focus-blue transition-all group">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-focus-blue group-hover:bg-focus-blue group-hover:text-white transition-colors">
                      <Mail size={20} />
                    </div>
                    <span className="font-semibold text-lg text-focus-blue">raimalik544@gmail.com</span>
                  </a>
                </div>
              </DialogContent>
            </Dialog>

            {/* Terms of Service */}
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 hover:text-focus-blue transition-colors">
                <FileText size={14} /> Terms of Service
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Terms of Service
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm space-y-4 text-gray-600 dark:text-gray-300">
                  <p>Last Updated: {currentYear}</p>
                  <h3 className="font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h3>
                  <p>By accessing Malik's Learning Lab, you agree to be bound by these Terms of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

                  <h3 className="font-bold text-gray-900 dark:text-white">2. Use License</h3>
                  <p>Permission is granted to use our educational materials for personal, non-commercial transitory viewing (students) or educational instruction (teachers).</p>

                  <h3 className="font-bold text-gray-900 dark:text-white">3. Disclaimer</h3>
                  <p>The materials on Malik's Learning Lab are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

                  <h3 className="font-bold text-gray-900 dark:text-white">4. AI Usage</h3>
                  <p>Our platform uses Artificial Intelligence (Cloudflare & Google Gemini) to generate educational content. You acknowledge that AI responses may occasionally be inaccurate or hallucinate. Users should verify critical information.</p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Privacy Policy */}
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 hover:text-focus-blue transition-colors">
                <Shield size={14} /> Privacy Policy
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-quiz-card dark:text-gray-100 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-success-green" /> Privacy Policy
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm space-y-4 text-gray-600 dark:text-gray-300">
                  <p>Your privacy is important to us. It is Malik's Learning Lab's policy to respect your privacy regarding any information we may collect from you across our website.</p>

                  <h3 className="font-bold text-gray-900 dark:text-white">1. Information We Collect</h3>
                  <p>We may collect personal information such as name and email address when you register for an account. We track learning progress (quiz scores) to provide educational insights.</p>

                  <h3 className="font-bold text-gray-900 dark:text-white">2. How We Use Information</h3>
                  <p>We use the collected information to:</p>
                  <ul className="list-disc pl-5">
                    <li>Provide and maintain our service</li>
                    <li>Monitor the usage of our service (e.g., Global AI Stats)</li>
                    <li>Detect, prevent and address technical issues</li>
                  </ul>

                  <h3 className="font-bold text-gray-900 dark:text-white">3. Data Security</h3>
                  <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure.</p>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
