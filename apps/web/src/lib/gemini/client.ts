import { GoogleGenerativeAI } from '@google/generative-ai';

let lastRequestAt = 0;
const minIntervalMs = 800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getGeminiModel(
  model:
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-001'
    | 'gemini-2.0-flash-lite'
    | 'gemini-2.0-flash-lite-001'
    | 'gemini-flash-latest'
    | 'gemini-flash-lite-latest'
    | 'gemini-pro-latest'
    | `models/${string}`,
  systemPrompt: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const now = Date.now();
  const waitFor = Math.max(0, minIntervalMs - (now - lastRequestAt));
  if (waitFor) {
    await sleep(waitFor);
  }
  lastRequestAt = Date.now();

  const genAI = new GoogleGenerativeAI(apiKey);
  const normalizedModel = model.startsWith('models/') ? model.replace(/^models\//, '') : model;
  return genAI.getGenerativeModel({
    model: normalizedModel,
    systemInstruction: systemPrompt,
  });
}
