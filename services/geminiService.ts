
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { UrlContextMetadataItem } from '../types';

// IMPORTANT: The API key MUST be set as an environment variable `process.env.API_KEY`
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI;

// Model supporting URL context
const MODEL_NAME = "gemini-2.5-flash"; 

const SYSTEM_INSTRUCTION = `Anda adalah asisten virtual resmi untuk Manasik Haji (Kemenhaj Kota Gorontalo).
Tugas Anda adalah memberikan jawaban yang akurat, ramah, dan menenangkan berdasarkan dataset yang disediakan.

ATURAN PENTING:
1. Gunakan informasi HANYA dari dokumen yang diakses melalui urlContext.
2. Setiap jawaban WAJIB menyertakan referensi di bagian paling akhir.
3. Format referensi di akhir jawaban adalah: "REFERENSI: [Judul Bab/Sub-judul] - Halaman [Nomor Halaman]".
4. JANGAN menampilkan link URL mentah (seperti github raw) kepada pengguna.
5. Jika informasi tidak ditemukan dalam dataset, katakan dengan sopan bahwa Anda tidak memiliki data tersebut dan sarankan untuk berkonsultasi dengan pembimbing haji resmi.`;

const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) {
    console.error("API_KEY is not set in environment variables. Please set process.env.API_KEY.");
    throw new Error("Gemini API Key not configured. Set process.env.API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const generateContentWithUrlContext = async (
  prompt: string,
  urls: string[]
): Promise<GeminiResponse> => {
  const currentAi = getAiInstance();
  
  let fullPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt = `${prompt}\n\nRelevant URLs for context (Read content from here):\n${urlList}`;
  }

  const tools: Tool[] = [{ urlContext: {} }];
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    const candidate = response.candidates?.[0];
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if (candidate && candidate.urlContextMetadata && candidate.urlContextMetadata.urlMetadata) {
      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata as UrlContextMetadataItem[];
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Gagal mendapatkan respon: ${error.message}`);
    }
    throw new Error("Gagal mendapatkan respon karena error yang tidak diketahui.");
  }
};

export const getInitialSuggestions = async (urls: string[]): Promise<GeminiResponse> => {
  if (urls.length === 0) {
    return { text: JSON.stringify({ suggestions: ["Tanyakan tentang syarat haji", "Apa itu Thawaf?", "Urutan Manasik"] }) };
  }
  const currentAi = getAiInstance();
  const urlList = urls.join('\n');
  
  const promptText = `Berdasarkan isi dokumen manasik haji di bawah ini, berikan 3-4 pertanyaan singkat yang paling sering ditanyakan oleh jamaah haji pemula. Kembalikan HANYA objek JSON dengan kunci "suggestions".

URLs:
${urlList}`;

  const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: "Anda adalah pakar Manasik Haji. Berikan saran pertanyaan dalam bahasa Indonesia yang baku namun mudah dimengerti.",
        safetySettings: safetySettings,
        responseMimeType: "application/json",
      },
    });

    return { text: response.text };

  } catch (error) {
    console.error("Error calling Gemini API for suggestions:", error);
    return { text: JSON.stringify({ suggestions: ["Tata cara Umrah", "Rukun Haji", "Larangan Ihram"] }) };
  }
};
