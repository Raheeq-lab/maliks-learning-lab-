
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft, Plus, Trash2, Clock, BookOpen, Laptop, BookText, Brain, BrainCircuit,
  Play, PenTool, FileText, Download, Save, Eye, Sparkles, Wand2, Loader2,
  Upload, File, X, Image, BarChart2, Gamepad2, BriefcaseBusiness,
  MessageSquare, Pen, Headphones, Pencil, Search, MousePointer, CheckSquare, FileUp,
  Lock, Globe, Settings, Zap, AlertCircle
} from "lucide-react";
import {
  Lesson,
  LessonStructure,
  LessonPhase,
  LessonPhaseContent,
  QuizQuestion,
  ActivitySettings
} from '@/types/quiz';
import { getLearningTypes } from "@/utils/lessonUtils";
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AIConfig, generateContent } from "@/services/aiService";

// ... existing interfaces and helpers
interface ScaffoldedLessonBuilderProps {
  grades: number[];
  subject: "math" | "english" | "ict";
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
  initialData?: Lesson | null;
  onSwitchToGeneric?: () => void;
}

const generateAccessCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const initialLessonStructure: LessonStructure = {
  engage: {
    title: "Engage",
    timeInMinutes: 5,
    content: [{ id: `engage-${Date.now()}`, type: "text", content: "" }]
  },
  model: {
    title: "Learn",
    timeInMinutes: 8,
    content: [{ id: `model-${Date.now()}`, type: "text", content: "" }]
  },
  guidedPractice: {
    title: "Practice Together",
    timeInMinutes: 12,
    content: [{ id: `guided-${Date.now()}`, type: "text", content: "" }]
  },
  independentPractice: {
    title: "Try It Yourself",
    timeInMinutes: 10,
    content: [{ id: `independent-${Date.now()}`, type: "text", content: "" }]
  },
  reflect: {
    title: "Think About It",
    timeInMinutes: 5,
    content: [{ id: `reflect-${Date.now()}`, type: "text", content: "" }]
  }
};

const initialActivitySettings: ActivitySettings = {
  activityType: "teacher-led",
  teamMode: {
    enabled: false
  },
  scoring: {
    enabled: false
  }
};

const getAiToolSuggestions = (subject: "math" | "english" | "ict") => {
  switch (subject) {
    case "math":
      return ["IXL AI Assistant", "Khan Academy AI", "Photomath", "Desmos", "GeoGebra"];
    case "english":
      return ["Quill", "CommonLit", "NoRedInk", "ReadWorks AI", "Grammarly"];
    case "ict":
      return ["Codecademy AI", "Replit", "CS First", "Scratch AI", "TinkerCAD"];
    default:
      return [];
  }
};

const getTopicSuggestions = (subject: "math" | "english" | "ict", grade: number) => {
  if (subject === "math") {
    if (grade <= 5) {
      return ["Addition & Subtraction", "Multiplication & Division", "Fractions", "Shapes & Geometry", "Measurement"];
    } else if (grade <= 8) {
      return ["Algebra Basics", "Ratios & Proportions", "Integers", "Geometry & Measurement", "Statistics & Probability"];
    } else {
      return ["Advanced Algebra", "Geometry & Trigonometry", "Functions", "Statistics", "Calculus Concepts"];
    }
  } else if (subject === "english") {
    if (grade <= 5) {
      return ["Phonics & Word Recognition", "Reading Comprehension", "Grammar Basics", "Writing Narratives", "Vocabulary Building"];
    } else if (grade <= 8) {
      return ["Literature Analysis", "Essay Writing", "Grammar & Mechanics", "Reading Non-Fiction", "Creative Writing"];
    } else {
      return ["Literary Analysis", "Research Writing", "Rhetoric & Persuasion", "Shakespeare", "Poetry & Prose"];
    }
  } else {
    if (grade <= 5) {
      return ["Computer Basics", "Internet Safety", "Basic Coding", "Digital Art", "Word Processing"];
    } else if (grade <= 8) {
      return ["Block Coding", "Web Design Basics", "Digital Citizenship", "Multimedia Creation", "Spreadsheets"];
    } else {
      return ["Programming Languages", "Web Development", "Data Analysis", "Cybersecurity", "Game Development"];
    }
  }
};

const ScaffoldedLessonBuilder: React.FC<ScaffoldedLessonBuilderProps> = ({ grades, subject, onSave, onCancel, initialData, onSwitchToGeneric }) => {
  const handleCancel = () => {
    localStorage.removeItem('scaffolded_lesson_builder_draft');
    onCancel();
  };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [gradeLevel, setGradeLevel] = useState<number>(initialData?.gradeLevel || grades[0] || 1);
  const [topic, setTopic] = useState<string>(initialData?.topic || '');
  const [selectedLearningType, setSelectedLearningType] = useState<string>(initialData?.learningType || 'scaffolded-lesson');
  const [lessonStructure, setLessonStructure] = useState<LessonStructure>(initialData?.lessonStructure || initialLessonStructure);
  const [activePhase, setActivePhase] = useState<keyof LessonStructure | 'research'>(initialData?.researchNotes ? 'research' : 'engage');
  const [showPreview, setShowPreview] = useState(false);
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true); // Default to public
  const [activitySettings, setActivitySettings] = useState<ActivitySettings>(initialActivitySettings);

  // Pedagogical Research & Visual Theme State
  const [researchNotes, setResearchNotes] = useState(initialData?.researchNotes || {
    misconceptions: [],
    strategies: [],
    realWorldConnections: [],
    vocabulary: [],
    priorKnowledge: []
  });
  const [visualTheme, setVisualTheme] = useState(initialData?.visualTheme || {
    primaryTheme: '',
    colorPalette: '',
    characters: '',
    animationStyle: '',
    soundTheme: ''
  });
  const [assessmentSettings, setAssessmentSettings] = useState(initialData?.assessmentSettings || {
    formativeChecks: '',
    extension: '',
    support: '',
    accessibility: ''
  });
  const [requiredResources, setRequiredResources] = useState(initialData?.requiredResources || {
    visualAssets: '',
    interactiveTools: '',
    props: '',
    teacherNotes: ''
  });
  const imageInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});
  const fileInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

  // AI Generation State
  const [generatingPhase, setGeneratingPhase] = useState<string | null>(null);
  const [phasePrompts, setPhasePrompts] = useState<{ [key: string]: string }>({});

  const aiTools = getAiToolSuggestions(subject);
  const topicSuggestions = getTopicSuggestions(subject, gradeLevel);

  // Load draft from localStorage on mount
  React.useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem('scaffolded_lesson_builder_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.gradeLevel) setGradeLevel(parsed.gradeLevel);
          if (parsed.topic) setTopic(parsed.topic);
          if (parsed.selectedLearningType) setSelectedLearningType(parsed.selectedLearningType);
          if (parsed.lessonStructure) setLessonStructure(parsed.lessonStructure);
          if (parsed.isPublic !== undefined) setIsPublic(parsed.isPublic);
          if (parsed.researchNotes) setResearchNotes(parsed.researchNotes);
          if (parsed.visualTheme) setVisualTheme(parsed.visualTheme);
          if (parsed.assessmentSettings) setAssessmentSettings(parsed.assessmentSettings);
          if (parsed.requiredResources) setRequiredResources(parsed.requiredResources);
        } catch (e) {
          console.error("Failed to parse lesson draft", e);
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
        gradeLevel,
        topic,
        selectedLearningType,
        lessonStructure,
        isPublic,
        researchNotes,
        visualTheme,
        assessmentSettings,
        requiredResources
      };
      localStorage.setItem('scaffolded_lesson_builder_draft', JSON.stringify(draft));
    }
  }, [title, description, gradeLevel, topic, selectedLearningType, lessonStructure, isPublic, initialData]);

  const totalLessonTime = Object.values(lessonStructure).reduce(
    (total, phase) => total + phase.timeInMinutes, 0
  );

  const handleAddContent = (phase: keyof LessonStructure, type: LessonPhaseContent['type']) => {
    const newContent: LessonPhaseContent = {
      id: `${phase}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type,
      content: ""
    };

    setLessonStructure(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        content: [...prev[phase].content, newContent]
      }
    }));
  };

  const handleRemoveContent = (phase: keyof LessonStructure, contentId: string) => {
    setLessonStructure(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        content: prev[phase].content.filter(item => item.id !== contentId)
      }
    }));
  };

  const handleContentChange = (
    phase: keyof LessonStructure,
    contentId: string,
    field: string,
    value: any
  ) => {
    setLessonStructure(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        content: prev[phase].content.map(item =>
          item.id === contentId ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const handlePhaseTimeChange = (phase: keyof LessonStructure, timeInMinutes: number) => {
    setLessonStructure(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        timeInMinutes
      }
    }));
  };

  const handleActivityChange = (updatedActivity: ActivitySettings) => {
    setActivitySettings(updatedActivity);
  };

  const handleGeneratePhaseContent = async (phase: keyof LessonStructure, contentId: string) => {
    const prompt = phasePrompts[contentId];
    if (!prompt?.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for or instructions for the AI.",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem('aiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your API key in the Content Generator tab settings first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPhase(contentId);

    const config: AIConfig = {
      provider: 'gemini',
      apiKey
    };

    const phaseTitle = lessonStructure[phase].title;
    const time = lessonStructure[phase].timeInMinutes;

    const contextPrompt = `
      Roles: Teacher Assistant
      Subject: ${subject}
      Grade Level: ${gradeLevel}
      Lesson Topic: ${topic || "General"}
      Lesson Title: ${title || "Untitled"}
      Current Phase: ${phaseTitle} (${time} minutes)
      
      Task: Generate content/instructions for this specific phase of the lesson based on the following request:
      "${prompt}"
      
      Keep it concise and appropriate for the grade level.
      `;

    const response = await generateContent(config, contextPrompt, 'text');

    if (response.error) {
      toast({
        title: "Generation Failed",
        description: response.error,
        variant: "destructive",
      });
    } else {
      handleContentChange(phase, contentId, 'content', response.content);
      toast({
        title: "Content Generated",
        description: `Content for ${phaseTitle} updated!`,
      });
    }

    setGeneratingPhase(null);
  };

  const handleForgePhaseVisuals = async (phase: keyof LessonStructure) => {
    const apiKey = localStorage.getItem('aiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your API key first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPhase(`forge-${phase}`);

    const config: AIConfig = {
      provider: 'gemini',
      apiKey
    };

    const phaseTitle = lessonStructure[phase].title;
    const forgePrompt = `Generate cinematic visual metadata and pedagogical approach for the "${phaseTitle}" phase of a ${subject} lesson on "${topic || title}".
    Current phase content: ${lessonStructure[phase].content.map(c => c.content).join(' ')}`;

    const response = await generateContent(config, forgePrompt, 'phase-visuals');

    if (response.error) {
      toast({
        title: "Forge Failed",
        description: response.error,
        variant: "destructive",
      });
    } else {
      try {
        const visuals = JSON.parse(response.content);

        setLessonStructure(prev => ({
          ...prev,
          [phase]: {
            ...prev[phase],
            visualMetadata: {
              ...prev[phase].visualMetadata,
              visualTheme: visuals.visualTheme,
              animations: visuals.animations,
              [phase === 'engage' ? 'researchHook' :
                phase === 'model' ? 'researchContent' :
                  phase === 'guidedPractice' ? 'researchStrategy' :
                    phase === 'independentPractice' ? 'researchPractice' :
                      'researchReflection']: visuals.researchNote
            }
          }
        }));

        toast({
          title: "Visuals Forged!",
          description: `Applied high-fidelity design to the ${phaseTitle} phase.`,
        });
      } catch (e) {
        toast({
          title: "Format Error",
          description: "AI returned invalid JSON. Try again.",
          variant: "destructive",
        });
      }
    }

    setGeneratingPhase(null);
  };

  const handleImageUpload = (phase: keyof LessonStructure, contentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image size should be less than 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleContentChange(phase, contentId, "imageUrl", base64);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (phase: keyof LessonStructure, contentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Video size should be less than 50MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleContentChange(phase, contentId, "videoUrl", base64);
      handleContentChange(phase, contentId, "fileName", file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (phase: keyof LessonStructure, contentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Document size should be less than 20MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleContentChange(phase, contentId, "fileUrl", base64);
      handleContentChange(phase, contentId, "fileName", file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (phase: keyof LessonStructure, contentId: string) => {
    handleContentChange(phase, contentId, "imageUrl", undefined);
    if (imageInputRefs.current[contentId]) imageInputRefs.current[contentId]!.value = '';
  };

  const removeVideo = (phase: keyof LessonStructure, contentId: string) => {
    handleContentChange(phase, contentId, "videoUrl", undefined);
    handleContentChange(phase, contentId, "fileName", undefined);
    if (videoInputRefs.current[contentId]) videoInputRefs.current[contentId]!.value = '';
  };

  const removeFile = (phase: keyof LessonStructure, contentId: string) => {
    handleContentChange(phase, contentId, "fileUrl", undefined);
    handleContentChange(phase, contentId, "fileName", undefined);
    if (fileInputRefs.current[contentId]) fileInputRefs.current[contentId]!.value = '';
  };


  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your lesson.",
        variant: "destructive",
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please select or enter a topic for your lesson.",
        variant: "destructive",
      });
      return;
    }

    const lesson: Lesson = {
      id: initialData?.id || `lesson-${Date.now()}`,
      title,
      description: description || `${title} - ${topic} (Grade ${gradeLevel})`,
      gradeLevel,
      subject,
      content: [],
      lessonStructure,
      activity: activitySettings,
      createdBy: initialData?.createdBy || JSON.parse(localStorage.getItem('mathWithMalikTeacher') || '{}').id || 'unknown',
      createdAt: initialData?.createdAt || new Date().toISOString(),
      accessCode: initialData?.accessCode || generateAccessCode(),
      learningType: selectedLearningType,
      topic,
      researchNotes,
      visualTheme,
      assessmentSettings,
      requiredResources,
      isPublic,
    };

    onSave(lesson);
    localStorage.removeItem('scaffolded_lesson_builder_draft');
    toast({
      title: "Lesson saved!",
      description: "Your scaffolded lesson has been created successfully.",
    });
  };

  const getPhaseColor = (phase: keyof LessonStructure) => {
    switch (phase) {
      case "engage": return "bg-blue-500 text-white";
      case "model": return "bg-purple-500 text-white";
      case "guidedPractice": return "bg-green-500 text-white";
      case "independentPractice": return "bg-orange-500 text-white";
      case "reflect": return "bg-pink-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getSubjectIcon = () => {
    switch (subject) {
      case "math": return <BookOpen className="text-purple-500" />;
      case "english": return <BookText className="text-green-500" />;
      case "ict": return <Laptop className="text-orange-500" />;
      default: return <BookOpen />;
    }
  };

  const renderContentBlock = (
    phase: keyof LessonStructure,
    content: LessonPhaseContent,
    index: number
  ) => {
    switch (content.type) {
      case "text":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label className="text-text-primary">Text Content</Label>
              </div>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <Textarea
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder={`Enter content for the ${lessonStructure[phase].title} phase...`}
              rows={4}
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Image</Label>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                ref={(el) => (imageInputRefs.current[content.id] = el)}
                onChange={(e) => handleImageUpload(phase, content.id, e)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRefs.current[content.id]?.click()}
                className="flex items-center gap-2 border-border text-text-primary hover:bg-bg-secondary"
              >
                <Upload size={16} />
                Upload Image
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const apiKey = localStorage.getItem('aiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
                  if (!apiKey) {
                    toast({ title: "API Key Required", description: "Please configure your API key.", variant: "destructive" });
                    return;
                  }
                  setGeneratingPhase(content.id);
                  const config: AIConfig = { provider: 'gemini', apiKey };
                  const imagePrompt = `Educational illustration for a ${subject} lesson on "${topic || title}". Phase: ${lessonStructure[phase].title}. Context: ${content.content || "General"}`;
                  // In a real app, this would call a DALL-E/Imagen API.
                  // For now, we simulate by getting a styled prompt and potentially a placeholder or real URL if hooked up.
                  const response = await generateContent(config, `Provide a high-quality, professional educational image URL link related to "${imagePrompt}". For demo purposes, you can return a high-res Unsplash search URL like https://images.unsplash.com/photo-[id]?auto=format&fit=crop&q=80&w=1000 or similar. Just return the URL.`, 'text');

                  if (response.content.startsWith('http')) {
                    handleContentChange(phase, content.id, "imageUrl", response.content);
                    toast({ title: "Image Generated!", description: "Synced high-fidelity visual asset." });
                  } else {
                    toast({ title: "Forge Failed", description: "AI could not provide a valid image link.", variant: "destructive" });
                  }
                  setGeneratingPhase(null);
                }}
                disabled={generatingPhase === content.id}
                className="flex items-center gap-2 border-math-purple text-math-purple hover:bg-math-purple/10"
              >
                {generatingPhase === content.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                AI Forge Image
              </Button>
              {content.imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeImage(phase, content.id)}
                  className="text-error-coral hover:text-error-coral-dark"
                >
                  <X size={16} className="mr-1" /> Remove
                </Button>
              )}
            </div>

            {content.imageUrl && (
              <div className="mt-2">
                <img
                  src={content.imageUrl}
                  alt={content.content || "Lesson image"}
                  className="max-h-40 rounded border border-border"
                />
              </div>
            )}

            <Input
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Image caption (optional)"
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Video</Label>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="video/*"
                ref={(el) => (videoInputRefs.current[content.id] = el)}
                onChange={(e) => handleVideoUpload(phase, content.id, e)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => videoInputRefs.current[content.id]?.click()}
                className="flex items-center gap-2 border-border text-text-primary hover:bg-bg-secondary"
              >
                <Upload size={16} />
                Upload Video
              </Button>
              {content.videoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeVideo(phase, content.id)}
                  className="text-error-coral hover:text-error-coral-dark"
                >
                  <X size={16} className="mr-1" /> Remove
                </Button>
              )}
            </div>

            {content.videoUrl && (
              <div className="mt-2 p-2 border border-border rounded bg-bg-secondary flex items-center gap-2">
                <Play size={16} className="text-focus-blue" />
                <span className="text-sm truncate max-w-[200px] text-text-secondary">{content.fileName || "Video file uploaded"}</span>
              </div>
            )}

            <Input
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Video title or description"
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Quick Quiz Question</Label>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
            <Textarea
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Enter quiz question"
              rows={2}
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />

            {/* Simple quiz options - could be expanded for more complex quizzes */}
            <div className="space-y-2">
              <Label className="text-text-secondary">Options (first one will be correct)</Label>
              {["A", "B", "C", "D"].map((option, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center font-bold text-text-primary">
                    {option}
                  </div>
                  <Input
                    placeholder={`Option ${option}`}
                    value={content.quizQuestions?.[0]?.options?.[idx] || ""}
                    onChange={(e) => {
                      const currentOptions = content.quizQuestions?.[0]?.options || ["", "", "", ""];
                      const newOptions = [...currentOptions];
                      newOptions[idx] = e.target.value;

                      const quizQuestions: QuizQuestion[] = [{
                        id: content.id + "-quiz",
                        text: content.content,
                        options: newOptions,
                        correctOptionIndex: 0, // First option is correct by default
                      }];

                      handleContentChange(phase, content.id, "quizQuestions", quizQuestions);
                    }}
                    className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "activity":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label className="text-text-primary">Activity</Label>
              </div>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <Textarea
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Describe the activity"
              rows={3}
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
            <div className="pt-2">
              <Label className="text-text-secondary">AI Tool Assistance (optional)</Label>
              <Select
                value={content.aiToolUsed || "none"}
                onValueChange={(value) => handleContentChange(phase, content.id, "aiToolUsed", value)}
              >
                <SelectTrigger className="bg-bg-input border-border text-text-primary">
                  <SelectValue placeholder="Select an AI tool to help" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No AI tool</SelectItem>
                  {aiTools.map(tool => (
                    <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "resource":
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Resource Link</Label>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
            <Input
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Resource title or description"
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
            <Input
              value={content.resourceUrl || ''}
              onChange={(e) => handleContentChange(phase, content.id, "resourceUrl", e.target.value)}
              placeholder="Resource URL or reference"
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
          </div>
        );

      case "file":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Document (PDF, Word, PPT)</Label>
              <Button
                type="button"
                onClick={() => handleRemoveContent(phase, content.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                ref={(el) => (fileInputRefs.current[content.id] = el)}
                onChange={(e) => handleFileUpload(phase, content.id, e)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRefs.current[content.id]?.click()}
                className="flex items-center gap-2 border-border text-text-primary hover:bg-bg-secondary"
              >
                <Upload size={16} />
                Upload Document
              </Button>
              {content.fileUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeFile(phase, content.id)}
                  className="text-error-coral hover:text-error-coral-dark"
                >
                  <X size={16} className="mr-1" /> Remove
                </Button>
              )}
            </div>

            {content.fileUrl && (
              <div className="mt-2 p-3 border border-border rounded bg-bg-secondary flex items-center gap-3">
                <File className="text-focus-blue" size={24} />
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate text-sm text-text-primary">{content.fileName || 'Document'}</p>
                </div>
              </div>
            )}

            <Input
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Document description"
              className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
            />
          </div>
        );

      case "poll":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Interactive Poll</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <Input
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Ask a question..."
              className="bg-bg-input border-border"
            />
            <div className="space-y-2">
              <Label className="text-xs text-text-secondary uppercase">Options</Label>
              {(content.pollOptions || ["", ""]).map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(content.pollOptions || ["", ""])];
                      newOpts[i] = e.target.value;
                      handleContentChange(phase, content.id, "pollOptions", newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="bg-bg-input border-border"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newOpts = (content.pollOptions || ["", ""]).filter((_, idx) => idx !== i);
                      handleContentChange(phase, content.id, "pollOptions", newOpts);
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContentChange(phase, content.id, "pollOptions", [...(content.pollOptions || ["", ""]), ""])}
                className="w-full border-dashed"
              >
                <Plus size={14} className="mr-2" /> Add Option
              </Button>
            </div>
          </div>
        );

      case "brainstorm":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Brainstorm Board</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <Textarea
              value={content.content}
              onChange={(e) => handleContentChange(phase, content.id, "content", e.target.value)}
              placeholder="Brainstorming prompt..."
              rows={3}
              className="bg-bg-input border-border"
            />
          </div>
        );

      case "flashcards":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Flashcards</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              {(content.flashcards || [{ id: '1', front: '', back: '' }]).map((card, i) => (
                <div key={card.id} className="p-3 border rounded-lg bg-bg-secondary/50 space-y-2">
                  <Input
                    value={card.front}
                    onChange={(e) => {
                      const newCards = [...(content.flashcards || [])];
                      newCards[i] = { ...card, front: e.target.value };
                      handleContentChange(phase, content.id, "flashcards", newCards);
                    }}
                    placeholder="Front (Term)"
                    className="bg-bg-input border-border"
                  />
                  <Input
                    value={card.back}
                    onChange={(e) => {
                      const newCards = [...(content.flashcards || [])];
                      newCards[i] = { ...card, back: e.target.value };
                      handleContentChange(phase, content.id, "flashcards", newCards);
                    }}
                    placeholder="Back (Definition)"
                    className="bg-bg-input border-border"
                  />
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContentChange(phase, content.id, "flashcards", [...(content.flashcards || []), { id: Date.now().toString(), front: '', back: '' }])}
                className="w-full border-dashed"
              >
                <Plus size={14} className="mr-2" /> Add Card
              </Button>
            </div>
          </div>
        );

      case "steps":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Step-by-Step Guide</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              {(content.steps || [{ title: '', content: '' }]).map((step, i) => (
                <div key={i} className="p-3 border rounded-lg bg-bg-secondary/50 space-y-2">
                  <Input
                    value={step.title}
                    onChange={(e) => {
                      const newSteps = [...(content.steps || [])];
                      newSteps[i] = { ...step, title: e.target.value };
                      handleContentChange(phase, content.id, "steps", newSteps);
                    }}
                    placeholder={`Step ${i + 1} Title`}
                    className="bg-bg-input border-border"
                  />
                  <Textarea
                    value={step.content}
                    onChange={(e) => {
                      const newSteps = [...(content.steps || [])];
                      newSteps[i] = { ...step, content: e.target.value };
                      handleContentChange(phase, content.id, "steps", newSteps);
                    }}
                    placeholder="Detailed explanation..."
                    className="bg-bg-input border-border"
                  />
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContentChange(phase, content.id, "steps", [...(content.steps || []), { title: '', content: '' }])}
                className="w-full border-dashed"
              >
                <Plus size={14} className="mr-2" /> Add Step
              </Button>
            </div>
          </div>
        );

      case "scaffolded":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Scaffolded Question Set</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              {(content.scaffoldedLevels || [
                { level: 1, question: '', hint: '', answer: '' },
                { level: 2, question: '', hint: '', answer: '' },
                { level: 3, question: '', hint: '', answer: '' }
              ]).map((lvl, i) => (
                <div key={lvl.level} className="p-3 border rounded-lg bg-bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase text-math-purple">Level {lvl.level}</Label>
                  </div>
                  <Textarea
                    value={lvl.question}
                    onChange={(e) => {
                      const newLvls = [...(content.scaffoldedLevels || [])];
                      newLvls[i] = { ...lvl, question: e.target.value };
                      handleContentChange(phase, content.id, "scaffoldedLevels", newLvls);
                    }}
                    placeholder="Question..."
                    className="bg-bg-input border-border"
                  />
                  <Input
                    value={lvl.hint}
                    onChange={(e) => {
                      const newLvls = [...(content.scaffoldedLevels || [])];
                      newLvls[i] = { ...lvl, hint: e.target.value };
                      handleContentChange(phase, content.id, "scaffoldedLevels", newLvls);
                    }}
                    placeholder="Scaffolded hint..."
                    className="bg-bg-input border-border"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "exit-ticket":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">3-2-1 Exit Ticket</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <p className="text-xs text-text-secondary italic">Standardized reflection: 3 Learnings, 2 Questions, 1 Big Insight.</p>
          </div>
        );

      case "presentation":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-text-primary">Interactive Slide Deck</Label>
              <Button type="button" onClick={() => handleRemoveContent(phase, content.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-coral">
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="space-y-6">
              {(content.slides || [{ title: 'Slide 1', bullets: [], imagePrompt: '', speakerNotes: '' }]).map((slide, i) => (
                <div key={i} className="p-4 border rounded-xl bg-bg-secondary/50 space-y-3 relative group">
                  <div className="flex justify-between">
                    <Label className="text-xs font-bold uppercase text-focus-blue">Slide {i + 1}</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newSlides = [...(content.slides || [])];
                        newSlides.splice(i, 1);
                        handleContentChange(phase, content.id, "slides", newSlides);
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-error-coral"
                    >
                      <X size={14} />
                    </Button>
                  </div>

                  <Input
                    value={slide.title}
                    onChange={(e) => {
                      const newSlides = [...(content.slides || [])];
                      newSlides[i] = { ...slide, title: e.target.value };
                      handleContentChange(phase, content.id, "slides", newSlides);
                    }}
                    placeholder="Slide Title"
                    className="font-bold bg-bg-input border-border"
                  />

                  <div>
                    <Label className="text-[10px] text-text-tertiary uppercase">Bullet Points (One per line)</Label>
                    <Textarea
                      value={Array.isArray(slide.bullets) ? slide.bullets.join('\n') : slide.bullets}
                      onChange={(e) => {
                        const newSlides = [...(content.slides || [])];
                        // Split by newline to store as array
                        newSlides[i] = { ...slide, bullets: e.target.value.split('\n') };
                        handleContentChange(phase, content.id, "slides", newSlides);
                      }}
                      placeholder="• Point 1&#10;• Point 2&#10;• Point 3"
                      rows={4}
                      className="bg-bg-input border-border text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-text-tertiary uppercase">Visual Prompt</Label>
                      <Input
                        value={slide.imagePrompt || ''}
                        onChange={(e) => {
                          const newSlides = [...(content.slides || [])];
                          newSlides[i] = { ...slide, imagePrompt: e.target.value };
                          handleContentChange(phase, content.id, "slides", newSlides);
                        }}
                        placeholder="Describe the slide visual..."
                        className="bg-bg-input border-border text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-text-tertiary uppercase">Speaker Notes</Label>
                      <Input
                        value={slide.speakerNotes || ''}
                        onChange={(e) => {
                          const newSlides = [...(content.slides || [])];
                          newSlides[i] = { ...slide, speakerNotes: e.target.value };
                          handleContentChange(phase, content.id, "slides", newSlides);
                        }}
                        placeholder="Notes for you..."
                        className="bg-bg-input border-border text-xs bg-yellow-50/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContentChange(phase, content.id, "slides", [...(content.slides || []), { title: 'New Slide', bullets: [], imagePrompt: '', speakerNotes: '' }])}
                className="w-full border-dashed"
              >
                <Plus size={14} className="mr-2" /> Add Slide
              </Button>
            </div>
          </div>
        );
    }
  };

  const handleMetadataChange = (phase: keyof LessonStructure, field: string, value: string) => {
    setLessonStructure(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        visualMetadata: {
          ...prev[phase].visualMetadata,
          [field]: value
        }
      }
    }));
  };

  const PhaseVisualMetadata = ({ phase }: { phase: keyof LessonStructure }) => {
    const metadata = lessonStructure[phase].visualMetadata || {};

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-secondary/30 p-4 rounded-xl border border-border/50 mb-6 relative group">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleForgePhaseVisuals(phase)}
          disabled={generatingPhase === `forge-${phase}`}
          className="absolute -top-3 -right-3 shadow-lg bg-white border-math-purple hover:bg-math-purple/10 text-math-purple z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {generatingPhase === `forge-${phase}` ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Wand2 className="h-4 w-4 mr-2" />
          )}
          Magic Forge
        </Button>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-math-purple flex items-center gap-1.5">
              <Sparkles size={12} /> Visual Execution Theme
            </Label>
            <Input
              placeholder="e.g. Glowing space station control room..."
              value={metadata.visualTheme || ''}
              onChange={(e) => handleMetadataChange(phase, 'visualTheme', e.target.value)}
              className="text-xs bg-bg-input h-8 border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-math-purple flex items-center gap-1.5">
              <Play size={12} /> Phase Animations
            </Label>
            <Input
              placeholder="e.g. Floating particles, slow zoom..."
              value={metadata.animations || ''}
              onChange={(e) => handleMetadataChange(phase, 'animations', e.target.value)}
              className="text-xs bg-bg-input h-8 border-border"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-focus-blue flex items-center gap-1.5">
              <Brain size={12} /> Pedagogical Approach
            </Label>
            <Textarea
              placeholder="Research-based approach for this phase..."
              value={
                metadata.researchHook ||
                metadata.researchContent ||
                metadata.researchStrategy ||
                metadata.researchPractice ||
                metadata.researchReflection || ''
              }
              onChange={(e) => {
                const fieldMap: Record<string, string> = {
                  engage: 'researchHook',
                  model: 'researchContent',
                  guidedPractice: 'researchStrategy',
                  independentPractice: 'researchPractice',
                  reflect: 'researchReflection'
                };
                handleMetadataChange(phase, fieldMap[phase], e.target.value);
              }}
              className="text-xs bg-bg-input min-h-[80px] border-border"
            />
          </div>
        </div>
      </div>
    );
  };

  const StudentPreview = () => {
    // ... existing preview code
    const [currentPhase, setCurrentPhase] = useState<keyof LessonStructure>("engage");
    const phases: (keyof LessonStructure)[] = ["engage", "model", "guidedPractice", "independentPractice", "reflect"];
    const currentPhaseIndex = phases.indexOf(currentPhase);

    const phaseNames: Record<keyof LessonStructure, string> = {
      engage: "Engage",
      model: "Learn",
      guidedPractice: "Practice Together",
      independentPractice: "Try It Yourself",
      reflect: "Think About It"
    };

    const phaseIcons: Record<keyof LessonStructure, React.ReactNode> = {
      engage: <Play size={18} />,
      model: <BookOpen size={18} />,
      guidedPractice: <PenTool size={18} />,
      independentPractice: <FileText size={18} />,
      reflect: <Brain size={18} />
    };

    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="border-2 border-blue-300 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-poppins">{title || "Awesome Lesson"}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                  <Clock size={14} className="mr-1" /> {totalLessonTime} min
                </Badge>
              </div>
            </div>
            <p className="opacity-90 text-sm mt-1">{topic || "Fascinating Topic"}</p>
          </CardHeader>

          <div className="p-4">
            <div className="flex mb-4 justify-between gap-2">
              {phases.map((phase, index) => (
                <div
                  key={phase}
                  onClick={() => setCurrentPhase(phase)}
                  className={`cursor-pointer flex-1 rounded-lg border transition-all ${currentPhase === phase
                    ? 'border-2 border-blue-500 shadow-md transform scale-105'
                    : 'border-gray-200'
                    } ${index < currentPhaseIndex ? 'bg-gray-100' : ''}`}
                >
                  <div className={`rounded-t-md p-2 flex justify-center items-center gap-1 ${getPhaseColor(phase)
                    }`}>
                    {phaseIcons[phase]}
                    <span className="text-xs font-medium">{phaseNames[phase]}</span>
                  </div>
                  <div className="p-2 text-center text-xs">
                    {lessonStructure[phase].timeInMinutes} min
                    {index < currentPhaseIndex && (
                      <div className="mt-1 flex justify-center">
                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <Progress
                value={(currentPhaseIndex + 1) / phases.length * 100}
                className="h-2"
              />
              <div className="mt-1 text-right text-xs text-gray-500">
                Progress: {Math.round((currentPhaseIndex + 1) / phases.length * 100)}%
              </div>
            </div>

            <Card className="border shadow-sm">
              <CardHeader className={`py-3 ${getPhaseColor(currentPhase)}`}>
                <CardTitle className="text-lg flex items-center gap-2">
                  {phaseIcons[currentPhase]}
                  {phaseNames[currentPhase]}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4">
                {lessonStructure[currentPhase].content.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Content for this section will appear here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lessonStructure[currentPhase].content.map((content, idx) => (
                      <div key={idx} className="border-b pb-3 last:border-0">
                        {content.type === "text" && (
                          <p>{content.content || "Text content will appear here"}</p>
                        )}
                        {content.type === "image" && content.imageUrl && (
                          <div className="space-y-2">
                            <img
                              src={content.imageUrl}
                              alt={content.content || "Lesson image"}
                              className="max-h-40 rounded mx-auto"
                            />
                            {content.content && <p className="text-sm text-center">{content.content}</p>}
                          </div>
                        )}
                        {content.type === "quiz" && (
                          <div className="space-y-3">
                            <p className="font-medium">{content.content || "Quiz question"}</p>
                            <div className="space-y-2">
                              {(content.quizQuestions?.[0]?.options || ["Option A", "Option B", "Option C", "Option D"]).map((option, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-white border border-gray-300 text-xs">
                                    {String.fromCharCode(65 + i)}
                                  </div>
                                  <span>{option || `Option ${String.fromCharCode(65 + i)}`}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {content.type === "activity" && (
                          <div className="space-y-2">
                            <p>{content.content || "Activity instructions"}</p>
                            {content.aiToolUsed && (
                              <div className="bg-blue-50 p-2 rounded flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Assisted by {content.aiToolUsed}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {content.type === "resource" && (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <div className="flex-1">
                              <div className="font-medium">{content.content || "Resource Title"}</div>
                              {content.resourceUrl && (
                                <div className="text-xs text-blue-500">{content.resourceUrl}</div>
                              )}
                            </div>
                          </div>
                        )}
                        {content.type === "file" && content.fileUrl && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-100">
                            <File className="text-blue-500" size={24} />
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium text-blue-900 truncate">{content.fileName || "Document"}</div>
                              <p className="text-xs text-blue-700">{content.content || "Uploaded document"}</p>
                              <a
                                href={content.fileUrl}
                                download={content.fileName || 'download'}
                                className="text-xs text-blue-600 font-bold hover:underline mt-1 inline-block"
                              >
                                Download / View
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-3 border-t bg-gray-50 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPhaseIndex > 0) {
                      setCurrentPhase(phases[currentPhaseIndex - 1]);
                    }
                  }}
                  disabled={currentPhaseIndex === 0}
                >
                  Previous
                </Button>

                <div className="flex items-center">
                  {currentPhaseIndex < phases.length - 1 ? (
                    <Badge variant="outline" className="bg-gray-100">
                      {lessonStructure[currentPhase].timeInMinutes} min
                    </Badge>
                  ) : (
                    <div className="flex gap-1">
                      <Badge className="bg-yellow-500">+10 XP</Badge>
                      <Badge className="bg-blue-500">Completed!</Badge>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    if (currentPhaseIndex < phases.length - 1) {
                      setCurrentPhase(phases[currentPhaseIndex + 1]);
                    }
                  }}
                  disabled={currentPhaseIndex === phases.length - 1}
                >
                  Next
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Card>
      </div>
    );
    // ...
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="mr-2"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {getSubjectIcon()}
          <span>Scaffolded Lesson Builder</span>
        </h1>
      </div>

      {showPreview ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">Student Preview</h2>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Back to Editor
            </Button>
          </div>
          <StudentPreview />
        </div>
      ) : (
        <Card className="border-2 border-border shadow-md bg-bg-card">
          <CardHeader>
            <CardTitle className="text-text-primary">Create a 40-Minute Scaffolded Lesson</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label className="text-lg font-bold mb-4 block text-text-primary">Learning Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getLearningTypes(subject).map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedLearningType === type.id
                      ? 'border-2 border-focus-blue bg-focus-blue/10 shadow-md transform scale-[1.02]'
                      : 'hover:bg-bg-secondary border-border'
                      }`}
                    onClick={() => setSelectedLearningType(type.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-bg-secondary text-text-primary">
                        {type.icon}
                      </div>
                      <h3 className="font-semibold text-text-primary">{type.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-text-primary">Lesson Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to Fractions"
                  className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
                />
              </div>

              <div>
                <Label htmlFor="topic" className="text-text-primary">Topic</Label>
                <div className="relative">
                  <Input
                    id="topic"
                    list="topicSuggestions"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`e.g., ${topicSuggestions[0] || "Enter topic"}`}
                    className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
                  />
                  <datalist id="topicSuggestions">
                    {topicSuggestions.map((topic, i) => (
                      <option key={i} value={topic} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-text-primary">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the lesson"
                  rows={2}
                  className="bg-bg-input border-border text-text-primary placeholder:text-text-tertiary focus-visible:ring-focus-blue"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex flex-wrap gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Total: {totalLessonTime} minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Tabs
                value={activePhase === "research" ? "research" : activePhase}
                onValueChange={(value) => setActivePhase(value as any)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-6 mb-4">
                  <TabsTrigger
                    value="research"
                    className="data-[state=active]:bg-math-purple data-[state=active]:text-white"
                  >
                    <BrainCircuit size={14} className="mr-1" />
                    Research
                  </TabsTrigger>
                  <TabsTrigger
                    value="engage"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    Engage
                    <span className="ml-1 text-xs">({lessonStructure.engage.timeInMinutes}m)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="model"
                    className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    Learn
                    <span className="ml-1 text-xs">({lessonStructure.model.timeInMinutes}m)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="guidedPractice"
                    className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  >
                    Practice Together
                    <span className="ml-1 text-xs">({lessonStructure.guidedPractice.timeInMinutes}m)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="independentPractice"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    Try It Yourself
                    <span className="ml-1 text-xs">({lessonStructure.independentPractice.timeInMinutes}m)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="reflect"
                    className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"
                  >
                    Think About It
                    <span className="ml-1 text-xs">({lessonStructure.reflect.timeInMinutes}m)</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="research" className="space-y-6">
                  <div className="bg-math-purple/5 p-4 rounded-xl border border-math-purple/20 mb-6">
                    <h3 className="font-bold text-math-purple flex items-center gap-2">
                      <BrainCircuit size={22} />
                      Pedagogical Research Foundation
                    </h3>
                    <p className="text-[10px] text-text-secondary mt-1">Define the research and visual concept that grounds this lesson.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border bg-bg-card">
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-text-primary">
                          <AlertCircle size={16} className="text-red-500" />
                          Student Misconceptions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="e.g. Students often think fractions with larger denominators are larger numbers..."
                          value={researchNotes.misconceptions.join('\n')}
                          onChange={(e) => setResearchNotes({ ...researchNotes, misconceptions: e.target.value.split('\n') })}
                          rows={4}
                          className="text-xs bg-bg-input border-border"
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-bg-card">
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-text-primary">
                          <Brain size={16} className="text-math-purple" />
                          Teaching Strategies
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="e.g. Using visual area models to represent fractional parts..."
                          value={researchNotes.strategies.join('\n')}
                          onChange={(e) => setResearchNotes({ ...researchNotes, strategies: e.target.value.split('\n') })}
                          rows={4}
                          className="text-xs bg-bg-input border-border"
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-bg-card">
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-text-primary">
                          <Globe size={16} className="text-focus-blue" />
                          Real-World & Vocabulary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-text-tertiary">Real-World Connections</Label>
                          <Input
                            placeholder="e.g. Slicing pizza, measuring ingredients..."
                            value={researchNotes.realWorldConnections.join(', ')}
                            onChange={(e) => setResearchNotes({ ...researchNotes, realWorldConnections: e.target.value.split(', ') })}
                            className="text-xs bg-bg-input border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-text-tertiary">Key Vocabulary</Label>
                          <Input
                            placeholder="e.g. Numerator, Denominator, Equivalent..."
                            value={researchNotes.vocabulary.join(', ')}
                            onChange={(e) => setResearchNotes({ ...researchNotes, vocabulary: e.target.value.split(', ') })}
                            className="text-xs bg-bg-input border-border"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-ict-orange/20 bg-ict-orange/5 shadow-sm border-dashed">
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-ict-orange">
                          <Sparkles size={16} />
                          Visual Identity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-text-tertiary">Primary Theme</Label>
                            <Input
                              placeholder="e.g. Pizzeria, Space Mission"
                              value={visualTheme.primaryTheme}
                              onChange={(e) => setVisualTheme({ ...visualTheme, primaryTheme: e.target.value })}
                              className="text-xs bg-bg-input border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-text-tertiary">Palette</Label>
                            <Input
                              placeholder="#FF0000, #00FF00"
                              value={visualTheme.colorPalette}
                              onChange={(e) => setVisualTheme({ ...visualTheme, colorPalette: e.target.value })}
                              className="text-xs bg-bg-input border-border"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-text-tertiary">Animation Spirit</Label>
                          <Input
                            placeholder="e.g. Bouncy transitions, slow fades..."
                            value={visualTheme.animationStyle}
                            onChange={(e) => setVisualTheme({ ...visualTheme, animationStyle: e.target.value })}
                            className="text-xs bg-bg-input border-border"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="engage" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">Engage Phase</h3>
                      <p className="text-sm text-text-secondary">Hook students and activate prior knowledge</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="engageTime" className="mr-2 text-sm text-text-secondary">Minutes:</Label>
                        <Input
                          id="engageTime"
                          type="number"
                          min="1"
                          max="15"
                          value={lessonStructure.engage.timeInMinutes}
                          onChange={(e) => handlePhaseTimeChange("engage", parseInt(e.target.value) || 5)}
                          className="w-16 h-8 px-2 py-1 bg-bg-input border-border text-text-primary"
                        />
                      </div>
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-border text-text-primary hover:bg-bg-secondary"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </Button>
                    </div>
                  </div>

                  <PhaseVisualMetadata phase="engage" />

                  {lessonStructure.engage.content.map((content, index) => (
                    <div key={content.id} className="bg-bg-card rounded-md border border-border p-4 shadow-sm">
                      {renderContentBlock("engage", content, index)}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContent("engage", "text")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-border text-text-primary hover:bg-bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Add Text</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("engage", "image")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-border text-text-primary hover:bg-bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Add Image</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("engage", "video")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-border text-text-primary hover:bg-bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Add Video</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("engage", "activity")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-border text-text-primary hover:bg-bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Add Activity</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("engage", "file")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-border text-text-primary hover:bg-bg-secondary"
                    >
                      <Plus size={16} />
                      <span>Add File</span>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="model" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Model Phase</h3>
                      <p className="text-sm text-gray-500">Demonstrate and explain new concepts</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="modelTime" className="mr-2 text-sm">Minutes:</Label>
                        <Input
                          id="modelTime"
                          type="number"
                          min="1"
                          max="15"
                          value={lessonStructure.model.timeInMinutes}
                          onChange={(e) => handlePhaseTimeChange("model", parseInt(e.target.value) || 8)}
                          className="w-16 h-8 px-2 py-1"
                        />
                      </div>
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </Button>
                    </div>
                  </div>

                  <PhaseVisualMetadata phase="model" />

                  {lessonStructure.model.content.map((content, index) => (
                    <div key={content.id} className="bg-bg-card rounded-md border border-border p-4 shadow-sm">
                      {renderContentBlock("model", content, index)}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContent("model", "text")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Text</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("model", "image")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Image</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("model", "video")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Video</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("model", "resource")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Resource</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("model", "file")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add File</span>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="guidedPractice" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Guided Practice Phase</h3>
                      <p className="text-sm text-gray-500">Practice with teacher support</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* ... existing time input */}
                      <div className="flex items-center">
                        <Label htmlFor="guidedTime" className="mr-2 text-sm">Minutes:</Label>
                        <Input
                          id="guidedTime"
                          type="number"
                          min="1"
                          max="20"
                          value={lessonStructure.guidedPractice.timeInMinutes}
                          onChange={(e) => handlePhaseTimeChange("guidedPractice", parseInt(e.target.value) || 12)}
                          className="w-16 h-8 px-2 py-1"
                        />
                      </div>
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </Button>
                    </div>
                  </div>

                  <PhaseVisualMetadata phase="guidedPractice" />

                  {lessonStructure.guidedPractice.content.map((content, index) => (
                    <div key={content.id} className="bg-bg-card rounded-md border border-border p-4 shadow-sm">
                      {renderContentBlock("guidedPractice", content, index)}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContent("guidedPractice", "text")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Text</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("guidedPractice", "quiz")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Quiz</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("guidedPractice", "activity")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Activity</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("guidedPractice", "file")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add File</span>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="independentPractice" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Independent Practice Phase</h3>
                      <p className="text-sm text-gray-500">Students apply learning independently</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="indTime" className="mr-2 text-sm">Minutes:</Label>
                        <Input
                          id="indTime"
                          type="number"
                          min="1"
                          max="20"
                          value={lessonStructure.independentPractice.timeInMinutes}
                          onChange={(e) => handlePhaseTimeChange("independentPractice", parseInt(e.target.value) || 10)}
                          className="w-16 h-8 px-2 py-1"
                        />
                      </div>
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </Button>
                    </div>
                  </div>

                  <PhaseVisualMetadata phase="independentPractice" />

                  {lessonStructure.independentPractice.content.map((content, index) => (
                    <div key={content.id} className="bg-bg-card rounded-md border border-border p-4 shadow-sm">
                      {renderContentBlock("independentPractice", content, index)}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContent("independentPractice", "text")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Text</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("independentPractice", "quiz")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Quiz</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("independentPractice", "activity")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Activity</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("independentPractice", "file")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add File</span>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="reflect" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Reflect Phase</h3>
                      <p className="text-sm text-gray-500">Summarize and check for understanding</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="reflectTime" className="mr-2 text-sm">Minutes:</Label>
                        <Input
                          id="reflectTime"
                          type="number"
                          min="1"
                          max="10"
                          value={lessonStructure.reflect.timeInMinutes}
                          onChange={(e) => handlePhaseTimeChange("reflect", parseInt(e.target.value) || 5)}
                          className="w-16 h-8 px-2 py-1"
                        />
                      </div>
                      <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </Button>
                    </div>
                  </div>

                  <PhaseVisualMetadata phase="reflect" />

                  {lessonStructure.reflect.content.map((content, index) => (
                    <div key={content.id} className="bg-bg-card rounded-md border border-border p-4 shadow-sm">
                      {renderContentBlock("reflect", content, index)}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContent("reflect", "text")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Text</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("reflect", "quiz")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Quiz</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("reflect", "activity")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add Activity</span>
                    </Button>
                    <Button
                      onClick={() => handleAddContent("reflect", "file")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add File</span>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent >

          <CardFooter className="border-t p-4 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Button
                size="sm"
                variant={isPublic ? "ghost" : "default"}
                onClick={() => setIsPublic(false)}
                className={`flex gap-2 ${!isPublic ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Lock size={16} />
                Private
              </Button>
              <Button
                size="sm"
                variant={isPublic ? "default" : "ghost"}
                onClick={() => setIsPublic(true)}
                className={`flex gap-2 ${isPublic ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Globe size={16} />
                Public
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save Lesson
              </Button>
            </div>
          </CardFooter>
        </Card >
      )}
    </div >
  );
};

export default ScaffoldedLessonBuilder;
