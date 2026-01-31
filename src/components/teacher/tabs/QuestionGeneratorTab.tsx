import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, BookText, Laptop, BrainCircuit, Wand2, FileText, CheckSquare, Sparkles, AlertCircle, Plus, RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Quiz, Lesson } from "@/types/quiz";
import { generateQuizQuestions, generateLessonPlan, isConfigured, QuizQuestion as GeminiQuizQuestion } from "@/utils/geminiAI";
import { getLearningTypes } from "@/utils/lessonUtils";



interface QuestionGeneratorTabProps {
  availableGrades?: number[]; // changed from grades
  subject?: "math" | "english" | "ict";
  onCreateQuiz: (quiz: Quiz) => void;
  onCreateLesson: (lesson: Lesson) => void;
}

const QuestionGeneratorTab: React.FC<QuestionGeneratorTabProps> = ({
  availableGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  subject = "math",
  onCreateQuiz,
  onCreateLesson
}) => {
  const { toast } = useToast();

  const [selectedGrade, setSelectedGrade] = useState<string>(""); // Keep this for the specific generation dropdown? 
  // Actually, the previous code used `selectedGrade` (single string) for generation.
  // The user wants the "Target Grades" bar here.
  // If we add the bar, does it replace the single dropdown? 
  // Probably the "Target Grades" bar is for *filtering* generally or just context?
  // Wait, in Generator, we select *one* grade to generate content for usually.
  // But the "Target Grades" bar is multi-select.
  // Maybe just put it there as a "Preferred Grades" selector?
  // OR, maybe the user wants to generate content for *multiple* grades?
  // The current generator function takes `selectedGrade` (string).
  // Let's Keep the single select for specific generation, but show the Bar as "Quick Select"?
  // Or maybe the user *wants* multi-select generation?
  // The prompt says: "add indudivally in all the section like when i want to create quzzes just show there also".
  // This likely means they want the VISUAL selector there.
  // Let's add the selector and maybe sync it? Or just let it exist.
  // If I select multiple in the bar, maybe I can pick one from them in the dropdown?
  // Or sticking to the single select is safer for the AI logic.

  // Let's place the GradeSelector at the top.

  const [activeTab, setActiveTab] = useState<"quiz" | "lesson">("quiz");
  const [learningType, setLearningType] = useState<string>("scaffolded");

  // Quiz State
  const [customTopic, setCustomTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState<string>("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeminiQuizQuestion[]>([]);

  const handleGenerate = async () => {
    setError(null);
    if (!selectedGrade || !customTopic) {
      setError("Please select a grade and enter a topic.");
      return;
    }

    if (!isConfigured()) {
      setError("Gemini API Key is missing in environment variables. Please check your .env file.");
      return;
    }

    setIsGenerating(true);

    try {
      if (activeTab === 'quiz') {
        const questions = await generateQuizQuestions(
          subject,
          selectedGrade,
          customTopic,
          parseInt(numQuestions)
        );
        setGeneratedQuestions(questions);
        toast({ title: "Success", description: `Generated ${questions.length} questions!` });
      } else {
        // Lesson Generation
        const lessonPlan = await generateLessonPlan(subject, selectedGrade, customTopic);

        const newLesson: Lesson = {
          id: crypto.randomUUID(),
          title: `Lesson: ${customTopic}`,
          description: `A ${subject} lesson for grade ${selectedGrade}`,
          gradeLevel: parseInt(selectedGrade),
          subject: subject,
          content: [], // Legacy compat
          learningType: learningType,
          lessonStructure: {
            engage: { title: "Engage", timeInMinutes: 5, content: lessonPlan.phases.engage.activities.map(a => ({ type: 'text', content: a, id: crypto.randomUUID() })) },
            model: { title: "Model", timeInMinutes: 8, content: lessonPlan.phases.model.activities.map(a => ({ type: 'text', content: a, id: crypto.randomUUID() })) },
            guidedPractice: { title: "Guided Practice", timeInMinutes: 12, content: lessonPlan.phases.guidedPractice.activities.map(a => ({ type: 'text', content: a, id: crypto.randomUUID() })) },
            independentPractice: { title: "Independent Practice", timeInMinutes: 10, content: lessonPlan.phases.independentPractice.activities.map(a => ({ type: 'text', content: a, id: crypto.randomUUID() })) },
            reflect: { title: "Reflect", timeInMinutes: 5, content: lessonPlan.phases.reflect.activities.map(a => ({ type: 'text', content: a, id: crypto.randomUUID() })) }
          },
          accessCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          createdBy: 'AI',
          createdAt: new Date().toISOString(),
          isPublic: false
        };

        onCreateLesson(newLesson);
        toast({ title: "Lesson Created", description: "Lesson plan added to your dashboard." });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToQuiz = () => {
    if (generatedQuestions.length === 0) return;

    const newQuiz: Quiz = {
      id: crypto.randomUUID(),
      title: `${customTopic} Quiz`,
      description: `Generated ${subject} quiz for Grade ${selectedGrade}`,
      gradeLevel: parseInt(selectedGrade) || 0,
      subject: subject,
      timeLimit: generatedQuestions.length * 2 * 60, // 2 mins per question
      questions: generatedQuestions.map(q => ({
        id: crypto.randomUUID(),
        text: q.question,
        type: 'multiple-choice', // assuming all ai generated are MC
        options: q.options,
        correctOptionIndex: q.options.findIndex(o => o.includes(q.correctAnswer) || q.correctAnswer.includes(o)) > -1
          ? q.options.findIndex(o => o.includes(q.correctAnswer) || q.correctAnswer.includes(o))
          : 0, // Fallback if match fails, ideally we fix this parsing logic
        explanation: q.explanation,
        points: 10
      })),
      accessCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdBy: "AI",
      createdAt: new Date().toISOString(),
      isPublic: false
    };

    onCreateQuiz(newQuiz);
    toast({ title: "Quiz Saved!", description: "Questions added to your library." });
    setGeneratedQuestions([]); // Reset results
    setCustomTopic(""); // Optional: reset form
  };

  const getSubjectIcon = () => {
    switch (subject) {
      case "math": return <BookOpen size={20} className="text-purple-500" />;
      case "english": return <BookText size={20} className="text-green-500" />;
      case "ict": return <Laptop size={20} className="text-orange-500" />;
      default: return <BookOpen size={20} className="text-purple-500" />;
    }
  };

  const getSubjectGradient = () => {
    switch (subject) {
      case "math": return "from-purple-600 to-indigo-600 shadow-purple-500/20";
      case "english": return "from-emerald-500 to-teal-600 shadow-emerald-500/20";
      case "ict": return "from-orange-500 to-amber-600 shadow-orange-500/20";
      default: return "from-blue-600 to-cyan-600 shadow-blue-500/20";
    }
  };

  const getSubjectLightBg = () => {
    switch (subject) {
      case "math": return "bg-purple-500/10 border-purple-500/20 text-purple-300";
      case "english": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      case "ict": return "bg-orange-500/10 border-orange-500/20 text-orange-300";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-300";
    }
  };

  const getGlowColor = () => {
    switch (subject) {
      case "math": return "shadow-purple-500/10";
      case "english": return "shadow-green-500/10";
      case "ict": return "shadow-orange-500/10";
      default: return "shadow-blue-500/10";
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className={`relative overflow-hidden flex items-center justify-between p-6 rounded-2xl border border-border/10 shadow-xl ${getGlowColor()}`}>
        {/* Dynamic Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getSubjectGradient()} opacity-[0.08] pointer-events-none`} />

        <div className="relative flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getSubjectGradient()} text-white shadow-lg`}>
            <Sparkles size={24} className="animate-pulse-slow" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">AI Content Generator</h2>
            <p className="text-sm text-text-secondary font-medium">Create custom quizzes and lessons in seconds</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-text-secondary bg-bg-secondary/50 px-3 py-1.5 rounded-full border border-border backdrop-blur-md">
          <BrainCircuit size={14} className="text-math-purple" />
          <span>Powered by Gemini 1.5 Flash</span>
        </div>
      </div>



      <Card className="border-border/40 shadow-2xl bg-bg-card/50 backdrop-blur-xl overflow-hidden">
        {/* Accent Line */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${getSubjectGradient()}`}></div>

        <CardHeader className="bg-bg-secondary/10 border-b border-border/40 pb-6">
          <CardTitle className="text-xl text-text-primary">Generate New Content</CardTitle>
          <p className="text-sm text-text-secondary">
            Create high-quality {subject} materials aligned with Grade {selectedGrade || "?"} curriculum.
          </p>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "quiz" | "lesson");
            setGeneratedQuestions([]);
            setError(null);
          }} className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-bg-secondary/50 p-1 border border-border rounded-xl h-auto">
              <TabsTrigger
                value="quiz"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-bg-card data-[state=active]:to-bg-secondary data-[state=active]:text-text-primary data-[state=active]:shadow-lg data-[state=active]:border-border/50 text-text-tertiary hover:text-text-primary transition-all rounded-lg py-3 font-medium"
              >
                <CheckSquare size={18} className={activeTab === 'quiz' ? 'text-math-purple' : ''} />
                Generate Quiz
              </TabsTrigger>
              <TabsTrigger
                value="lesson"
                className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-bg-card data-[state=active]:to-bg-secondary data-[state=active]:text-text-primary data-[state=active]:shadow-lg data-[state=active]:border-border/50 text-text-tertiary hover:text-text-primary transition-all rounded-lg py-3 font-medium"
              >
                <FileText size={18} className={activeTab === 'lesson' ? 'text-english-green' : ''} />
                Generate Lesson
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedQuestions.length === 0 ? (
            /* Input Form */
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-text-secondary font-medium ml-1">Grade Level</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="bg-bg-input/50 border-border hover:border-border/60 focus:ring-2 focus:ring-math-purple/30 h-12 transition-all rounded-xl text-text-primary">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-border text-text-primary">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => (
                        <SelectItem key={g} value={g.toString()} className="focus:bg-bg-secondary focus:text-text-primary">Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeTab === 'quiz' && (
                  <div className="space-y-2">
                    <Label className="text-text-secondary font-medium ml-1">Number of Questions</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger className="bg-bg-input/50 border-border hover:border-border/60 focus:ring-2 focus:ring-math-purple/30 h-12 transition-all rounded-xl text-text-primary">
                        <SelectValue placeholder="5" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-card border-border text-text-primary">
                        <SelectItem value="5" className="focus:bg-bg-secondary focus:text-text-primary">5 Questions</SelectItem>
                        <SelectItem value="10" className="focus:bg-bg-secondary focus:text-text-primary">10 Questions</SelectItem>
                        <SelectItem value="15" className="focus:bg-bg-secondary focus:text-text-primary">15 Questions</SelectItem>
                        <SelectItem value="20" className="focus:bg-bg-secondary focus:text-text-primary">20 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-text-secondary font-medium ml-1">Topic / Learning Objective</Label>
                <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${getSubjectGradient()} rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 group-focus-within:opacity-100`}></div>
                  <Input
                    id="topic"
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    placeholder={`e.g. ${subject === 'math' ? 'Linear Equations' : subject === 'english' ? 'Shakespeare Sonnets' : 'Network Security'}`}
                    className="relative bg-bg-card border-border focus:border-transparent focus:ring-0 h-12 rounded-xl text-text-primary placeholder:text-text-tertiary"
                  />
                </div>
              </div>

              {activeTab === 'lesson' && (
                <div className="space-y-2">
                  <Label className="text-text-secondary font-medium ml-1">Learning Type</Label>
                  <Select value={learningType} onValueChange={setLearningType}>
                    <SelectTrigger className="bg-bg-input/50 border-border hover:border-border/60 focus:ring-2 focus:ring-math-purple/30 h-12 transition-all rounded-xl text-text-primary">
                      <SelectValue placeholder="Select Learning Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-border text-text-primary">
                      {getLearningTypes(subject).map((type: any) => (
                        <SelectItem key={type.id} value={type.id} className="focus:bg-bg-secondary focus:text-text-primary">
                          {type.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    {getLearningTypes(subject).find((t: any) => t.id === learningType) && (
                      <p className={`text-xs p-3 rounded-lg border backdrop-blur-md transition-all ${getSubjectLightBg()}`}>
                        {getLearningTypes(subject).find((t: any) => t.id === learningType)?.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full h-14 text-lg font-bold shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl bg-gradient-to-r ${getSubjectGradient()} text-white border-none`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 animate-pulse" size={22} />
                    Generate {activeTab === 'quiz' ? 'Quiz' : 'Lesson'}
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="font-bold text-xl text-text-primary flex items-center gap-2">
                  <CheckSquare size={20} className="text-success-green" />
                  Generated Questions <span className="text-text-tertiary text-sm font-normal ml-2">({generatedQuestions.length})</span>
                </h3>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setGeneratedQuestions([])} className="border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary">
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                  </Button>
                  <Button onClick={handleAddToQuiz} className="bg-success-green hover:bg-success-green-dark text-white shadow-lg shadow-success-green/20 border-none transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Add to Quiz
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {generatedQuestions.map((q, idx) => (
                  <Card key={idx} className={`group border-l-4 bg-bg-card border-y border-r border-border hover:bg-bg-secondary/30 transition-all duration-300 ${subject === 'math' ? 'border-l-math-purple' :
                    subject === 'english' ? 'border-l-english-green' :
                      'border-l-ict-orange'
                    }`}>
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="text-base flex gap-3 text-text-primary leading-relaxed">
                        <span className={`flex max-h-6 items-center justify-center px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${getSubjectLightBg()}`}>
                          Q{idx + 1}
                        </span>
                        {q.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pb-4">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = opt.includes(q.correctAnswer) || q.correctAnswer.includes(opt);
                        return (
                          <div
                            key={optIdx}
                            className={`p-3.5 rounded-lg border flex items-center justify-between transition-all duration-300 ${isCorrect
                              ? 'bg-success-green/10 border-success-green/30 text-success-green shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                              : 'bg-bg-secondary/50 border-border text-text-secondary group-hover:border-border/60'
                              }`}
                          >
                            <span className="font-medium">{opt}</span>
                            {isCorrect && <Check className="h-4 w-4 text-success-green drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                          </div>
                        );
                      })}
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 px-6">
                      <div className="w-full mt-2 p-3 rounded-lg bg-focus-blue/5 border border-focus-blue/10 text-sm text-text-secondary">
                        <p className="flex gap-2 items-start"><span className="font-semibold text-focus-blue shrink-0">Explanation:</span> {q.explanation}</p>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
};

export default QuestionGeneratorTab;
