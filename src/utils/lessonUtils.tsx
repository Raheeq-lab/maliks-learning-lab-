
import React from 'react';
import { BookOpen, BookText, Laptop, Brain, BarChart2, Gamepad2, BriefcaseBusiness, MessageSquare, Pen, CheckSquare, Headphones, FileText, Search, Settings, MousePointer, Image } from "lucide-react";

export const getLearningTypes = (subject: "math" | "english" | "ict") => {
    switch (subject) {
        case "math":
            return [
                {
                    id: "scaffolded-lesson",
                    title: "Scaffolded Lesson (40m)",
                    description: "Structured 5-phase lesson: Engage, Model, Guided, Independent, Reflect.",
                    icon: <BookOpen className="text-purple-600" />
                },
                {
                    id: "problem-solving",
                    title: "Problem Solving Practice",
                    description: "Solve step-by-step math problems to build logic and accuracy.",
                    icon: <Brain className="text-purple-600" />
                },
                {
                    id: "visual-interactive",
                    title: "Visual & Interactive Learning",
                    description: "Learn through graphs, number lines, and drag-and-drop tools.",
                    icon: <BarChart2 className="text-purple-600" />
                },
                {
                    id: "game-based",
                    title: "Game-Based Quizzes",
                    description: "Practice with fun, timed challenges and scoring levels.",
                    icon: <Gamepad2 className="text-purple-600" />
                },
                {
                    id: "real-world",
                    title: "Real-World Application",
                    description: "Apply math in budgeting, measuring, and real-life scenarios.",
                    icon: <BriefcaseBusiness className="text-purple-600" />
                },
                {
                    id: "math-talks",
                    title: "Math Talks",
                    description: "Explain your solution strategy or compare methods with others.",
                    icon: <MessageSquare className="text-purple-600" />
                }
            ];
        case "english":
            return [
                {
                    id: "scaffolded-lesson",
                    title: "Scaffolded Lesson (40m)",
                    description: "Structured 5-phase lesson: Engage, Model, Guided, Independent, Reflect.",
                    icon: <BookOpen className="text-green-600" />
                },
                {
                    id: "reading-comprehension",
                    title: "Reading Comprehension",
                    description: "Analyze texts, identify themes, and understand characters.",
                    icon: <BookText className="text-green-600" />
                },
                {
                    id: "writing-workshop",
                    title: "Writing Workshop",
                    description: "Practice brainstorming, drafting, editing, and publishing.",
                    icon: <Pen className="text-green-600" />
                },
                {
                    id: "vocabulary",
                    title: "Vocabulary Builder",
                    description: "Interactive word games, matching, and usage checks.",
                    icon: <MessageSquare className="text-green-600" />
                },
                {
                    id: "grammar",
                    title: "Grammar & Punctuation",
                    description: "Master sentence structure, parts of speech, and rules.",
                    icon: <CheckSquare className="text-green-600" />
                },
                {
                    id: "debate",
                    title: "Debate & Discussion",
                    description: "Structured arguments, speaking skills, and active listening.",
                    icon: <Headphones className="text-green-600" />
                }
            ];
        case "ict":
            return [
                {
                    id: "scaffolded-lesson",
                    title: "Scaffolded Lesson (40m)",
                    description: "Structured 5-phase lesson: Engage, Model, Guided, Independent, Reflect.",
                    icon: <Laptop className="text-orange-600" />
                },
                {
                    id: "coding",
                    title: "Coding Challenge",
                    description: "Logic puzzles, algorithms, and block-based programming.",
                    icon: <FileText className="text-orange-600" />
                },
                {
                    id: "digital-literacy",
                    title: "Digital Literacy",
                    description: "Online safety, effective searching, and verifying sources.",
                    icon: <Search className="text-orange-600" />
                },
                {
                    id: "hardware",
                    title: "Hardware Lab",
                    description: "Identify components, understand networks, and troubleshooting.",
                    icon: <Settings className="text-orange-600" />
                },
                {
                    id: "software-skills",
                    title: "Software Mastery",
                    description: "Word processing, spreadsheets, and presentation tools.",
                    icon: <MousePointer className="text-orange-600" />
                },
                {
                    id: "creative-computing",
                    title: "Creative Computing",
                    description: "Digital art, animation, and multimedia design projects.",
                    icon: <Image className="text-orange-600" />
                }
            ];
        default:
            return [
                {
                    id: "scaffolded-lesson",
                    title: "Scaffolded Lesson (40m)",
                    description: "Structured 5-phase lesson: Engage, Model, Guided, Independent, Reflect.",
                    icon: <BookOpen className="text-purple-600" />
                }
            ];
    }
};
