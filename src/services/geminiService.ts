export async function analyzeWaste(imageData: string) {
  const response = await fetch('/api/ai/analyze-waste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI Analysis Failed");
  }

  return response.json();
}

const ADVICE_CACHE_KEY = 'eco_advice_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000;

export async function getEcoAdvice(context?: string, forceRefresh = false) {
  const cached = localStorage.getItem(ADVICE_CACHE_KEY);
  let cachedData: any = null;
  
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      cachedData = data;
      if (!forceRefresh && (Date.now() - timestamp < CACHE_DURATION)) {
        return data;
      }
      if (forceRefresh && (Date.now() - timestamp < 10000)) {
        return data;
      }
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  try {
    const response = await fetch('/api/ai/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(ADVICE_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return data;
    }
  } catch (error: any) {
    console.error("Gemini Advice Error:", error);
  }
  
  return cachedData || {
    suggestion: "Plant a native sapling today to support local biodiversity and offset your carbon footprint.",
    category: "Conservation",
    actionLabel: "Start Plan"
  };
}

export async function analyzeMission(description: string, type: string) {
  try {
    const response = await fetch('/api/ai/analyze-mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, type })
    });

    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.error("Mission Analysis Error:", error);
  }
  
  return null;
}
