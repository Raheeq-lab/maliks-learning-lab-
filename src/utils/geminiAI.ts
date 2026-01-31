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
    You are a RESEARCH-BASED VISUAL LESSON DESIGNER. For the topic "${topic}" (${grade} ${subject}), follow this exact 6-step research pipeline to create a stunning visual lesson:

    ## RESEARCH PIPELINE
    1. GET TOPIC → Understand the exact learning objective
    2. DO RESEARCH → Find age-appropriate content, common misconceptions, best practices
    3. WRITE OUTLINE → Structure the 5-phase lesson with timing
    4. CREATE VISUAL DESIGN → Design banners, colors, animations, interactive elements
    5. WRITE LESSON → Create the actual lesson content with visuals
    6. DISPLAY LESSON → Format for beautiful presentation

    The output must be a JSON object following this structure:
    {
      "subject": "${subject}",
      "grade": "${grade}",
      "topic": "${topic}",
      "researchNotes": {
        "misconceptions": ["List of common student misconceptions"],
        "strategies": ["List of age-appropriate strategies"],
        "realWorldConnections": ["How this connects to real life"],
        "vocabulary": ["Key terms needed"],
        "priorKnowledge": ["What students should know already"]
      },
      "visualTheme": {
        "primaryTheme": "e.g., Space Exploration, Jungle Safari",
        "colorPalette": "5 hex codes for each phase",
        "characters": "Consistent visual characters",
        "animationStyle": "e.g., Smooth transitions, bouncy, minimalist",
        "soundTheme": "audio cues suggestions"
      },
      "phases": {
        "engage": {
          "duration": "5 minutes",
          "researchHook": "research-based physical/digital hook",
          "visualTheme": "visual style description",
          "screenLayout": "screen arrangement",
          "interactiveHook": "what students physically do",
          "misconceptionAddressed": "how to tackle a misconception early",
          "animations": "opening animation description",
          "audio": "opening sound theme",
          "activities": ["List of activities with visual descriptions"]
        },
        "learn": {
          "duration": "8 minutes",
          "researchContent": "pedagogically sound instructional approach",
          "animations": "step-by-step visual learning breakdown",
          "researchInsight": "e.g., Chunking, multimodal presentation",
          "interactiveLearning": "student manipulation of concepts",
          "checkForUnderstanding": "visual feedback system",
          "activities": ["List of activities with visual descriptions"]
        },
        "practiceTogether": {
          "duration": "12 minutes",
          "researchStrategy": "collaborative learning method",
          "collaborationInterface": "group workspace design",
          "differentiation": "how roles help mixed-ability groups",
          "progressVisualization": "how groups see progress",
          "celebration": "positive reinforcement animation",
          "activities": ["List of activities with visual descriptions"]
        },
        "tryItYourself": {
          "duration": "10 minutes",
          "researchPractice": "optimal practice structure",
          "workspaceDesign": "individual activity area appearance",
          "scaffoldingSystem": "gradual release visual cues",
          "selfAssessment": "visual self-check methods",
          "errorRecovery": "constructive mistake handling",
          "activities": ["List of activities with visual descriptions"]
        },
        "thinkAboutIt": {
          "duration": "5 minutes",
          "researchReflection": "effective reflection technique",
          "exitTicket": "reflection interface design",
          "realWorldConnection": "applied learning visualization",
          "takeawayGraphic": "visual summary takeaway",
          "activities": ["List of activities with visual descriptions"]
        }
      },
      "assessment": {
        "formativeChecks": "visual assessment points",
        "extension": "for advanced learners",
        "support": "for struggling learners",
        "accessibility": "alt-text, high contrast notes"
      },
      "resources": {
        "visualAssets": "required images/animations",
        "interactiveTools": "digital manipulatives",
        "props": "optional physical items",
        "teacherNotes": "research citations and pedagogical notes"
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
