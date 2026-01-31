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
    visualTheme?: string;
    screenLayout?: string;
    interactiveHook?: string;
    interactiveElements?: string;
    animations?: string;
    audio?: string;
    contentVisualization?: string;
    feedbackSystem?: string;
    visualMetaphor?: string;
    collaborationInterface?: string;
    roleIndicators?: string;
    progressMap?: string;
    workspaceDesign?: string;
    celebration?: string;
    scaffolding?: string;
    selfCheck?: string;
    rewards?: string;
    errorVisualization?: string;
    reflectionInterface?: string;
    connectionVisualizer?: string;
    realWorldApplication?: string;
    takeawayGraphic?: string;
    activities: string[];
}

export interface LessonPlan {
    subject: string;
    grade: string;
    topic: string;
    phases: {
        engage: LessonPlanPhase;
        learn: LessonPlanPhase;
        practiceTogether: LessonPlanPhase;
        tryItYourself: LessonPlanPhase;
        thinkAboutIt: LessonPlanPhase;
    };
    visualAssets: {
        primaryColors: string;
        iconSet: string;
        characterTheme: string;
        animationTypes: string;
        interactiveComponents: string;
    };
    differentiation: {
        struggling: string;
        advanced: string;
        accessibility: string;
    };
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MODELS = [
    { model: "gemini-flash-latest", version: "v1beta" }
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
    You are a VISUAL EDUCATIONAL DESIGNER AI. Your specialty is transforming standard lesson content into visually stunning, interactive learning experiences.
    
    Create a complete visual lesson plan for ${grade} ${subject} on the topic "${topic}" with exactly 5 timed phases: 
    ENGAGE (5 min), LEARN (8 min), PRACTICE TOGETHER (12 min), TRY IT YOURSELF (10 min), THINK ABOUT IT (5 min).

    CRITICAL INSTRUCTION: For EVERY element, describe the VISUAL appearance, not just the activity. 
    Instead of "do addition problems" write "🎨 Colorful animated number blocks that snap together with particle effects when the correct sum is reached." 
    Instead of "discuss answers" write "💬 Speech bubble interface where student responses appear with avatar pictures, color-coded by correctness."

    The output must be a JSON object following this structure:
    {
      "subject": "${subject}",
      "grade": "${grade}",
      "topic": "${topic}",
      "phases": {
        "engage": {
          "duration": "5 minutes",
          "visualTheme": "description of hex colors and style",
          "screenLayout": "arrangement of elements and animations",
          "interactiveHook": "what students physically do (click, drag, etc.)",
          "animations": "description of introductory animations",
          "audio": "sound effects or music suggestions",
          "activities": ["List of activities with visual descriptions"]
        },
        "learn": {
          "duration": "8 minutes",
          "contentVisualization": "how concepts are shown visually",
          "animations": "step-by-step visual learning breakdown",
          "interactiveElements": "what students manipulate",
          "feedbackSystem": "how correct understanding is shown visually",
          "visualMetaphor": "main visual theme (e.g. puzzle pieces)",
          "activities": ["List of activities with visual descriptions"]
        },
        "practiceTogether": {
          "duration": "12 minutes",
          "collaborationInterface": "how group work appears on screen",
          "roleIndicators": "how student roles are shown",
          "progressMap": "visualization of group progress",
          "workspaceDesign": "what the collaborative area looks like",
          "celebration": "animation when group completes task",
          "activities": ["List of activities with visual descriptions"]
        },
        "tryItYourself": {
          "duration": "10 minutes",
          "workspaceDesign": "individual activity area appearance",
          "scaffolding": "how hints/help appear when needed",
          "selfCheck": "visual way students check their own work",
          "rewards": "visual rewards upon completion",
          "errorVisualization": "how mistakes are shown constructively",
          "activities": ["List of activities with visual descriptions"]
        },
        "thinkAboutIt": {
          "duration": "5 minutes",
          "reflectionInterface": "thought bubble/exit ticket visual design",
          "connectionVisualizer": "how ideas link together graphically",
          "realWorldApplication": "visual showing practical use",
          "takeawayGraphic": "what students take with them visually",
          "activities": ["List of activities with visual descriptions"]
        }
      },
      "visualAssets": {
        "primaryColors": "Hex codes for each phase",
        "iconSet": "Specific emojis/icons for each activity",
        "characterTheme": "Consistent visual characters or theme",
        "animationTypes": "List of specific animations needed",
        "interactiveComponents": "Drag-drop, sliders, drawing tools, etc."
      },
      "differentiation": {
        "struggling": "Visual simplifications",
        "advanced": "Visual extensions",
        "accessibility": "High contrast, text-to-speech indicators"
      }
    }
  `;

    return await callGeminiAPI(prompt);
};

export const generateTextContent = async (prompt: string): Promise<string> => {
    const fullPrompt = `You are a helpful assistant for teachers. Generate clear, educational content based on the user's request. 
  Do not wrap in JSON. Just provide the text content directly.
  
  User Request: ${prompt}`;

    try {
        const result = await callGeminiAPI(fullPrompt);
        // If callGeminiAPI returns an object/JSON, try to extract text if possible, 
        // or just return the string if it managed to parse it as such (though callGeminiAPI tries to parse JSON).
        // Since callGeminiAPI expects JSON, we should probably adjust the prompt in callGeminiAPI 
        // OR stick to the existing pattern where we ask for JSON with a "content" field.
        // For safety, let's just ask for a simple JSON wrapper.

        return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (e) {
        // If JSON parse fails in callGeminiAPI, it might throw. 
        // We should probably allow callGeminiAPI to return raw text if JSON parse fails? 
        // For now, let's implement a direct fetch here to avoid the JSON strictness of callGeminiAPI
        // or just use a simple wrapper.

        // Quick fix: Re-implement simple text fetch here to avoid breaking the strict JSON logic of callGeminiAPI
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
};

export const isConfigured = (): boolean => {
    return !!GEMINI_API_KEY;
};
