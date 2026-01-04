
import { GoogleGenAI } from "@google/genai";

export async function generateVisionEncouragement(name: string, keywords: string[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `你是一位專業的生命教練。使用者名為「${name}」，他為 2026 年選擇了三個核心願景關鍵字：${keywords.join('、')}。
  請根據這三個詞彙，為他的 2026 年寫下一句強而有力、富有詩意且正向的鼓勵話語（大約 20-40 字）。
  輸出格式只需要包含那句話本身，不要有引號或額外說明。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "你的 2026 將會是充滿無限可能與光彩的一年。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "在智慧與行動中，你的 2026 將綻放出最璀璨的光芒。";
  }
}

export async function generateVisionImage(keywords: string[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A beautiful, minimalist Japanese-style concept art representing the keywords: ${keywords.join(', ')}. 
  The atmosphere should be calm, serene, and filled with soft, natural light. 
  Japanese aesthetic (Wabi-sabi), muted pastel colors, clean composition, high quality, artistic photography.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: prompt }],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error) {
    console.error("Image Generation Error:", error);
    return "";
  }
}
