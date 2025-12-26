
import { GoogleGenAI } from "@google/genai";
import { Interaction } from "./types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const simulatePatientResponse = async (
  patientBio: string,
  history: Interaction[],
  studentMessage: string
): Promise<string> => {
  // Using gemini-3-flash-preview for basic conversational simulation
  const model = 'gemini-3-flash-preview';
  
  const conversationHistory = history.map(h => 
    `${h.role === 'student' ? 'Student' : 'You'}: ${h.content}`
  ).join('\n');

  const systemInstruction = `
    You are an AI simulating a patient in a psychology training environment.
    PATIENT PERSONA: ${patientBio}
    
    GUIDELINES:
    1. Stay strictly in character. Do not reveal you are an AI.
    2. Respond naturally to the student therapist.
    3. Express emotions appropriate to your bio (anxiety, defensiveness, sadness, etc.).
    4. Provide short to medium-length responses to allow for a back-and-forth dialogue.
    5. If the student uses good techniques (like reflections or open-ended questions), gradually become slightly more open, but don't resolve your issues too quickly.
    6. If the student is clinical, cold, or judgmental, respond with appropriate withdrawal or irritation.
  `;

  const prompt = `
    ${conversationHistory}
    Student: ${studentMessage}
    You:
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.9,
      }
    });

    // Extracting text output from response.text property
    return response.text || "I'm not sure how to respond to that right now...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm feeling a bit overwhelmed and can't talk right now. (System Error)";
  }
};

export const generateStaffBriefing = async (transcript: Interaction[]): Promise<string> => {
  // Using gemini-3-pro-preview for complex reasoning and analysis tasks
  const model = 'gemini-3-pro-preview';
  const textTranscript = transcript.map(t => `${t.role}: ${t.content}`).join('\n');
  
  const prompt = `
    As a clinical supervisor, analyze the following therapist-patient interaction transcript.
    Provide a concise summary of the student's performance focusing on:
    1. Therapeutic Alliance
    2. Use of clinical techniques
    3. Areas of concern
    
    Transcript:
    ${textTranscript}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // Extracting text output from response.text property
    return response.text || "No summary available.";
  } catch (error) {
    return "Error generating briefing.";
  }
};
