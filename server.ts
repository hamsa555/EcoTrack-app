import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/ai/analyze-waste", async (req, res) => {
    try {
      const { imageData } = req.body;
      const prompt = "Analyze this image. Is it a waste item or a product? If so, tell me: 1. What it is. 2. Is it recyclable? (Yes/No). 3. How to dispose of it properly. 4. Estimated CO2 impact if recycled vs thrown away.";

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
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
      console.error("AI Waste Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/advice", async (req, res) => {
    try {
      const { context } = req.body;
      const prompt = `You are an expert environmental consultant. Give a short, inspiring, and actionable eco-friendly advice or suggestion for today. 
      ${context ? `Consider this user context: ${context}` : ""}
      Focus on things like:
      - Planting specific trees for the season
      - Reducing specific types of waste
      - Energy saving hacks
      - Sustainable shopping swaps
      - Local biodiversity support
      
      Keep it under 30 words.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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
      console.error("AI Advice Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/analyze-mission", async (req, res) => {
    try {
      const { description, type } = req.body;
      const prompt = `Analyze this environmental mission: "${description}". The activity type is "${type}". 
      Calculate:
      1. Base Impact Points (XP) - a number between 10 and 100 based on effort and impact.
      2. Estimated CO2 Offset in kg - a realistic decimal number.
      3. A short "Verification Tag" (e.g., "Park Cleanup", "Plastic Reduction").
      
      Guidelines:
      - If the description is vague, provide conservative estimates.
      - If it's detailed (e.g., "Picked up 5 bags of trash"), reward it more.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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
      console.error("AI Mission Error:", error);
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
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
