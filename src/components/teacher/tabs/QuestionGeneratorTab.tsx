import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, BookText, Laptop, BrainCircuit, Wand2, FileText, CheckSquare, Sparkles, AlertCircle, Plus, RefreshCw, Check, Star, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Quiz, Lesson, LessonStructure } from "@/types/quiz";
import { generateQuizQuestions, generateLessonPlan, generateWorksheet, generateTextContent, isConfigured, QuizQuestion as GeminiQuizQuestion } from "@/utils/geminiAI";
import { getLearningTypes } from "@/utils/lessonUtils";
import { Download, ImageIcon, FileCheck, Layers } from "lucide-react";



interface QuestionGeneratorTabProps {
  availableGrades?: number[]; // changed from grades
  subject?: "math" | "english" | "ict";
  onCreateQuiz: (quiz: Quiz) => Promise<void>;
  onCreateLesson: (lesson: Lesson) => Promise<void>;
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
  const [learningType, setLearningType] = useState<string>("scaffolded-lesson");

  // Quiz State
  const [customTopic, setCustomTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState<string>("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeminiQuizQuestion[]>([]);
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(null);
  const [isForgingAssets, setIsForgingAssets] = useState(false);
  const [generatedWorksheetData, setGeneratedWorksheetData] = useState<{ title: string, content: string } | null>(null);
  const [isGeneratingWorksheet, setIsGeneratingWorksheet] = useState(false);

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
          topic: customTopic,
          researchNotes: {
            misconceptions: Array.isArray(lessonPlan.researchNotes?.misconceptions)
              ? lessonPlan.researchNotes.misconceptions.map((m: any) => typeof m === 'string' ? m : JSON.stringify(m))
              : [],
            strategies: Array.isArray(lessonPlan.researchNotes?.strategies)
              ? lessonPlan.researchNotes.strategies.map((s: any) => typeof s === 'string' ? s : JSON.stringify(s))
              : [],
            realWorldConnections: Array.isArray(lessonPlan.researchNotes?.realWorldConnections)
              ? lessonPlan.researchNotes.realWorldConnections.map((r: any) => typeof r === 'string' ? r : JSON.stringify(r))
              : [],
            vocabulary: Array.isArray(lessonPlan.researchNotes?.vocabulary)
              ? lessonPlan.researchNotes.vocabulary.map((v: any) => typeof v === 'string' ? v : JSON.stringify(v))
              : [],
            priorKnowledge: []
          },
          visualTheme: {
            primaryTheme: typeof lessonPlan.visualTheme?.primaryTheme === 'string' ? lessonPlan.visualTheme.primaryTheme : "Standard",
            colorPalette: typeof lessonPlan.visualTheme?.colorPalette === 'string' ? lessonPlan.visualTheme.colorPalette : "Blue/White",
            characters: typeof lessonPlan.visualTheme?.characters === 'string' ? lessonPlan.visualTheme.characters : "None",
            animationStyle: typeof lessonPlan.visualTheme?.animationStyle === 'string' ? lessonPlan.visualTheme.animationStyle : "Minimal",
            soundTheme: typeof lessonPlan.visualTheme?.soundTheme === 'string' ? lessonPlan.visualTheme.soundTheme : "Quiet"
          },
          assessmentSettings: lessonPlan.assessment,
          requiredResources: lessonPlan.resources,
          lessonStructure: {
            engage: {
              title: "Engage",
              timeInMinutes: 5,
              content: [
                {
                  id: crypto.randomUUID(),
                  type: 'universal-engage',
                  content: 'Universal Engagement Phase',
                  universalEngage: {
                    pollQuestion: "How does this relate to your experience?",
                    pollOptions: ["I've seen something like this before", "This reminds me of...", "This is completely new to me"]
                  }
                },
                ...(Array.isArray((lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.activities)
                  ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).activities
                  : []).map((a: any) => ({ type: 'text' as const, content: typeof a === 'string' ? a : JSON.stringify(a), id: crypto.randomUUID() })),
                ...((lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.activityType ? [{
                  id: crypto.randomUUID(),
                  type: (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).activityType as any,
                  content: `Interactive ${(lessonPlan.phases.engage || (lessonPlan.phases as any).hook).activityType}`,
                  pollOptions: (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).activityData?.pollOptions
                }] : [])
              ],
              visualMetadata: {
                visualTheme: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.visualTheme === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).visualTheme : "Detailed visual theme",
                screenLayout: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.screenLayout === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).screenLayout : "Standard",
                interactiveHook: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.interactiveHook === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).interactiveHook : "",
                animations: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.animations === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).animations : "Subtle fade-in",
                audio: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.audio === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).audio : "",
                researchHook: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.researchHook === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).researchHook : "Activate prior knowledge",
                misconceptionAddressed: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.misconceptionAddressed === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).misconceptionAddressed : "",
                imagePrompt: typeof (lessonPlan.phases.engage || (lessonPlan.phases as any).hook)?.imagePrompt === 'string' ? (lessonPlan.phases.engage || (lessonPlan.phases as any).hook).imagePrompt : `Educational image for ${customTopic}`
              }
            },
            model: {
              title: "Learn",
              timeInMinutes: 8,
              content: [
                ...(Array.isArray((lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.activities)
                  ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).activities
                  : []).map((a: any) => ({ type: 'text' as const, content: typeof a === 'string' ? a : JSON.stringify(a), id: crypto.randomUUID() })),
                ...((lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.activityType ? [{
                  id: crypto.randomUUID(),
                  type: (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).activityType as any,
                  content: `Interactive ${(lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).activityType}`,
                  steps: (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).activityData?.steps,
                  flashcards: (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).activityData?.flashcards
                }] : [])
              ],
              visualMetadata: {
                researchContent: typeof (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.researchContent === 'string' ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).researchContent : "",
                animations: typeof (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.animations === 'string' ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).animations : "",
                researchInsight: typeof (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.researchInsight === 'string' ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).researchInsight : "",
                interactiveLearning: typeof (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.interactiveLearning === 'string' ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).interactiveLearning : "",
                checkForUnderstanding: typeof (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.checkForUnderstanding === 'string' ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).checkForUnderstanding : "",
                imagePrompt: typeof (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction)?.imagePrompt === 'string' ? (lessonPlan.phases.learn || (lessonPlan.phases as any).model || (lessonPlan.phases as any).instruction).imagePrompt : `Educational illustration for ${customTopic}`
              }
            },
            guidedPractice: {
              title: "Practice Together",
              timeInMinutes: 12,
              activityType: 'carousel',
              content: [
                ...(Array.isArray((lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.activities)
                  ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).activities
                  : []).map((a: any) => ({ type: 'text' as const, content: typeof a === 'string' ? a : JSON.stringify(a), id: crypto.randomUUID() })),
                ...((lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.activityType ? [{
                  id: crypto.randomUUID(),
                  type: 'carousel',
                  content: 'Interactive 4-Carousel Challenge',
                  categorizationGroups: (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).activityData?.categorizationGroups,
                  carouselStations: (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).activityData?.carouselStations ||
                    (Array.isArray((lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).activities) && (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).activities.length === 4
                      ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).activities.map((act: any, i: number) => ({ station: ["BRAIN", "HEART", "HANDS", "VOICE"][i], task: "Station Task", content: typeof act === 'string' ? act : JSON.stringify(act) }))
                      : [
                        { station: "BRAIN", task: "Define & Describe", content: `Define the core concept of ${customTopic} in your own words.` },
                        { station: "HEART", task: "Connect & Question", content: "How does this topic connect to your daily life? What questions do you still have?" },
                        { station: "HANDS", task: "Solve & Create", content: "Create a visual representation or solve a practice problem related to this topic." },
                        { station: "VOICE", task: "Judge & Defend", content: "Debate a key statement or misconception about this topic. Explain your reasoning." }
                      ])
                }] : [])
              ],
              visualMetadata: {
                researchStrategy: typeof (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.researchStrategy === 'string' ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).researchStrategy : "",
                collaborationInterface: typeof (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.collaborationInterface === 'string' ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).collaborationInterface : "",
                differentiation: typeof (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.differentiation === 'string' ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).differentiation : "",
                progressVisualization: typeof (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.progressVisualization === 'string' ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).progressVisualization : "",
                celebration: typeof (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.celebration === 'string' ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).celebration : "",
                imagePrompt: typeof (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice)?.imagePrompt === 'string' ? (lessonPlan.phases.practiceTogether || (lessonPlan.phases as any).guidedPractice).imagePrompt : `Group practice visuals for ${customTopic}`
              }
            },
            independentPractice: {
              title: "Try It Yourself",
              timeInMinutes: 10,
              content: [
                ...(Array.isArray(lessonPlan.phases.tryItYourself.activities) ? lessonPlan.phases.tryItYourself.activities : []).map(a => ({ type: 'text' as const, content: typeof a === 'string' ? a : JSON.stringify(a), id: crypto.randomUUID() })),
                ...(lessonPlan.phases.tryItYourself.activityType ? [{
                  id: crypto.randomUUID(),
                  type: lessonPlan.phases.tryItYourself.activityType as any,
                  content: `Interactive ${lessonPlan.phases.tryItYourself.activityType}`,
                  scaffoldedLevels: lessonPlan.phases.tryItYourself.activityData?.scaffoldedLevels
                }] : [])
              ],
              visualMetadata: {
                researchPractice: typeof lessonPlan.phases.tryItYourself.researchPractice === 'string' ? lessonPlan.phases.tryItYourself.researchPractice : "",
                workspaceDesign: typeof lessonPlan.phases.tryItYourself.workspaceDesign === 'string' ? lessonPlan.phases.tryItYourself.workspaceDesign : "",
                scaffoldingSystem: typeof lessonPlan.phases.tryItYourself.scaffoldingSystem === 'string' ? lessonPlan.phases.tryItYourself.scaffoldingSystem : "",
                selfAssessment: typeof lessonPlan.phases.tryItYourself.selfAssessment === 'string' ? lessonPlan.phases.tryItYourself.selfAssessment : "",
                errorRecovery: typeof lessonPlan.phases.tryItYourself.errorRecovery === 'string' ? lessonPlan.phases.tryItYourself.errorRecovery : "",
                imagePrompt: typeof lessonPlan.phases.tryItYourself.imagePrompt === 'string' ? lessonPlan.phases.tryItYourself.imagePrompt : `Independent practice for ${customTopic}`
              }
            },
            reflect: {
              title: "Think About It",
              timeInMinutes: 5,
              content: [
                ...(Array.isArray(lessonPlan.phases.thinkAboutIt.activities) ? lessonPlan.phases.thinkAboutIt.activities : []).map(a => ({ type: 'text' as const, content: typeof a === 'string' ? a : JSON.stringify(a), id: crypto.randomUUID() })),
                ...(lessonPlan.phases.thinkAboutIt.activityType ? [{
                  id: crypto.randomUUID(),
                  type: lessonPlan.phases.thinkAboutIt.activityType as any,
                  content: `Interactive ${lessonPlan.phases.thinkAboutIt.activityType}`
                }] : [])
              ],
              visualMetadata: {
                researchReflection: typeof lessonPlan.phases.thinkAboutIt.researchReflection === 'string' ? lessonPlan.phases.thinkAboutIt.researchReflection : "",
                exitTicket: typeof lessonPlan.phases.thinkAboutIt.exitTicket === 'string' ? lessonPlan.phases.thinkAboutIt.exitTicket : "",
                realWorldConnection: typeof lessonPlan.phases.thinkAboutIt.realWorldConnection === 'string' ? lessonPlan.phases.thinkAboutIt.realWorldConnection : "",
                takeawayGraphic: typeof lessonPlan.phases.thinkAboutIt.takeawayGraphic === 'string' ? lessonPlan.phases.thinkAboutIt.takeawayGraphic : "",
                imagePrompt: typeof lessonPlan.phases.thinkAboutIt.imagePrompt === 'string' ? lessonPlan.phases.thinkAboutIt.imagePrompt : `Reflection visuals for ${customTopic}`
              }
            }
          },
          // accessCode: Removed for teacher-led lessons as per user request

          createdBy: 'AI',
          createdAt: new Date().toISOString(),
          isPublic: false
        };

        setGeneratedLesson(newLesson);
        setGeneratedQuestions([]);
        toast({ title: "Research-Based Lesson Ready!", description: "Complete pedagogical plan generated." });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleForgeVisuals = async () => {
    if (!generatedLesson) return;
    setIsForgingAssets(true);
    toast({ title: "Forging Visuals...", description: "AI is creating custom images for each lesson phase." });

    const phases: (keyof LessonStructure)[] = ['engage', 'model', 'guidedPractice', 'independentPractice', 'reflect'];

    try {
      const updatedLesson = { ...generatedLesson };
      if (!updatedLesson.lessonStructure) return;

      for (const phaseKey of phases) {
        const phase = updatedLesson.lessonStructure[phaseKey];
        if (phase.visualMetadata?.imagePrompt) {
          const prompt = `Subject: ${subject}\nTopic: ${customTopic}\nGrade Level: ${selectedGrade}\nTarget Image: ${phase.visualMetadata.imagePrompt}\n\nProvide a high-quality, professional educational image URL link (Unsplash preferred). If a specific ID is unavailable, use this keyword format: https://source.unsplash.com/featured/1600x900?[KEYWORDS]. RETURN ONLY THE URL starting with http.`;

          try {
            const rawResponse = await generateTextContent(prompt);
            const content = rawResponse.trim();
            const urlMatch = content.match(/https?:\/\/[^\s"'>\])]+/);
            let imageUrl = urlMatch ? urlMatch[0] : null;

            if (!imageUrl) {
              imageUrl = `https://source.unsplash.com/featured/1600x900?${customTopic.replace(/\s+/g, ',')},${String(phaseKey)}`;
            }

            if (imageUrl) {
              phase.visualMetadata.imageUrl = imageUrl.trim();
            }
          } catch (e) {
            console.error(`Failed to forge visual for ${String(phaseKey)}`, e);
          }
        }
      }

      setGeneratedLesson(updatedLesson);
      toast({ title: "Assets Ready!", description: "Custom visuals have been integrated into your lesson phases." });
    } catch (err) {
      toast({ title: "Forge Error", description: "Something went wrong while forging visuals.", variant: "destructive" });
    } finally {
      setIsForgingAssets(false);
    }
  };

  const handleGenerateWorksheet = async () => {
    if (!generatedLesson) return;
    setIsGeneratingWorksheet(true);
    try {
      const objectives = generatedLesson.researchNotes?.strategies || ["Learning the core concept"];
      const worksheet = await generateWorksheet(subject, selectedGrade, customTopic, objectives);
      setGeneratedWorksheetData(worksheet);
      toast({ title: "Worksheet Generated!", description: "Your downloadable resource is ready." });
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to generate worksheet.", variant: "destructive" });
    } finally {
      setIsGeneratingWorksheet(false);
    }
  };

  const downloadWorksheet = () => {
    if (!generatedWorksheetData) return;

    // Create a hidden div for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Error", description: "Please allow popups to download the PDF worksheet.", variant: "destructive" });
      return;
    }

    // Convert Markdown to HTML (simple replacement for now or use a lib if available)
    // Since we want this to be quick and clean:
    const contentHtml = generatedWorksheetData.content
      .replace(/^# (.*$)/gim, '<h1 style="color: #4f46e5; border-bottom: 2px solid #eef2ff; padding-bottom: 10px;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #6366f1; margin-top: 20px;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color: #818cf8;">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 8px;">$1</li>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');

    printWindow.document.write(`
      <html>
        <head>
          <title>${generatedWorksheetData.title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 800px; margin: auto; }
            h1 { font-size: 28px; }
            h2 { font-size: 22px; }
            li { font-size: 14px; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div style="font-weight: 800; font-size: 24px; color: #4f46e5;">Malik's Learning Lab</div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: bold; color: #64748b;">Subject: ${subject.toUpperCase()}</div>
              <div style="font-size: 12px; font-weight: bold; color: #64748b;">Grade: ${selectedGrade}</div>
            </div>
          </div>
          ${contentHtml}
          <div class="footer">
            Generated by Malik's Learning Lab AI • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Trigger print from parent context to avoid CSP 'unsafe-inline' block
    setTimeout(() => {
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
        // Optional: Close after print? 
        // printWindow.close(); // Browsers often block auto-close unless opened by script, which this is. 
        // But timing is tricky with print dialog. Better to leave it open or let user close.
      }
    }, 500);
  };

  const handleAddToQuiz = async () => {
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

    try {
      await onCreateQuiz(newQuiz);
      toast({ title: "Quiz Saved!", description: "Questions added to your library." });
      setGeneratedQuestions([]); // Reset results
      setCustomTopic(""); // Optional: reset form
    } catch (error) {
      toast({ title: "Error", description: "Failed to save quiz.", variant: "destructive" });
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
          <span>AI-Powered Generator</span>
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

          {generatedQuestions.length === 0 && !generatedLesson ? (
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
          ) : generatedLesson ? (
            /* Lesson Plan Results Display */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="font-bold text-xl text-text-primary flex items-center gap-2">
                  <Star size={20} className="text-math-purple fill-math-purple/20" />
                  Visual Lesson Concept
                </h3>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setGeneratedLesson(null)} className="border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary">
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                  </Button>
                  <Button onClick={async () => {
                    try {
                      await onCreateLesson(generatedLesson);
                      toast({ title: "Lesson Saved!", description: "Research-based lesson added to library." });
                      setGeneratedLesson(null);
                      setCustomTopic("");
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to save lesson.", variant: "destructive" });
                    }
                  }} className="bg-math-purple hover:bg-math-purple/90 text-white shadow-lg shadow-purple-900/20 border-none transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Add to Library
                  </Button>
                </div>
              </div>

              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Research Notes Card */}
                {generatedLesson.researchNotes && (
                  <Card className="border-math-purple/20 bg-math-purple/5 overflow-hidden">
                    <div className="p-4 bg-math-purple/10 border-b border-math-purple/20 flex items-center gap-2">
                      <BrainCircuit size={20} className="text-math-purple" />
                      <h4 className="font-bold text-lg text-text-primary">Pedagogical Research Pipeline</h4>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-math-purple font-bold uppercase text-[10px] tracking-wider block">⚠️ Common Misconceptions</span>
                          <ul className="space-y-1.5">
                            {generatedLesson.researchNotes.misconceptions.map((m: string, i: number) => (
                              <li key={i} className="text-xs text-text-secondary flex gap-2">
                                <span className="text-math-purple">•</span> {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <span className="text-math-purple font-bold uppercase text-[10px] tracking-wider block">🌍 Real-World Connections</span>
                          <p className="text-xs text-text-secondary italic">
                            {generatedLesson.researchNotes.realWorldConnections.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-math-purple font-bold uppercase text-[10px] tracking-wider block">📝 Vocabulary & Concepts</span>
                          <div className="flex flex-wrap gap-2">
                            {generatedLesson.researchNotes.vocabulary.map((v: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-math-purple/10 border border-math-purple/20 text-[10px] font-bold text-math-purple">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-math-purple font-bold uppercase text-[10px] tracking-wider block">💡 Teaching Strategies</span>
                          <ul className="space-y-1.5">
                            {generatedLesson.researchNotes.strategies.map((s: string, i: number) => (
                              <li key={i} className="text-xs text-text-secondary flex gap-2">
                                <span className="text-math-purple">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Visual Theme Card */}
                {generatedLesson.visualTheme && (
                  <Card className="border-ict-orange/20 bg-ict-orange/5">
                    <div className="p-4 bg-ict-orange/10 border-b border-ict-orange/20 flex items-center gap-2">
                      <Sparkles size={20} className="text-ict-orange" />
                      <h4 className="font-bold text-lg text-text-primary">Visual Concept & Experience</h4>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-ict-orange font-bold uppercase text-[10px] tracking-wider block">Primary Theme</span>
                        <p className="text-sm font-bold text-text-primary">{generatedLesson.visualTheme.primaryTheme}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-ict-orange font-bold uppercase text-[10px] tracking-wider block">Color Palette</span>
                        <p className="text-xs text-text-secondary text-sm font-mono break-all">{generatedLesson.visualTheme.colorPalette}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-ict-orange font-bold uppercase text-[10px] tracking-wider block">Characters & Style</span>
                        <p className="text-xs text-text-secondary">{generatedLesson.visualTheme.characters} • {generatedLesson.visualTheme.animationStyle}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* AI Asset Forge Card */}
                {generatedLesson && (
                  <Card className="border-focus-blue/20 bg-focus-blue/5 overflow-hidden shadow-sm animate-in zoom-in-95 duration-700">
                    <div className="p-4 bg-gradient-to-r from-focus-blue/10 to-purple-500/10 border-b border-focus-blue/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-focus-blue p-2 rounded-lg text-white shadow-md">
                          <Zap size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-text-primary mb-0.5">AI Asset Forge</h4>
                          <p className="text-[10px] text-text-secondary font-medium uppercase tracking-tight">Convert concepts into tangible teaching assets</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!generatedWorksheetData ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateWorksheet}
                            disabled={isGeneratingWorksheet}
                            className="h-9 border-focus-blue/30 text-focus-blue hover:bg-focus-blue/10 font-bold"
                          >
                            {isGeneratingWorksheet ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            Gen Worksheet
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadWorksheet}
                            className="h-9 border-success-green/30 text-success-green hover:bg-success-green/10 font-bold"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download WS
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={handleForgeVisuals}
                          disabled={isForgingAssets}
                          className="h-9 bg-focus-blue hover:bg-focus-blue/90 text-white shadow-md font-bold"
                        >
                          {isForgingAssets ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                          Forge Visuals
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={12} /> Visual Execution Plan
                          </label>
                          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-focus-blue/10">
                            <p className="text-xs text-text-secondary leading-relaxed">
                              Each lesson phase contains unique "Image Prompts". Forging visuals will generate custom illustrations for each phase to increase student engagement.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                            <FileCheck size={12} /> Paper-Based Extension
                          </label>
                          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-focus-blue/10">
                            <p className="text-xs text-text-secondary leading-relaxed">
                              Automatically generate a pedagogical worksheet matching this specific lesson's learning objectives and grade level.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {['engage', 'model', 'guidedPractice', 'independentPractice', 'reflect'].map((phaseKey) => {
                  const phase = (generatedLesson.lessonStructure as any)[phaseKey];
                  if (!phase) return null;

                  return (
                    <Card key={phaseKey} className={`group border-l-4 bg-bg-card border-y border-r border-border hover:bg-bg-secondary/30 transition-all duration-300 ${phaseKey === 'engage' ? 'border-l-orange-500' :
                      phaseKey === 'model' ? 'border-l-blue-500' :
                        phaseKey === 'guidedPractice' ? 'border-l-green-500' :
                          phaseKey === 'independentPractice' ? 'border-l-purple-500' :
                            'border-l-pink-500'
                      }`}>
                      <div className="p-4 bg-bg-secondary/50 border-b border-border flex justify-between items-center">
                        <div className="flex flex-col">
                          <h4 className="font-bold text-lg text-text-primary">{phase.title}</h4>
                          {phase.visualMetadata?.researchHook && (
                            <span className="text-[10px] text-text-tertiary font-medium">Research-Based Hook Principle</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-bg-card border border-border text-text-secondary">
                          {phase.timeInMinutes} MIN
                        </span>
                      </div>
                      <CardContent className="p-6 space-y-6">
                        {/* Pedagogy Insets */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column: Research/Pedagogy */}
                          <div className="space-y-4">
                            <div className="bg-bg-secondary/50 rounded-xl p-4 border border-border/50">
                              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">🎓 Pedagogical Approach</span>
                              <p className="text-xs text-text-secondary italic leading-relaxed">
                                {phase.visualMetadata?.researchHook ||
                                  phase.visualMetadata?.researchContent ||
                                  phase.visualMetadata?.researchStrategy ||
                                  phase.visualMetadata?.researchPractice ||
                                  phase.visualMetadata?.researchReflection}
                              </p>
                              {phase.visualMetadata?.misconceptionAddressed && (
                                <div className="mt-3 text-[10px] text-red-400 bg-red-900/10 p-2 rounded-lg border border-red-900/20">
                                  <strong>Misconception Fix:</strong> {phase.visualMetadata.misconceptionAddressed}
                                </div>
                              )}
                              {phase.visualMetadata?.researchInsight && (
                                <div className="mt-3 text-[10px] text-blue-400 bg-blue-900/10 p-2 rounded-lg border border-blue-900/20">
                                  <strong>Research Insight:</strong> {phase.visualMetadata.researchInsight}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Visual Design */}
                          <div className="space-y-4">
                            <div className="bg-math-purple/5 rounded-xl p-4 border border-math-purple/10">
                              <span className="text-[10px] font-bold text-math-purple uppercase tracking-widest mb-2 block">🎨 Visual Execution</span>
                              <div className="grid grid-cols-1 gap-3">
                                {phase.visualMetadata?.visualTheme && (
                                  <div>
                                    <span className="text-[9px] text-math-purple font-bold">THEME:</span>
                                    <p className="text-[11px] text-text-primary">{phase.visualMetadata.visualTheme}</p>
                                  </div>
                                )}
                                {phase.visualMetadata?.animations && (
                                  <div>
                                    <span className="text-[9px] text-math-purple font-bold">ANIMATION:</span>
                                    <p className="text-[11px] text-text-primary">{phase.visualMetadata.animations}</p>
                                  </div>
                                )}
                                {(phase.visualMetadata?.interactiveHook || phase.visualMetadata?.interactiveLearning) && (
                                  <div className="flex gap-2 items-start text-indigo-400">
                                    <Zap size={14} className="shrink-0" />
                                    <p className="text-[11px] font-medium">{phase.visualMetadata.interactiveHook || phase.visualMetadata.interactiveLearning}</p>
                                  </div>
                                )}
                                {phase.visualMetadata?.imagePrompt && (
                                  <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded border border-dashed border-math-purple/30">
                                    <span className="text-[8px] text-math-purple font-bold block mb-1 uppercase">Visual Forge Prompt</span>
                                    <p className="text-[10px] text-text-secondary leading-tight italic">{phase.visualMetadata.imagePrompt}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Activities List */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2">
                            <Plus size={14} className="text-text-tertiary" />
                            <span className="text-text-tertiary font-bold uppercase text-[10px] tracking-wider block">Visualized Activity Pipeline</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {phase.content.map((item: any, idx: number) => (
                              <div key={idx} className="flex gap-3 text-sm text-text-secondary bg-bg-card p-3 rounded-xl border border-border/30 group-hover:bg-bg-secondary/50 transition-colors">
                                <div className="h-5 w-5 rounded-full bg-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-tertiary shrink-0 border border-border/50">
                                  {idx + 1}
                                </div>
                                <p className="text-xs leading-relaxed">{item.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
