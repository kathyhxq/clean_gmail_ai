import { GoogleGenAI, Type } from "@google/genai";
import { Email, GeminiFilterResponse } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set in environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFilterIntent = async (
  userPrompt: string
): Promise<GeminiFilterResponse> => {
  const ai = getAiClient();
  
  const prompt = `
    You are a Gmail Search Expert.
    User wants to filter emails in Gmail. 
    Analyze this request: "${userPrompt}".
    
    Construct a highly effective Gmail search query (using operators like category:, -in:spam, -label:important, older_than:, etc.).
    
    CRITICAL RULES FOR GMAIL QUERIES:
    - If user mentions "Primary", use 'category:primary'.
    - If user wants "non-important", use '-label:important' (and optionally '-is:starred').
    - If user wants to clean "clutter", look for 'unsubscribe' OR 'category:updates' OR 'category:promotions'.
    - If user says "not spam", use '-in:spam'.
    
    Return a JSON object with:
    1. 'gmailQuery': The exact string the user should paste into Gmail search bar.
    2. 'explanation': A short human-readable explanation of what this filter does.
    3. 'localFilterCriteria': A set of structured criteria to filter a local javascript array of emails for a preview.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gmailQuery: { type: Type.STRING, description: "Gmail search operator string" },
            explanation: { type: Type.STRING, description: "Explanation of the filter" },
            localFilterCriteria: {
              type: Type.OBJECT,
              properties: {
                senderContains: { type: Type.ARRAY, items: { type: Type.STRING } },
                subjectContains: { type: Type.ARRAY, items: { type: Type.STRING } },
                bodyContains: { type: Type.ARRAY, items: { type: Type.STRING } },
                olderThanDays: { type: Type.NUMBER },
                category: { type: Type.STRING },
                isUnread: { type: Type.BOOLEAN },
                excludeImportant: { type: Type.BOOLEAN, description: "If true, exclude important emails" }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiFilterResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback response for demo purposes if API fails or key is missing
    return {
      gmailQuery: "category:primary -in:spam -label:important",
      explanation: "Failed to connect to AI. Defaulting to: Non-important Primary emails.",
      localFilterCriteria: {
        category: 'primary',
        excludeImportant: true
      }
    };
  }
};

export const applyLocalFilter = (emails: Email[], criteria: GeminiFilterResponse['localFilterCriteria']): Email[] => {
  const now = new Date();
  
  return emails.filter(email => {
    // Filter by days old
    if (criteria.olderThanDays) {
      const diffTime = Math.abs(now.getTime() - email.date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < criteria.olderThanDays) return false;
    }

    // Filter by Read/Unread
    if (criteria.isUnread !== undefined) {
      if (email.isRead === criteria.isUnread) return false;
    }

    // Filter by Category
    if (criteria.category) {
      if (email.category !== criteria.category && criteria.category !== 'all') return false;
    }

    // Filter Exclude Important
    if (criteria.excludeImportant) {
      if (email.isImportant) return false;
    }

    // Filter by Sender
    if (criteria.senderContains && criteria.senderContains.length > 0) {
      const senderMatch = criteria.senderContains.some(s => 
        email.sender.toLowerCase().includes(s.toLowerCase()) || 
        email.senderEmail.toLowerCase().includes(s.toLowerCase())
      );
      if (!senderMatch) return false;
    }

    // Filter by Subject
    if (criteria.subjectContains && criteria.subjectContains.length > 0) {
      const subjectMatch = criteria.subjectContains.some(s => 
        email.subject.toLowerCase().includes(s.toLowerCase())
      );
      if (!subjectMatch) return false;
    }
    
    // Filter by Body/Snippet
    if (criteria.bodyContains && criteria.bodyContains.length > 0) {
       const bodyMatch = criteria.bodyContains.some(s => 
         email.snippet.toLowerCase().includes(s.toLowerCase())
       );
       if (!bodyMatch) return false;
    }

    return true;
  });
};