import { GoogleGenAI, Type, Schema } from "@google/genai";

// Helpers
const fileToGenerativePart = async (url: string): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  const response = await fetch(url);
  const blob = await response.blob();

  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(blob);
  });

  return {
    inlineData: {
      data: base64 as string,
      mimeType: blob.type,
    },
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiService {
  public apiKey: string;
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  /** Validate API key */
  async validateKey(): Promise<boolean> {
    try {
      await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
      });
      return true;
    } catch (e) {
      console.error("Key validation failed", e);
      return false;
    }
  }

  /** TEXT GENERATION */
  async generateText(prompt: string): Promise<string> {
    const resp = await this.withOverloadRetry(() =>
      this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      })
    );

    return resp.text || "";
  }

  /** IMAGE GENERATION — fixed */
  async generateImage(prompt: string): Promise<string> {
    const resp: any = await this.withOverloadRetry(() =>
      this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      })
    );

    /* Gemini image responses appear in different places depending on model + SDK version */
    const parts =
      resp?.candidates?.[0]?.content?.parts ||
      resp?.candidates?.[0]?.content ||
      resp?.parts ||
      [];

    const img = parts.find((p: any) => p.inlineData);

    if (!img) {
      throw new Error("No image returned. Your key may not have image-generation access.");
    }

    return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
  }

  /** Retry 503 overload */
  private async withOverloadRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.error?.status || err?.status || err?.code;
      if (status === "UNAVAILABLE" || status === 503) {
        console.warn("⚠️ Model overloaded — retrying…");
        await sleep(800);
        return await fn();
      }
      throw err;
    }
  }

  /** JUDGING MODEL (Text or Image similarity) */
  async calculateSimilarity(
    target: string,
    generated: string,
    type: "text" | "image"
  ): Promise<{ score: number; reasoning: string }> {
    const judgeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
      },
      required: ["score", "reasoning"],
    };

    /* -------- TEXT SIMILARITY -------- */
    if (type === "text") {
      const prompt = `
        Evaluate similarity between TARGET and GENERATED.
        Score 0–100.
        Be strict and explain briefly.

        TARGET:
        """${target}"""

        GENERATED:
        """${generated}"""
      `;

      const resp = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: judgeSchema,
        },
      });

      const json = JSON.parse(resp.text || "{}");
      return { score: json.score || 0, reasoning: json.reasoning || "Failed to judge." };
    }

    /* -------- IMAGE SIMILARITY -------- */
    const targetImg = await fileToGenerativePart(target);

    const base64Generated = generated.replace(/^data:image\/\w+;base64,/, "");
    const genImg = {
      inlineData: {
        data: base64Generated,
        mimeType: "image/png",
      },
    };

    const prompt = `
      Compare these two images:
      - Image 1: TARGET
      - Image 2: GENERATED
      Score 0–100 based on similarity in composition, colors, objects, and style.
      Be strict.
    `;

    const resp = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [targetImg, genImg, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: judgeSchema,
      },
    });

    const json = JSON.parse(resp.text || "{}");
    return { score: json.score || 0, reasoning: json.reasoning || "Failed to judge." };
  }

  /** PHRASE SIMILARITY - For sub-round challenges */
  async calculatePhraseSimilarity(
    targetPhrase: string,
    generated: string
  ): Promise<{ score: number; reasoning: string }> {
    const judgeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
      },
      required: ["score", "reasoning"],
    };

    const prompt = `
      You are judging a prompt engineering challenge.
      
      The player needed to make an AI output this EXACT TARGET PHRASE:
      "${targetPhrase}"
      
      The AI actually generated this output:
      """${generated}"""
      
      Score from 0-100 based on these criteria:
      - 100: The exact phrase appears verbatim in the output
      - 80-99: The phrase appears with very minor variations (punctuation, capitalization)
      - 50-79: The meaning is conveyed but wording is different
      - 20-49: Partially related content
      - 0-19: Completely unrelated
      
      Look specifically for the phrase "${targetPhrase}" in the generated output.
      Be strict but fair. The goal is to find this exact phrase or very close variations.
    `;

    const resp = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: judgeSchema,
      },
    });

    const json = JSON.parse(resp.text || "{}");
    return { score: json.score || 0, reasoning: json.reasoning || "Failed to judge." };
  }

  /** ASCII ART IMAGE COMPARISON using Canvas API */
  async compareAsciiArtImage(
    targetImageUrl: string,
    generatedAsciiText: string
  ): Promise<{ score: number; reasoning: string }> {
    const judgeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
      },
      required: ["score", "reasoning"],
    };

    const targetImg = await fileToGenerativePart(targetImageUrl);

    const prompt = `
      You are judging an ASCII art generation challenge.
      
      The player was shown an ASCII art image (provided) and needed to prompt an AI to generate similar ASCII art in text form.
      
      The AI generated this ASCII art text:
      """
      ${generatedAsciiText}
      """
      
      Compare the generated ASCII text art to the target image and score from 0-100:
      - 100: Perfect match - the ASCII art perfectly recreates the image's structure and details
      - 80-99: Excellent - captures all major elements and structure with minor differences
      - 60-79: Good - recognizably similar with main features present
      - 40-59: Fair - some similarity but missing key elements or structure
      - 20-39: Poor - vaguely related but major differences
      - 0-19: No match - completely different or not ASCII art
      
      Consider:
      - Overall structure and composition
      - Key visual elements and details
      - Character usage and density
      - Artistic style and technique
      
      Be strict but fair.
    `;

    const resp = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [targetImg, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: judgeSchema,
      },
    });

    const json = JSON.parse(resp.text || "{}");
    return { score: json.score || 0, reasoning: json.reasoning || "Failed to judge." };
  }

  /** HTML COMPARISON - For Round 3 website replication */
  async compareHtml(
    targetHtml: string,
    generatedHtml: string
  ): Promise<{ score: number; reasoning: string }> {
    const judgeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
      },
      required: ["score", "reasoning"],
    };

    const prompt = `
      You are judging an HTML website replication challenge.
      
      TARGET: The player needed to replicate the frontend of dtu.ac.in website.
      
      GENERATED HTML:
      """
      ${generatedHtml}
      """
      
      Score from 0-100 based on these criteria:
      - Structure (0-30): HTML semantic elements, proper nesting, organization
      - Styling (0-30): CSS styling, layout, responsive design, colors
      - Content (0-20): Text content, images, links present
      - Animations (0-20): CSS animations, transitions, interactive elements
      
      Be strict but fair. This is testing their ability to replicate a professional website's frontend.
      
      Return a score from 0-100 and detailed reasoning.
    `;

    const resp = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: judgeSchema,
      },
    });

    const json = JSON.parse(resp.text || "{}");
    return { score: json.score || 0, reasoning: json.reasoning || "Failed to judge." };
  }
}
