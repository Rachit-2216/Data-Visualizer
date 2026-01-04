import { NextRequest } from 'next/server';
import { buildDatasetContext } from '@/lib/gemini/context-builder';
import { buildSystemPrompt } from '@/lib/gemini/prompts';
import { extractVegaLiteSpec } from '@/lib/gemini/chart-generator';
import { getGeminiModel } from '@/lib/gemini/client';
import type { ChatRequestPayload, StreamEvent } from '@/lib/gemini/types';

export const runtime = 'nodejs';

const encoder = new TextEncoder();

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequestPayload;
  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
  }

  const datasetContext = buildDatasetContext(body.datasetContext ?? null);
  const systemPrompt = buildSystemPrompt(datasetContext);
  const preferredModel =
    body.model ?? (process.env.GEMINI_MODEL as ChatRequestPayload['model']) ?? 'gemini-2.0-flash';
  const fallbackModels: ChatRequestPayload['model'][] = [
    preferredModel,
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ];

  let stream: AsyncIterable<{ text(): string }> | null = null;
  let lastError: string | null = null;
  let chosenModel: ChatRequestPayload['model'] | null = null;
  const history = (body.history ?? []).map((item) => ({
    role: item.role,
    parts: [{ text: item.content }],
  }));

  for (const candidate of fallbackModels) {
    try {
      const model = await getGeminiModel(candidate, systemPrompt);
      const result = await model.generateContentStream({
        contents: [...history, { role: 'user', parts: [{ text: message }] }],
      });
      stream = result.stream;
      chosenModel = candidate;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Failed to initialize Gemini response';
      if (!lastError.includes('not found') && !lastError.includes('404')) {
        break;
      }
    }
  }

  if (!stream) {
    const fallbackMessage = lastError ?? 'Gemini model unavailable';
    const isQuota =
      fallbackMessage.includes('429') ||
      fallbackMessage.toLowerCase().includes('quota') ||
      fallbackMessage.toLowerCase().includes('rate limit');
    const hint = isQuota
      ? 'Quota exceeded. Enable billing or wait for the quota window to reset.'
      : 'Model not available for this API key. Check /api/chat/models.';
    return new Response(JSON.stringify({ error: `${fallbackMessage} ${hint}` }), { status: 500 });
  }

  const readable = new ReadableStream({
    async start(controller) {
      let fullText = '';
      try {
        for await (const chunk of stream) {
          const delta = chunk.text();
          if (!delta) continue;
          fullText += delta;
          const event: StreamEvent = { type: 'delta', text: delta };
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
        const { cleanedText, spec } = extractVegaLiteSpec(fullText);
        const doneEvent: StreamEvent = {
          type: 'done',
          text: cleanedText,
          chartSpec: spec,
        };
        controller.enqueue(encoder.encode(`${JSON.stringify(doneEvent)}\n`));
      } catch (error) {
        const event: StreamEvent = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Stream error',
        };
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}
