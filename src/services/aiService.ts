import { dualAIService } from "@/services/DualAIService";

export interface AIConfig {
    provider: 'gemini' | 'openai' | 'deepseek';
    apiKey: string;
    model?: string;
}

export interface GenerationResponse {
    content: string;
    error?: string;
}

export interface PhaseVisuals {
    visualTheme: string;
    animations: string;
    researchNote: string;
}

const SYSTEM_PROMPT_QUIZ = `You are a helpful assistant for teachers. Generate a quiz in JSON format based on the user's request. 
The JSON should follow this structure exactly:
{
  "title": "Quiz Title",
  "description": "Short description",
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0 // 0 for A, 1 for B, etc.
    }
  ]
}
Do not include markdown formatting (like \`\`\`json) in the response, just the raw JSON.`;

const SYSTEM_PROMPT_LESSON = `You are a helpful assistant for teachers. Generate a lesson plan in JSON format based on the user's request.
The JSON should follow this structure exactly:
{
  "title": "Lesson Title",
  "description": "Short description",
  "content": [
    {
      "type": "text",
      "content": "Introduction or explanation text..."
    },
    {
      "type": "text",
      "content": "Key concepts..."
    }
  ]
}
Do not include markdown formatting (like \`\`\`json) in the response, just the raw JSON.`;

const SYSTEM_PROMPT_PHASE_VISUALS = `You are an EXPERT EDUCATIONAL DESIGNER. Generate visual and pedagogical metadata for a lesson phase in JSON format.
The JSON should follow this structure exactly:
{
  "visualTheme": "Description of a pedagogically relevant and subject-specific visual style (e.g. for Math: concrete objects, patterns; for Science: lab settings, nature). MUST NOT be generic sci-fi/futuristic unless topic-related.",
  "animations": "description of gentle, focus-enhancing motion effects",
  "researchNote": "pedagogical strategy or research insight for this phase appropriate for the specific grade level"
}
Do not include markdown formatting, just raw JSON.`;

export const generateContent = async (
    config: AIConfig,
    prompt: string,
    type: 'quiz' | 'lesson' | 'text' | 'phase-visuals'
): Promise<GenerationResponse> => {
    try {
        let systemPrompt = '';
        const isJsonMode = ['quiz', 'lesson', 'phase-visuals'].includes(type);

        if (type === 'quiz') systemPrompt = SYSTEM_PROMPT_QUIZ;
        else if (type === 'lesson') systemPrompt = SYSTEM_PROMPT_LESSON;
        else if (type === 'phase-visuals') systemPrompt = SYSTEM_PROMPT_PHASE_VISUALS;
        else systemPrompt = "You are a helpful assistant for teachers. Generate clear, educational content that is pedagogically accurate and age-appropriate for the students' grade level. All suggestions must be strictly related to the requested subject and topic. Do not wrap in JSON. Just provide the text content directly.";

        if (config.provider === 'gemini') {
            const result = await dualAIService.generateContent(
                prompt,
                async () => {
                    const resp = await callGemini(config.apiKey, `${systemPrompt}\n\nUser Request: ${prompt}`, isJsonMode);
                    return resp.content;
                },
                systemPrompt
            );

            const content = typeof result === 'string' ? result : JSON.stringify(result);
            return { content };
        } else {
            const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
            return await callOpenAICompatible(config, fullPrompt, isJsonMode);
        }
    } catch (error: any) {
        return {
            content: '',
            error: error.message || 'An unexpected error occurred during generation.'
        };
    }
};

const callGemini = async (apiKey: string, prompt: string, jsonMode: boolean = false): Promise<GenerationResponse> => {
    const configurations = [
        { version: 'v1', model: 'gemini-1.5-flash' },
        { version: 'v1', model: 'gemini-1.5-flash-latest' },
        { version: 'v1beta', model: 'gemini-2.0-flash' },
        { version: 'v1', model: 'gemini-1.5-pro' }
    ];

    let firstError = '';

    for (const config of configurations) {
        try {
            const body: any = {
                contents: [{ parts: [{ text: prompt }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
                ]
            };

            if (jsonMode) {
                body.generationConfig = {
                    response_mime_type: "application/json"
                };
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || 'Gemini API request failed';
                const lowerMsg = errorMessage.toLowerCase();
                if (lowerMsg.includes('api key') || lowerMsg.includes('consumer') || lowerMsg.includes('project') || lowerMsg.includes('permission')) {
                    return { content: '', error: `Access denied. Please check your API key. (${errorMessage})` };
                }
                console.warn(`Config ${config.version}/${config.model} failed: ${errorMessage}`);
                if (!firstError) firstError = errorMessage;
                if (response.status === 429) await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return { content: cleanJson(content) };
        } catch (error: any) {
            console.warn(`Network error with ${config.model}:`, error);
            if (!firstError) firstError = error.message;
        }
    }

    if (firstError.includes('429') || firstError.includes('quota')) {
        return { content: '', error: `Rate limit exceeded. Please wait 30 seconds and try again.` };
    }
    return { content: '', error: `Unable to connect to Gemini. (Primary Error: ${firstError})` };
};

const callOpenAICompatible = async (config: AIConfig, prompt: string, jsonMode: boolean = false): Promise<GenerationResponse> => {
    try {
        let baseUrl = 'https://api.openai.com/v1';
        let model = config.model || 'gpt-3.5-turbo';

        if (config.provider === 'deepseek') {
            baseUrl = 'https://api.deepseek.com';
            model = 'deepseek-chat';
        }

        const body: any = {
            model: model,
            messages: [
                { role: 'system', content: jsonMode ? 'You are a helpful assistant that outputs strictly valid JSON.' : 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        };

        if (jsonMode) {
            body.response_format = { type: "json_object" };
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        return { content: cleanJson(content) };
    } catch (error: any) {
        return { content: '', error: error.message };
    }
};

const cleanJson = (text: string): string => {
    let cleaned = text.trim();
    // Remove markdown code blocks
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/i, '');

    // Sometimes AI leaves trailing commas in arrays/objects which native JSON.parse hates
    // (This is a safety measure even with JSON mode)
    cleaned = cleaned.replace(/,(\s*[\}\]])/g, '$1');

    return cleaned.trim();
};
