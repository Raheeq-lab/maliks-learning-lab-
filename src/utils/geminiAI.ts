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
    activityType?: "poll" | "brainstorm" | "flashcards" | "steps" | "categorization" | "scaffolded" | "exit-ticket" | "carousel" | "presentation" | "instructional";
    activityData?: {
        pollOptions?: string[];
        flashcards?: { front: string; back: string }[];
        steps?: string[];
        categorizationGroups?: { title: string; items: string[] }[];
        scaffoldedLevels?: { level: number; question: string; hint?: string; solution: string }[];
        carouselStations?: { station: string; task: string; content: string }[];
        slides?: { title: string; bullets: string[]; imagePrompt?: string; speakerNotes?: string }[];
        // Instructional Data
        history?: string;
        vocabulary?: { term: string; definition: string }[];
        workedExample?: { problem: string; steps: { label: string; explanation: string; visual?: string }[] };
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

// Helper to repair truncated JSON
function repairJson(jsonStr: string): any {
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        // Simple repair: Close open braces/brackets
        let repaired = jsonStr.trim();
        const quoteCount = (repaired.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            repaired += '"';
        }

        const stack: string[] = [];
        let inString = false;
        let escape = false;

        for (let i = 0; i < repaired.length; i++) {
            const char = repaired[i];
            if (escape) { escape = false; continue; }
            if (char === '\\') { escape = true; continue; }
            if (char === '"') { inString = !inString; continue; }
            if (inString) continue;

            if (char === '{') stack.push('}');
            if (char === '[') stack.push(']');
            if (char === '}' || char === ']') {
                if (stack.length > 0) stack.pop();
            }
        }

        // Append missing closures in reverse order
        while (stack.length > 0) {
            repaired += stack.pop();
        }

        try {
            console.warn("[JSON Repair] Attempting to repair truncated JSON...");
            return JSON.parse(repaired);
        } catch (e2) {
            throw new Error("Failed to parse Gemini response even after repair.");
        }
    }
}

// Updated configurations for Preview Access Keys
// Standard standard configurations for Gemini models
// Comprehensive configuration for Gemini models - prioritizing v1beta for broader feature support
const MODELS = [
    { model: "gemini-1.5-flash", version: "v1beta" },
    { model: "gemini-1.5-flash-latest", version: "v1beta" },
    { model: "gemini-2.0-flash", version: "v1beta" },
    { model: "gemini-1.5-pro", version: "v1beta" }
];

import { dualAIService } from "@/services/DualAIService";

/**
 * Internal function to execute the actual Gemini calls (Fallback logic)
 */
async function _internalGeminiCall(prompt: string): Promise<any> {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please check your .env file.");
    }

    let lastError = null;

    for (const { model, version } of MODELS) {
        try {
            console.log(`[Gemini Fallback] Attempting model: ${model} (${version})`);

            const isV1 = version === 'v1';
            const generationConfig: any = {
                temperature: 0.7,
                maxOutputTokens: 8192
            };

            if (!isV1) {
                generationConfig.response_mime_type = "application/json";
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: generationConfig,
                    safetySettings: [{ category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Status ${response.status}`);
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];

            if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
                throw new Error("Empty response from Gemini API");
            }

            const textContent = candidate.content.parts[0].text;

            // 1. Try extracting from markdown code block first
            const markdownMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || textContent.match(/```\n([\s\S]*?)\n```/);
            let cleanedJson = markdownMatch ? markdownMatch[1] : textContent;

            // 2. If no markdown, try pure cleanup of possible wrapping Text
            if (!markdownMatch) {
                cleanedJson = textContent.replace(/```json\n?|\n?```/g, "").trim();
            }

            // 3. Last resort: Find first '{' and last '}'
            const firstBrace = cleanedJson.indexOf('{');
            const lastBrace = cleanedJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
            } else if (firstBrace !== -1) {
                // If start exists but no clear end, it might be truncated. Take all.
                cleanedJson = cleanedJson.substring(firstBrace);
            }

            try {
                return JSON.parse(cleanedJson);
            } catch (e) {
                console.warn("[Gemini Fallback] Strict parse failed. Attempting to repair truncated JSON...");
                try {
                    return repairJson(cleanedJson);
                } catch (repairError) {
                    console.warn("[Gemini Fallback] Repair failed.", repairError);
                    throw new Error("Failed to parse Gemini response as JSON");
                }
            }

        } catch (error: any) {
            console.warn(`[Gemini Fallback] Failed with model ${model}:`, error.message);
            lastError = error;
        }
    }

    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

/**
 * Main entry point for AI calls - Routes through DualAIService (Cloudflare -> Gemini)
 */
/**
 * Main entry point for AI calls - Routes through DualAIService (Cloudflare -> Gemini)
 */
async function callGeminiAPI(prompt: string): Promise<any> {
    try {
        const result = await dualAIService.generateContent(
            prompt,
            () => _internalGeminiCall(prompt)
        );

        // Ensure we always return an object if the result is a string
        if (typeof result === 'string') {
            try {
                // Try regex extraction for array or object
                const jsonMatch = result.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }

                // If it's just raw text that looks like a list, try a simple repair
                return repairJson(result);
            } catch (e) {
                console.warn("[callGeminiAPI] JSON extraction failed. Forcing Gemini fallback.");
                return await _internalGeminiCall(prompt);
            }
        }
        return result;
    } catch (error) {
        console.error("Dual AI Service failed completely:", error);
        // Last ditch fallback if dualAIService completely threw up
        try {
            console.warn("Attempting final emergency fallback to Gemini...");
            return await _internalGeminiCall(prompt);
        } catch (finalError) {
            throw error;
        }
    }
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
    - Primary Goal: Direct Instruction & Concept Modeling.
    - Required Activity: "Instructional Breakdown" (History/Context + Vocabulary + Worked Example).
    - JSON required: 
      - "activityType": "instructional"
      - "activityData": {
          "history": "Brief 2-3 sentence engaging history or real-world context of this topic.",
          "vocabulary": [ { "term": "Key Term", "definition": "Simple definition" } ... (3-4 terms) ],
          "workedExample": {
             "problem": "A clear, standard example problem or scenario.",
             "steps": [ 
                 { "label": "Step 1", "explanation": "What to do first...", "visual": "Simple text visual or description" },
                 { "label": "Step 2", "explanation": "What to do next...", "visual": "..." }
             ]
          }
      }

    ## PHASE 3: 👥 PRACTICE TOGETHER (12 mins)
    - Primary Goal: Collaborative mastery.
    - Required Activity: "4-Carousel Challenge" OR "Interactive Slides" (Choose based on topic).
    - If "Carousel":
      - JSON: "activityType": "carousel", "activityData": { "carouselStations": [...] }
      - 4 Stations: BRAIN, HEART, HANDS, VOICE.
    - If "Presentation" (Slides):
      - JSON: "activityType": "presentation", "activityData": { "slides": [{ "title": "...", "bullets": ["..."], "imagePrompt": "...", "speakerNotes": "..." }] }
      - Structure: 4-5 high-impact slides (Intro, Concept 1, Concept 2, Application, Summary).
    - FORBIDDEN: Do NOT put a summary in the "activities" array. Leave "activities" empty.
    - Content: Specific tasks/questions/content for the chosen activity.

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
          "researchContent": "Direct explicit instruction",
          "imagePrompt": "Educational diagram",
          "activities": [],
          "activityType": "instructional",
          "activityData": {
             "history": "In 1666, Isaac Newton...",
             "vocabulary": [{ "term": "Gravity", "definition": "A force that pulls..." }],
             "workedExample": {
                 "problem": "Calculate force...",
                 "steps": [{ "label": "Identify Mass", "explanation": "First, find..." }]
             }
          }
        },
        "practiceTogether": {
          "duration": "12 minutes",
          "researchStrategy": "Rotational group collaboration OR Interactive Direct Instruction",
          "imagePrompt": "A detailed DALL-E style prompt for practice visual",
          "activityType": "carousel", // OR "presentation"
          "activities": [], 
          "activityData": { 
            "carouselStations": [
              { "station": "BRAIN", "task": "Define & Describe", "content": "Specific question..." },
              { "station": "HEART", "task": "Connect & Question", "content": "Specific question..." },
              { "station": "HANDS", "task": "Solve & Create", "content": "Specific problem..." },
              { "station": "VOICE", "task": "Judge & Defend", "content": "Specific debate prompt..." }
            ],
            "slides": [
               { "title": "Slide 1", "bullets": ["Point 1", "Point 2"], "imagePrompt": "Visual...", "speakerNotes": "Notes..." }
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

    try {
        const response = await dualAIService.generateContent(
            fullPrompt,
            async () => {
                // Internal Fallback to Gemini Logic (simplified for internal call)
                // Re-use internal logic if strictly needed, or just let dualAIService handle it via its own internal fallback structure if defined.
                // Actually, dualAIService expects a fallbackFn that DOES the call.
                // Since we are refactoring, we should make sure we share the single 'callGemini' logic.
                return await _internalGeminiCall(fullPrompt);
            }
        );
        return typeof response === 'string' ? response : JSON.stringify(response);
    } catch (error: any) {
        console.error("Text generation failed:", error);
        throw new Error("Failed to generate content.");
    }
};

export const isConfigured = (): boolean => {
    return !!GEMINI_API_KEY;
};

/**
 * Generate Flashcards
 */
export async function generateFlashcards(
    subject: string,
    grade: string,
    topic: string,
    count: number = 10
): Promise<{ front: string; back: string }[]> {
    const prompt = `ACT AS AN EXPERT TEACHER.
Generate a JSON array of exactly ${count} educational flashcards for Grade ${grade} ${subject} on the topic: "${topic}".

Format:
[
  {"front": "Question or Term", "back": "Answer or Definition"}
]

Constraints:
- Return ONLY the JSON array.
- No conversational text before or after.
- Ensure content is age-appropriate.`;

    try {
        const result = await callGeminiAPI(prompt);
        if (Array.isArray(result)) return result;
        if (result.flashcards && Array.isArray(result.flashcards)) return result.flashcards;
        if (result.cards && Array.isArray(result.cards)) return result.cards;

        throw new Error("Invalid format");
    } catch (e) {
        console.error("Failed to generate flashcards", e);
        throw new Error("AI failed to generate flashcards in a valid format. Please try again.");
    }
}
