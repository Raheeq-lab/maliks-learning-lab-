# Gemini API Integration Guide for Malik's Learning Lab

## 1. Environment Setup
- **File**: `.env` (in project root)
- **Content**: `VITE_GEMINI_API_KEY=AIzaSyBGH9B5Q-fvwaFrfQrGP0Plck2kJo5bbTI`
- **Status**: ✅ Configured.

## 2. API Utility (`src/utils/geminiAI.ts`)
- **Key Features**:
  - Exports `QuizQuestion` and `LessonPlan` interfaces.
  - `generateQuizQuestions`: Returns structured quiz data.
  - `generateLessonPlan`: Returns structured 5-phase lesson plans.
  - **Smart Fallback**: Automatically removes incompatible settings for legacy models (v1 vs v1beta).
  - **Error Handling**: Retries multiple models (`gemini-1.5-flash`, `gemini-pro`) if one fails.

## 3. Verification
Run the test script in your browser console (import it in `main.tsx` temporarily):
```typescript
import './test-api';
// Check console for: "✅ API Success! Raw Data: ..."
```

## 4. UI Component (`src/components/teacher/tabs/QuestionGeneratorTab.tsx`)
- Updated to include:
  - Subject/Grade/Topic selectors.
  - "Generate Quiz/Lesson" tabs.
  - **Results View**: Shows generated questions with correct answers highlighted.
  - "Add to Quiz" button to save to your library.

## 5. Troubleshooting
If the API fails:
1.  **Check Key**: Ensure `.env` has no quotes/spaces around the key.
2.  **Restart Server**: Run `npm run dev` again if you changed `.env`.
3.  **Google AI Studio**:
    - Go to [Google AI Studio](https://aistudio.google.com/apikey).
    - Click the three dots next to your key > **Edit API key**.
    - Ensure "API restrictions" is set to "Don't restrict key" or includes "Generative Language API".

## 6. Production Deployment (Vercel / Supabase)
**CRITICAL**: Do NOT expose `VITE_GEMINI_API_KEY` in production frontend code.

### Recommended: Vercel Serverless Function
1.  Create `api/gemini.ts` (if using Vercel functions):
    ```typescript
    import type { VercelRequest, VercelResponse } from '@vercel/node';

    export default async function handler(req: VercelRequest, res: VercelResponse) {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY; // Secure server-side env var

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate content' });
      }
    }
    ```
2.  **Vercel Dashboard**:
    - Go to Settings > Environment Variables.
    - Add `GEMINI_API_KEY` (value: your key).
3.  **Update Frontend**:
    - Change `geminiAI.ts` to fetch `/api/gemini` instead of calling Google directly.

---
**Status**: The local implementation is complete and ready for testing!
