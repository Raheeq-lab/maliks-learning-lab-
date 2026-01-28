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
  grades: number[];
  subject?: "math" | "english" | "ict";
  onCreateQuiz: (quiz: Quiz) => void;
  onCreateLesson: (lesson: Lesson) => void;
}

const QuestionGeneratorTab: React.FC<QuestionGeneratorTabProps> = ({
  grades,
  subject = "math",
  onCreateQuiz,
  onCreateLesson
}) => {
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
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

  const getSubjectColor = () => {
    switch (subject) {
      case "math": return "bg-purple-600 hover:bg-purple-700";
      case "english": return "bg-green-600 hover:bg-green-700";
      case "ict": return "bg-orange-600 hover:bg-orange-700";
      default: return "bg-purple-600 hover:bg-purple-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSubjectIcon()}
          <h2 className="text-xl font-semibold">AI Content Generator</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
          <Sparkles size={14} />
          <span>Powered by Gemini 1.5 Flash</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Content</CardTitle>
          <p className="text-sm text-gray-500">
            Create high-quality {subject} materials aligned with Grade {selectedGrade || "?"} curriculum.
          </p>
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "quiz" | "lesson");
            setGeneratedQuestions([]);
            setError(null);
          }} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quiz" className="flex gap-2"><CheckSquare size={16} /> Generate Quiz</TabsTrigger>
              <TabsTrigger value="lesson" className="flex gap-2"><FileText size={16} /> Generate Lesson</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedQuestions.length === 0 ? (
            /* Input Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Grade Level</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => (
                        <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeTab === 'quiz' && (
                  <div>
                    <Label>Number of Questions</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger><SelectValue placeholder="5" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="topic">Topic / Learning Objective</Label>
                <Input
                  id="topic"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder={`e.g. ${subject === 'math' ? 'Linear Equations' : subject === 'english' ? 'Shakespeare Sonnets' : 'Network Security'}`}
                />
              </div>

              {activeTab === 'lesson' && (
                <div>
                  <Label>Learning Type</Label>
                  <Select value={learningType} onValueChange={setLearningType}>
                    <SelectTrigger><SelectValue placeholder="Select Learning Type" /></SelectTrigger>
                    <SelectContent>
                      {getLearningTypes(subject).map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-1">
                    {getLearningTypes(subject).find((t: any) => t.id === learningType) && (
                      <p className="text-xs text-gray-500">
                        {getLearningTypes(subject).find((t: any) => t.id === learningType)?.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full h-12 text-lg ${getSubjectColor()}`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2" size={20} />
                    Generate {activeTab === 'quiz' ? 'Quiz' : 'Lesson'}
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Generated Questions ({generatedQuestions.length})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setGeneratedQuestions([])}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                  </Button>
                  <Button onClick={handleAddToQuiz} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" /> Add to Quiz
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {generatedQuestions.map((q, idx) => (
                  <Card key={idx} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex gap-2">
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm w-fit whitespace-nowrap h-fit">Q{idx + 1}</span>
                        {q.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = opt.includes(q.correctAnswer) || q.correctAnswer.includes(opt); // Simple naive matching, dependent on Gemini output
                        return (
                          <div key={optIdx} className={`p-3 rounded border flex items-center justify-between ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                            <span>{opt}</span>
                            {isCorrect && <Check className="h-4 w-4 text-green-600" />}
                          </div>
                        );
                      })}
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 px-6 text-sm text-gray-500 bg-gray-50/50 mt-2 rounded-b-lg">
                      <p className="mt-2"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionGeneratorTab;
