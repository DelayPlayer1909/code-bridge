import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topK: 1,
        topP: 1
    }
});

export async function getAIResponse(message: string): Promise<{ response?: string; error?: string }> {
    try {
        const result = await model.generateContent(message);
        const response = result.response;
        const text = response.text();

        if (!text) {
            throw new Error('No response generated');
        }

        return {
            response: text
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        return {
            error: error instanceof Error
                ? `Error: ${error.message}`
                : "Failed to get AI response"
        };
    }
}
