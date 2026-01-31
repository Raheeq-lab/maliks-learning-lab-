
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
  "visualTheme": "description of cinematic visual style",
  "animations": "description of motion effects",
  "researchNote": "pedagogical strategy or research insight for this phase"
}
Do not include markdown formatting, just raw JSON.`;

export const generateContent = async (
    config: AIConfig,
    prompt: string,
    type: 'quiz' | 'lesson' | 'text' | 'phase-visuals' // Added phase-visuals
): Promise<GenerationResponse> => {
    try {
        let systemPrompt = '';
        if (type === 'quiz') systemPrompt = SYSTEM_PROMPT_QUIZ;
        else if (type === 'lesson') systemPrompt = SYSTEM_PROMPT_LESSON;
        else if (type === 'phase-visuals') systemPrompt = SYSTEM_PROMPT_PHASE_VISUALS;
        else systemPrompt = "You are a helpful assistant for teachers. Generate clear, educational content based on the user's request. Do not wrap in JSON. Just provide the text content directly.";

        const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

        if (config.provider === 'gemini') {
            return await callGemini(config.apiKey, fullPrompt);
        } else {
            return await callOpenAICompatible(config, fullPrompt);
        }
    } catch (error: any) {
        return {
            content: '',
            error: error.message || 'An unexpected error occurred during generation.'
        };
    }
};

const callGemini = async (apiKey: string, prompt: string): Promise<GenerationResponse> => {
    // Configurations to try in order. Prioritize stable 1.5 models.
    const configurations = [
        { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { version: 'v1beta', model: 'gemini-1.5-flash' },
        { version: 'v1', model: 'gemini-pro' }
    ];

    let firstError = '';

    for (const config of configurations) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || 'Gemini API request failed';

                // Check for common auth/permission errors indiscriminately
                const lowerMsg = errorMessage.toLowerCase();
                if (lowerMsg.includes('api key') || lowerMsg.includes('consumer') || lowerMsg.includes('project') || lowerMsg.includes('permission')) {
                    return { content: '', error: `Access denied. Please check your API key and enable the API. (${errorMessage})` };
                }

                console.warn(`Config ${config.version}/${config.model} failed: ${errorMessage}`);

                // Capture the first error as it's likely the most relevant (from the preferred model)
                if (!firstError) {
                    firstError = errorMessage;
                }

                continue; // Try next config
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return { content: cleanJson(content) };
        } catch (error: any) {
            console.warn(`Network/Code error with ${config.model}:`, error);
            if (!firstError) firstError = error.message;
        }
    }

    // If we get here, all configs failed
    return {
        content: '',
        error: `Unable to connect to Gemini. (Primary Error: ${firstError})`
    };
};



const callOpenAICompatible = async (config: AIConfig, prompt: string): Promise<GenerationResponse> => {
    try {
        let baseUrl = 'https://api.openai.com/v1';
        let model = config.model || 'gpt-3.5-turbo';

        if (config.provider === 'deepseek') {
            baseUrl = 'https://api.deepseek.com'; // Standard DeepSeek API URL
            model = 'deepseek-chat';
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
            }),
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

// Helper to remove markdown code blocks if the AI includes them despite instructions
const cleanJson = (text: string): string => {
    text = text.trim();
    if (text.startsWith('```json')) {
        text = text.substring(7);
    } else if (text.startsWith('```')) {
        text = text.substring(3);
    }
    if (text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
    }
    return text.trim();
};
