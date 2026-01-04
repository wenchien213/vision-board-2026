
import { GoogleGenAI } from "@google/genai";

export async function generateVisionEncouragement(name: string, keywords: string[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `你是一位專業的生命教練。使用者名為「${name}」，他為 2026 年選擇了三個核心願景關鍵字：${keywords.join('、')}。
  請根據這三個詞彙，為他的 2026 年寫下一句強而有力、富有詩意且正向的鼓勵話語（大約 20-30 字）。
  輸出格式只需要包含那句話本身。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1000 }
      }
    });
    return response.text?.trim() || "你的 2026 將會是綻放無限光彩的一年。";
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes("quota")) {
      throw new Error("QUOTA_LIMIT");
    }
    return "勇往直前，宇宙會成為你的雙翼。";
  }
}

export async function generateVisionImage(keywords: string[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A minimalist, Japanese style artistic watercolor painting representing the themes of ${keywords.join(', ')}. Soft pastel colors, ethereal atmosphere, highly detailed, symbolic of hope and future.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
      }
    });
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes("quota")) {
      throw new Error("QUOTA_LIMIT");
    }
    return "";
  }
}
