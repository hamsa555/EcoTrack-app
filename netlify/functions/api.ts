import express from "express";
import serverless from "serverless-http";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// API Routes
app.post("/api/ai/analyze-waste", async (req, res) => {
  try {
    const { imageData } = req.body;
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this image. Is it a waste item or a product? If so, tell me: 1. What it is. 2. Is it recyclable? (Yes/No). 3. How to dispose of it properly. 4. Estimated CO2 impact if recycled vs thrown away." },
            {
              inlineData: {
                data: imageData.split(',')[1],
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING },
            recyclable: { type: Type.BOOLEAN },
            instructions: { type: Type.STRING },
            co2Saved: { type: Type.NUMBER }
          },
          required: ["item", "recyclable", "instructions", "co2Saved"]
        }
      }
    });
    res.json(JSON.parse(result.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/advice", async (req, res) => {
  try {
    const { context } = req.body;
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Expert environmental advice under 30 words: ${context || ""}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            category: { type: Type.STRING },
            actionLabel: { type: Type.STRING }
          },
          required: ["suggestion", "category", "actionLabel"]
        }
      }
    });
    res.json(JSON.parse(result.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/analyze-mission", async (req, res) => {
  try {
    const { description, type } = req.body;
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Analyze mission: ${description} (Type: ${type})` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: { type: Type.NUMBER },
            co2Saved: { type: Type.NUMBER },
            tag: { type: Type.STRING }
          },
          required: ["points", "co2Saved", "tag"]
        }
      }
    });
    res.json(JSON.parse(result.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || m.parts[0].text }]
      })),
      config: {
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
      }
    });
    res.json({ text: result.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const handler = serverless(app);
