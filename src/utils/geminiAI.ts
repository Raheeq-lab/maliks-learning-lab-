import { QuizQuestion as AppQuizQuestion } from "@/types/quiz";

// User-specified interface
export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string; // The text of the correct answer or "A", "B", etc. We will ask AI to be clear.
    explanation: string;
}

export interface LessonPlanPhase {
    duration: string;
    activities: string[];
    visualTheme?: string;
    screenLayout?: string;
    interactiveHook?: string;
    interactiveElements?: string;
    animations?: string;
    audio?: string;
    collaborationInterface?: string;
    roleIndicators?: string;
    progressMap?: string;
    workspaceDesign?: string;
    scaffolding?: string;
    selfCheck?: string;
    rewards?: string;
    reflectionInterface?: string;
    connectionVisualizer?: string;
    realWorldApplication?: string;
    // Research-based fields
    researchHook?: string;
    misconceptionAddressed?: string;
    researchContent?: string;
    researchInsight?: string;
    interactiveLearning?: string;
    checkForUnderstanding?: string;
    researchStrategy?: string;
    differentiation?: string;
    progressVisualization?: string;
    celebration?: string;
    researchPractice?: string;
    scaffoldingSystem?: string;
    selfAssessment?: string;
    errorRecovery?: string;
    researchReflection?: string;
    exitTicket?: string;
    realWorldConnection?: string;
    takeawayGraphic?: string;
    imagePrompt?: string;
    // High-Fidelity Activity Data
    activityType?: "poll" | "brainstorm" | "flashcards" | "steps" | "categorization" | "scaffolded" | "exit-ticket" | "carousel";
    activityData?: {
        pollOptions?: string[];
        flashcards?: { front: string; back: string }[];
        steps?: string[];
        categorizationGroups?: { title: string; items: string[] }[];
        scaffoldedLevels?: { level: number; question: string; hint?: string; solution: string }[];
        carouselStations?: { station: string; task: string; content: string }[];
    };
}

export interface LessonPlan {
    subject: string;
    grade: string;
    topic: string;
    researchNotes: {
        misconceptions: string[];
        strategies: string[];
        realWorldConnections: string[];
        vocabulary: string[];
        priorKnowledge: string[];
    };
    visualTheme: {
        primaryTheme: string;
        colorPalette: string;
        characters: string;
        animationStyle: string;
        soundTheme: string;
    };
    phases: {
        engage: LessonPlanPhase;
        learn: LessonPlanPhase;
        practiceTogether: LessonPlanPhase;
        tryItYourself: LessonPlanPhase;
        thinkAboutIt: LessonPlanPhase;
    };
    assessment: {
        formativeChecks: string;
        extension: string;
        support: string;
        accessibility: string;
    };
    resources: {
        visualAssets: string;
        interactiveTools: string;
        props: string;
        teacherNotes: string;
    };
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Updated configurations for Preview Access Keys
const MODELS = [
    { model: "gemini-2.5-flash", version: "v1beta" },
    { model: "gemini-2.5-flash-lite-preview-09-2025", version: "v1beta" },
    { model: "gemini-2.0-flash", version: "v1beta" },
    { model: "gemini-3-flash-preview", version: "v1beta" },
    { model: "gemini-3-pro-preview", version: "v1beta" }
];

/**
 * Generic function to call Gemini API with fallback mechanisms
 */
async function callGeminiAPI(prompt: string): Promise<any> {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please check your .env file.");
    }

    let lastError = null;

    for (const { model, version } of MODELS) {
        try {
            console.log(`[Gemini API] Attempting model: ${model} (${version})`);
            console.log(`[Gemini API] Prompt preview: ${prompt.substring(0, 50)}...`);

            const isV1 = version === 'v1';
            const generationConfig: any = {
                temperature: 0.7
            };

            // Only add response_mime_type for v1beta (Gemini 1.5+) models
            if (!isV1) {
                generationConfig.response_mime_type = "application/json";
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: generationConfig,
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            console.log(`[Gemini API] Response Status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json();
                const msg = errorData.error?.message || `Status ${response.status}`;
                throw new Error(msg);
            }

            const data = await response.json();
            // console.log(`[Gemini API] Raw Response:`, JSON.stringify(data).substring(0, 200) + "...");

            const candidate = data.candidates?.[0];

            if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
                throw new Error("Empty response from Gemini API");
            }

            const textContent = candidate.content.parts[0].text;

            // Clean markdown code blocks
            const cleanedJson = textContent.replace(/```json\n?|\n?```/g, "").trim();

            try {
                const parsed = JSON.parse(cleanedJson);
                console.log(`[Gemini API] Successfully parsed JSON`);
                return parsed;
            } catch (e) {
                console.error(`[Gemini API] JSON Parse Error:`, e);
                console.error(`[Gemini API] Failed Content:`, cleanedJson);
                throw new Error("Failed to parse Gemini response as JSON");
            }

        } catch (error: any) {
            console.warn(`[Gemini API] Failed with model ${model}:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

export const generateQuizQuestions = async (
    subject: string,
    grade: string,
    topic: string,
    numQuestions: number
): Promise<QuizQuestion[]> => {
    const prompt = `
    You are an expert teacher. Create a ${numQuestions}-question multiple-choice quiz about "${topic}" for ${grade} students in ${subject}.
    
    IMPORTANT Formatting Rules:
    - Do NOT use LaTeX or Markdown math syntax (e.g., avoid $\\frac{1}{2}$ or **bold**).
    - Use clear plain text for math (e.g., use "1/2", "x^2", "sqrt(9)").
    - The output must be raw JSON compatible strings.

    Strictly follow this JSON format for the output. Return ONLY the JSON array.
    
    [
      {
        "question": "The question text here (e.g. What is 1/2 + 1/4?)",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "Option 1",
        "explanation": "Brief explanation."
      }
    ]
  `;

    try {
        const result = await callGeminiAPI(prompt);
        // Handle case where result might be wrapped in { questions: [] } or just []
        let questions: QuizQuestion[] = [];

        if (Array.isArray(result)) {
            questions = result;
        } else if (result.questions && Array.isArray(result.questions)) {
            questions = result.questions;
        } else {
            throw new Error("Unexpected JSON structure returned");
        }

        return questions;

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw error;
    }
};

export const generateLessonPlan = async (
    subject: string,
    grade: string,
    topic: string
): Promise<LessonPlan> => {
    const prompt = `
    You are an EXPERT EDUCATIONAL DESIGNER and FULL-STACK DEVELOPER. Your goal is to create a COMPLETE RESEARCH-BASED interactive lesson for the topic "${topic}" (${grade} ${subject}).
    
    You must follow the 5-phase structure exactly and provide structured data for high-fidelity interactive elements.
    
    CRITICAL: All visual themes, image prompts, and activities MUST be strictly pedagogically relevant to the subject ("${subject}"), topic ("${topic}"), and grade level ("${grade}"). 
    - DO NOT use generic sci-fi, futuristic, or "cinematic" themes unless they are the direct subject of the lesson. 
    - For Primary/Elementary (Grades K-5), use concrete, real-world examples (e.g., for addition, use toys, fruits, or physical groups).
    - For Middle/High School, use relevant academic or professional contexts.

    ## PHASE 1: 🎯 ENGAGE (5 mins)
    - Primary Goal: Activate prior knowledge & spark curiosity.
    - Required Activity: A "poll" with 3 options OR a "brainstorm" board activity.
    - JSON required: "activityType": "poll" (with pollOptions) or "brainstorm".
    - Visual Hook: Must show a puzzling real-world scenario or object related to ${topic}.

    ## PHASE 2: 📚 LEARN (8 mins)
    - Primary Goal: Reduce cognitive load, multimodal presentation.
    - Required Activity: "steps" (4 sequential concept chunks) OR "flashcards" (3-4 items).
    - JSON required: "activityType": "steps" (with steps array) or "flashcards" (with front/back objects).

    ## PHASE 3: 👥 PRACTICE TOGETHER (12 mins)
    - Primary Goal: Collaborative mastery.
    - Required Activity: "4-Carousel Challenge" (Group Setup).
    - Structure:
      1) Station 1 (BRAIN): Define & Describe the core concept.
      2) Station 2 (HEART): Connect & Question (emotional/personal connection).
      3) Station 3 (HANDS): Solve & Create (practical application).
      4) Station 4 (VOICE): Judge & Defend (critical evaluation).
    - JSON required: "activityType": "carousel" and "activityData": { "carouselStations": [...] }.
    - DO NOT just list activities in the "activities" array. You MUST populate "carouselStations".
    - DO NOT return a single generic summary like "Students rotate through stations...". You MUST provide specific content for ALL 4 stations.
    - Content: Specific tasks/questions for EACH station related to ${topic}.

    ## PHASE 4: ✏️ TRY IT YOURSELF (10 mins)
    - Primary Goal: Independent practice & scaffolding.
    - Required Activity: "scaffolded" questions (3 levels: Level 1 with hint, Level 2, Level 3 challenge).
    - JSON required: "activityType": "scaffolded" (with scaffoldedLevels matching the levels/hints).

    ## PHASE 5: 💭 THINK ABOUT IT (5 mins)
    - Primary Goal: Metacognition & real-world connection.
    - Required Activity: "exit-ticket" (Standard 3-2-1 prompt mapping).
    - JSON required: "activityType": "exit-ticket".

    The output must be a JSON object following this EXACT structure:
    {
      "subject": "${subject}",
      "grade": "${grade}",
      "topic": "${topic}",
      "researchNotes": {
        "misconceptions": ["List 3 common misconceptions"],
        "strategies": ["List 3 pedagogical strategies"],
        "realWorldConnections": ["How this connects to life"],
        "vocabulary": ["4 key terms"],
        "priorKnowledge": ["What they should know"]
      },
      "visualTheme": {
        "primaryTheme": "Detailed visual theme (e.g. Cyberpunk Lab, Enchanted Forest)",
        "colorPalette": "5 Hex codes for each phase",
        "characters": "Description of guiding characters",
        "animationStyle": "e.g. Smooth, bouncy, minimalist",
        "soundTheme": "Audio cue suggestions"
      },
      "phases": {
        "engage": {
          "duration": "5 minutes",
          "researchHook": "Research-based hook description",
          "imagePrompt": "A detailed DALL-E style prompt for this phase visual",
          "activities": ["Description of brainstorm/poll activity"],
          "activityType": "poll",
          "activityData": { "pollOptions": ["Option A", "Option B", "Option C"] }
        },
        "learn": {
          "duration": "8 minutes",
          "researchContent": "Instructional approach description",
          "imagePrompt": "A detailed DALL-E style prompt for instructional visual",
          "activities": ["Description of steps/flashcards"],
          "activityType": "steps",
          "activityData": { "steps": ["Step 1 content", "Step 2 content", "Step 3 content", "Step 4 content"] }
        },
        "practiceTogether": {
          "duration": "12 minutes",
          "researchStrategy": "Rotational group collaboration",
          "imagePrompt": "A detailed DALL-E style prompt for practice visual",
          "activities": ["Students rotate through 4 stations: Brain (Define), Heart (Connect), Hands (Solve), Voice (Argue)"],
          "activityType": "carousel",
          "activities": [],
          "activityData": { 
            "carouselStations": [
              { "station": "BRAIN", "task": "Define & Describe", "content": "Specific question..." },
              { "station": "HEART", "task": "Connect & Question", "content": "Specific question..." },
              { "station": "HANDS", "task": "Solve & Create", "content": "Specific problem..." },
              { "station": "VOICE", "task": "Judge & Defend", "content": "Specific debate prompt..." }
            ] 
          }
        },
        "tryItYourself": {
          "duration": "10 minutes",
          "researchPractice": "Practice structure description",
          "imagePrompt": "A detailed DALL-E style prompt for independent practice visual",
          "activities": ["Description of scaffolded problems"],
          "activityType": "scaffolded",
          "activityData": {
            "scaffoldedLevels": [
              { "level": 1, "question": "Simple problem", "hint": "Useful hint", "solution": "Correct answer" },
              { "level": 2, "question": "Standard problem", "solution": "Correct answer" },
              { "level": 3, "question": "Challenge problem", "solution": "Correct answer" }
            ]
          }
        },
        "thinkAboutIt": {
          "duration": "5 minutes",
          "researchReflection": "Reflection technique description",
          "imagePrompt": "A detailed DALL-E style prompt for reflection visual",
          "activities": ["Description of 3-2-1 exit ticket"],
          "activityType": "exit-ticket"
        }
      },
      "assessment": {
        "formativeChecks": "visual assessment points",
        "extension": "for advanced learners",
        "support": "for struggling learners",
        "accessibility": "alt-text, high contrast notes"
      },
      "resources": {
        "visualAssets": "required assets",
        "interactiveTools": "required tools",
        "props": "optional items",
        "teacherNotes": "pedagogical citations and notes"
      }
    }
  `;

    return await callGeminiAPI(prompt);
};

export const generateWorksheet = async (
    subject: string,
    grade: string,
    topic: string,
    learningObjectives: string[]
): Promise<{ title: string; content: string }> => {
    const prompt = `
    You are an expert worksheet designer.Create a comprehensive, student - friendly worksheet for "${topic}"(${grade} ${subject}).
    
    Learning Objectives:
    ${learningObjectives.map(obj => `- ${obj}`).join('\n')}
    
    The worksheet should include:
1. A clear Title.
    2. A brief, engaging introduction(2 - 3 sentences).
    3. 3 - 4 structured activities / exercises(e.g., matching, fill -in -the - blanks, problem - solving).
    4. A "Challenge" question for advanced students.
    
    Format the output as a JSON object:
{
    "title": "Worksheet Title",
        "content": "The full worksheet content in Markdown format, with clear headings, spacing, and instructions."
}
`;

    return await callGeminiAPI(prompt);
};

export const generateTextContent = async (prompt: string): Promise<string> => {
    const fullPrompt = `You are a helpful assistant for teachers. Generate clear, educational content based on the user's request. 
  Do not wrap in JSON. Just provide the text content directly.
  
  User Request: ${prompt}`;

    let lastError = null;

    for (const { model, version } of MODELS) {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`[Gemini API] Rate limit hit for ${model}. Waiting 2s...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    lastError = new Error("Rate limit exceeded");
                    continue; // Try next model
                }
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Status ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (error: any) {
            console.warn(`[Gemini API] generateTextContent failed with model ${model}:`, error.message);
            lastError = error;
        }
    }

    if (lastError?.message?.includes('Rate limit')) {
        throw new Error("Rate limit exceeded on all models. Please wait 30 seconds and try again.");
    }

    throw new Error(`Failed to generate text content. Last error: ${lastError?.message || "Unknown error"}`);
};

export const isConfigured = (): boolean => {
    return !!GEMINI_API_KEY;
};
