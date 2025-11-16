import { GoogleGenAI } from "@google/genai";
import { Message, Role, StudyStyle, Difficulty } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (style: StudyStyle, difficulty: Difficulty, customPrompt?: string): string => {
    let baseInstruction = `You are StudyChat, an expert AI study assistant. Your goal is to provide clear, accurate, and helpful information tailored to a student's level.
- ALWAYS format mathematical formulas using LaTeX. Use single dollar signs for inline math (e.g., \`$E=mc^2$\`) and double dollar signs for display math (e.g., \`$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$\`).
- Provide step-by-step reasoning for derivations and problem-solving.
- Wrap key terms in \`<strong>\` tags for emphasis.
- Structure your response in the following order:
  1. A concise, one-paragraph summary prefixed with \`SUMMARY::\`.
  2. The full, detailed response.
  3. Occasionally, a relevant study tip prefixed with \`STUDY_TIP::\`.
  4. At the end, suggest 2-3 related topics for further learning, prefixed with \`RELATED_TOPICS::\` and separated by newlines.
- Tailor your explanation to a ${difficulty} level.`;

    switch (style) {
        case StudyStyle.SUMMARY:
            return `${baseInstruction} Provide a concise summary of the following topic, focusing on the key points.`;
        case StudyStyle.DETAILED:
            return `${baseInstruction} Generate detailed study notes on the following topic. Use headings and bullet points for clarity.`;
        case StudyStyle.EXAM:
            return `${baseInstruction} Create exam-style questions and answers (Q&A) for the following topic.`;
        case StudyStyle.CHEAT_SHEET:
            return `${baseInstruction} Create a 'cheat sheet' with key formulas, definitions, and facts for the following topic.`;
        case StudyStyle.MCQ:
            return `${baseInstruction} Generate 5 multiple-choice questions (MCQs) for the topic. Indicate the correct answer and provide a brief explanation.`;
        case StudyStyle.CUSTOM:
            return `${baseInstruction} ${customPrompt || 'Follow the user\'s instructions carefully.'}`;
        case StudyStyle.ASSISTANT:
        default:
            return baseInstruction;
    }
};

export const generateResponse = async (
    history: Message[],
    style: StudyStyle,
    difficulty: Difficulty,
    customPrompt?: string
): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const systemInstruction = getSystemInstruction(style, difficulty, customPrompt);
        
        const chatHistory = history.filter(msg => msg.role === Role.USER || msg.role === Role.ASSISTANT).map(msg => ({
            role: msg.role === Role.USER ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        if (chatHistory.length === 0) {
            return "I need a topic to get started!";
        }

        const response = await ai.models.generateContent({
          model,
          contents: chatHistory,
          config: {
            systemInstruction,
          }
        });

        return response.text;

    } catch (error) {
        console.error('Error generating response from Gemini API:', error);
        return 'Sorry, I encountered an error while processing your request. Please check the console for details.';
    }
};