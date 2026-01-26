
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Copy, BookOpen, BookText, Laptop, BrainCircuit, Wand2, FileText, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Quiz, Lesson } from "@/types/quiz";

interface QuestionGeneratorTabProps {
  grades: number[];
  subject?: "math" | "english" | "ict";
  onCreateQuiz?: (quiz: Quiz) => void;
  onCreateLesson?: (lesson: Lesson) => void;
}

const QuestionGeneratorTab: React.FC<QuestionGeneratorTabProps> = ({
  grades,
  subject = "math",
  onCreateQuiz,
  onCreateLesson
}) => {
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"quiz" | "lesson">("quiz");

  const handleGeneratePrompt = () => {
    if (!selectedGrade || (selectedTopics.length === 0 && !customTopic)) {
      toast({
        title: "Missing information",
        description: "Please select grade level and a topic.",
        variant: "destructive",
      });
      return;
    }

    const topic = customTopic || selectedTopics[0];

    let prompt = "";

    if (activeTab === 'quiz') {
      prompt = `Create a ${subject} quiz for grade ${selectedGrade} students about "${topic}".
Include 5 multiple choice questions with 4 options each.
Mark the correct answer.
Format the output as a JSON object with the following structure:
{
"title": "Quiz Title",
"description": "Brief description",
"questions": [
    {
    "text": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0 // 0-3
    }
]
}`;
    } else {
      prompt = `Create a ${subject} lesson plan for grade ${selectedGrade} students about "${topic}".
The lesson should be structure with Engage, Model, Guided Practice, Independent Practice, and Reflect phases.
Format the output as a JSON object with the following structure:
{
"title": "Lesson Title",
"description": "Lesson description",
"lessonStructure": {
    "engage": { "timeInMinutes": 5, "content": [{ "type": "text", "content": "..." }] },
    "model": { "timeInMinutes": 10, "content": [{ "type": "text", "content": "..." }] },
    "guidedPractice": { "timeInMinutes": 15, "content": [{ "type": "text", "content": "..." }] },
    "independentPractice": { "timeInMinutes": 15, "content": [{ "type": "text", "content": "..." }] },
    "reflect": { "timeInMinutes": 5, "content": [{ "type": "text", "content": "..." }] }
}
}`;
    }

    setGeneratedPrompt(prompt);
    toast({
      title: "Prompt Generated!",
      description: "Copy the prompt below to use in your favorite AI tool.",
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copied to clipboard!",
      description: "Prompt copied to clipboard.",
    });
  };

  // Get topics based on subject
  const getTopics = () => {
    switch (subject) {
      case "math":
        return [
          { value: "algebra", label: "Algebra" },
          { value: "geometry", label: "Geometry" },
          { value: "arithmetic", label: "Arithmetic" },
          { value: "fractions", label: "Fractions" },
          { value: "decimals", label: "Decimals" },
        ];
      case "english":
        return [
          { value: "grammar", label: "Grammar" },
          { value: "vocabulary", label: "Vocabulary" },
          { value: "reading", label: "Reading Comprehension" },
          { value: "writing", label: "Creative Writing" },
          { value: "literature", label: "Literature" },
        ];
      case "ict":
        return [
          { value: "hardware", label: "Computer Hardware" },
          { value: "software", label: "Software & OS" },
          { value: "networks", label: "Networks" },
          { value: "programming", label: "Programming Basics" },
          { value: "internet", label: "Internet Safety" },
        ];
      default:
        return [];
    }
  };

  const getSubjectIcon = () => {
    switch (subject) {
      case "math": return <BookOpen size={20} className="text-purple-500" />;
      case "english": return <BookText size={20} className="text-green-500" />;
      case "ict": return <Laptop size={20} className="text-orange-500" />;
      default: return <BookOpen size={20} className="text-purple-500" />;
    }
  };

  // Get color based on subject
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
          <h2 className="text-xl font-semibold">AI Prompt Generator</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate AI Prompts</CardTitle>
          <p className="text-sm text-gray-500">
            Select your requirements to generate a perfect prompt for ChatGPT, Gemini, or Claude.
          </p>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "quiz" | "lesson")}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quiz" className="flex gap-2">
                <CheckSquare size={16} /> Quiz Prompt
              </TabsTrigger>
              <TabsTrigger value="lesson" className="flex gap-2">
                <FileText size={16} /> Lesson Prompt
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Grade Level</label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Topic</label>
              <Select
                value={selectedTopics.length > 0 ? selectedTopics[0] : "custom"}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setSelectedTopics([]);
                  } else {
                    setSelectedTopics([value]);
                    setCustomTopic("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {getTopics().map(topic => (
                    <SelectItem key={topic.value} value={topic.value}>{topic.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Topic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedTopics.length === 0 || customTopic || selectedTopics[0] === "custom") && (
            <div>
              <Label htmlFor="custom-topic">Custom Topic / Context</Label>
              <Input
                id="custom-topic"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g., Photosynthesis basics, Fractions with unlike denominators, etc."
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Button
              onClick={handleGeneratePrompt}
              className={`w-full ${getSubjectColor()} gap-2`}
            >
              <Wand2 size={16} />
              Generate Prompt
            </Button>
          </div>

          {generatedPrompt && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Generated Prompt</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1"
                >
                  <Copy size={14} />
                  Copy Prompt
                </Button>
              </div>
              <Textarea
                value={generatedPrompt}
                readOnly
                rows={12}
                className="font-mono text-sm bg-slate-50"
              />
              <p className="text-xs text-muted-foreground">
                Copy this prompt and paste it into Google Gemini, ChatGPT, or Claude to generate your content.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-5">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <BrainCircuit size={14} />
            Optimized for Large Language Models
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuestionGeneratorTab;
