/**
 * Simple test script to verify Gemini API connection.
 * Import this in main.tsx temporarily to test: import './test-api';
 */
import { isConfigured } from './utils/geminiAI';

async function testGeminiConnection() {
    console.log("%c Testing Gemini API Connection... ", "background: #222; color: #bada55; padding: 4px; border-radius: 4px; font-weight: bold;");

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log("API Key present:", !!apiKey);
    console.log("API Key value:", apiKey); // As requested by user

    if (!apiKey) {
        console.error("❌ API Key is missing! Check .env file.");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say hello in 5 words" }] }]
            })
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ API Request Failed:", errorData);
            throw new Error(errorData.error?.message || "API Request Failed");
        }

        const data = await response.json();
        console.log("✅ API Success! Raw Data:", data);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("%c AI Response: " + text, "color: green; font-weight: bold; font-size: 14px;");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

// Run the test
testGeminiConnection();
