
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { X, Plus, Trash2, Image, Upload, BookOpen, BookText, Laptop, ArrowLeft } from "lucide-react";
import { Quiz, QuizQuestion } from '@/types/quiz';
import SubjectSelector from '@/components/SubjectSelector';

interface QuizFormProps {
  grades: number[];
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
  subject?: "math" | "english" | "ict";
  initialData?: Quiz | null;
}

const generateAccessCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const initialQuestion: QuizQuestion = {
  id: `q-${Date.now()}`,
  text: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0
};

const QuizForm: React.FC<QuizFormProps> = ({ grades, onSave, onCancel, subject = "math", initialData }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedGrade, setSelectedGrade] = useState<string>(initialData?.gradeLevel?.toString() || '');
  const [selectedSubject, setSelectedSubject] = useState<"math" | "english" | "ict">(initialData?.subject || subject);
  const [timeLimit, setTimeLimit] = useState<number>(initialData?.timeLimit || 30);
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialData?.questions || [initialQuestion]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load draft from localStorage on mount
  React.useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem('quiz_form_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.selectedGrade) setSelectedGrade(parsed.selectedGrade);
          if (parsed.selectedSubject) setSelectedSubject(parsed.selectedSubject);
          if (parsed.timeLimit) setTimeLimit(parsed.timeLimit);
          if (parsed.questions) setQuestions(parsed.questions);
          // toast({ title: "Draft restored", description: "We found an unsaved quiz draft." });
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [initialData]);

  // Save draft to localStorage on changes
  React.useEffect(() => {
    if (!initialData) {
      const draft = {
        title,
        description,
        selectedGrade,
        selectedSubject,
        timeLimit,
        questions
      };
      localStorage.setItem('quiz_form_draft', JSON.stringify(draft));
    }
  }, [title, description, selectedGrade, selectedSubject, timeLimit, questions, initialData]);

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, {
      id: `q-${Date.now()}-${prev.length}`,
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "A quiz must have at least one question.",
        variant: "destructive",
      });
      return;
    }

    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, qIndex) => {
      if (qIndex !== questionIndex) return q;

      const newOptions = [...q.options];
      newOptions[optionIndex] = value;

      return { ...q, options: newOptions };
    }));
  };

  const handleCorrectOptionChange = (questionIndex: number, optionIndex: number) => {
    setQuestions(prev => prev.map((q, qIndex) =>
      qIndex === questionIndex ? { ...q, correctOptionIndex: optionIndex } : q
    ));
  };

  const handleImageUpload = (questionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Convert image to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleQuestionChange(questionIndex, 'imageUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (questionIndex: number) => {
    handleQuestionChange(questionIndex, 'imageUrl', undefined);
    // Reset file input
    if (fileInputRefs.current[questionIndex]) {
      fileInputRefs.current[questionIndex]!.value = '';
    }
  };

  const getSubjectIcon = () => {
    switch (selectedSubject) {
      case "math": return <BookOpen className="text-purple-500" />;
      case "english": return <BookText className="text-green-500" />;
      case "ict": return <Laptop className="text-orange-500" />;
      default: return <BookOpen className="text-purple-500" />;
    }
  };

  // Get color based on subject
  const getSubjectColorClass = () => {
    switch (selectedSubject) {
      case "math": return "border-purple-300 bg-purple-50 text-purple-900";
      case "english": return "border-green-300 bg-green-50 text-green-900";
      case "ict": return "border-orange-300 bg-orange-50 text-orange-900";
      default: return "border-purple-300 bg-purple-50 text-purple-900";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your quiz.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedGrade) {
      toast({
        title: "Grade level required",
        description: "Please select a grade level for your quiz.",
        variant: "destructive",
      });
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.text.trim()) {
        toast({
          title: "Incomplete question",
          description: `Question ${i + 1} needs text.`,
          variant: "destructive",
        });
        return;
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast({
            title: "Incomplete options",
            description: `Option ${String.fromCharCode(65 + j)} for question ${i + 1} is empty.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Create quiz object
    const quiz: Quiz = {
      id: initialData?.id || `quiz-${Date.now()}`,
      title,
      description,
      gradeLevel: parseInt(selectedGrade),
      subject: selectedSubject,
      timeLimit,
      accessCode: initialData?.accessCode || generateAccessCode(),
      createdBy: initialData?.createdBy || JSON.parse(localStorage.getItem('mathWithMalikTeacher') || '{}').id || 'unknown',
      createdAt: initialData?.createdAt || new Date().toISOString(),
      questions
    };

    onSave(quiz);
    localStorage.removeItem('quiz_form_draft');
  };

  const handleCancel = () => {
    localStorage.removeItem('quiz_form_draft');
    onCancel();
  };

  return (
    <Card className="w-full">
      <CardHeader>

        <CardTitle className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          {getSubjectIcon()}
          <span>{initialData ? 'Edit Quiz' : 'Create New Quiz'}</span>
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-text-primary">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fractions Basics"
                required
                className="mt-1 bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-text-primary">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this quiz covers"
                rows={2}
                className="mt-1 bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject" className="text-text-primary">Subject</Label>
                <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as "math" | "english" | "ict")}>
                  <SelectTrigger id="subject" className="mt-1 bg-bg-input border-border text-text-primary">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Math</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="ict">ICT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grade" className="text-text-primary">Grade Level</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="mt-1 bg-bg-input border-border text-text-primary">
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
                <Label htmlFor="timeLimit" className="text-text-primary">Time Limit (seconds per question)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={10}
                  max={300}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  className="mt-1 bg-bg-input border-border text-text-primary focus-visible:ring-focus-blue"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Questions</h3>
              <Button
                type="button"
                onClick={handleAddQuestion}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus size={16} />
                Add Question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={question.id} className={`border rounded-lg p-4 space-y-4 shadow-sm ${initialData?.subject === 'math' || subject === 'math' ? 'border-math-purple/30 bg-math-purple/5 dark:bg-math-purple/10' :
                initialData?.subject === 'english' || subject === 'english' ? 'border-english-green/30 bg-english-green/5 dark:bg-english-green/10' :
                  'border-ict-orange/30 bg-ict-orange/5 dark:bg-ict-orange/10'
                }`}>
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-bold text-text-primary">Question {qIndex + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    variant="ghost"
                    size="sm"
                    className="text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div>
                  <Label htmlFor={`q${qIndex}-text`} className="text-text-secondary">Question Text</Label>
                  <Textarea
                    id={`q${qIndex}-text`}
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    placeholder="e.g., What is 1/4 + 1/2?"
                    rows={2}
                    className="mt-1 bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
                  />
                </div>

                {/* Question Image Upload */}
                <div>
                  <Label htmlFor={`q${qIndex}-image`} className="block mb-2 text-text-secondary">Question Image (Optional)</Label>
                  {question.imageUrl ? (
                    <div className="relative mb-2 w-fit">
                      <img
                        src={question.imageUrl}
                        alt={`Image for question ${qIndex + 1}`}
                        className="max-h-40 rounded-md border border-border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-8 w-8 p-1 rounded-full shadow-md"
                        onClick={() => removeImage(qIndex)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`q${qIndex}-image`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(qIndex, e)}
                        ref={(el) => {
                          if (fileInputRefs.current.length <= qIndex) {
                            fileInputRefs.current = [...fileInputRefs.current, el];
                          } else {
                            fileInputRefs.current[qIndex] = el;
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 border-border text-text-primary hover:bg-bg-secondary"
                        onClick={() => fileInputRefs.current[qIndex]?.click()}
                      >
                        <Upload size={16} />
                        Upload Image
                      </Button>
                      <span className="text-sm text-text-tertiary">Max size: 5MB</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-text-secondary">Options (select the correct answer)</Label>
                  {question.options.map((option, oIndex) => (
                    <div key={`${question.id}-option-${oIndex}`} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors font-bold ${question.correctOptionIndex === oIndex
                          ? 'bg-success-green text-white shadow-md'
                          : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-hover'
                          }`}
                        onClick={() => handleCorrectOptionChange(qIndex, oIndex)}
                      >
                        {String.fromCharCode(65 + oIndex)}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        className="flex-1 bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button type="submit">{initialData ? 'Save Changes' : 'Create Quiz'}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default QuizForm;
