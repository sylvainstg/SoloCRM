
import { GoogleGenAI, Type } from "@google/genai";
import { Contact, Interaction } from "../types";

// Correct initialization as per Google GenAI SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRelationship = async (contact: Contact, recentInteractions: Interaction[]) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analyze the following CRM contact data and interaction history.
    Provide a concise "AI Insight" (max 30 words) summarizing the relationship status and a suggested next step.
    
    Contact: ${contact.name} (${contact.company})
    Current Stage: ${contact.stage}
    Interactions:
    ${recentInteractions.map(i => `- ${i.date}: ${i.type} - ${i.summary}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    
    // Correctly accessing text property
    return response.text?.trim() || "No insights available at this time.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Failed to generate AI insights.";
  }
};

export const generateFollowUpDraft = async (contact: Contact) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Draft a short, professional follow-up email for ${contact.name} from ${contact.company}.
    The lead is currently in the "${contact.stage}" stage.
    Keep it under 60 words and personalized.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // Correctly accessing text property
    return response.text?.trim();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};
