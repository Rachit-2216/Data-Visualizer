import { NextRequest } from 'next/server';
import { buildDatasetContext } from '@/lib/groq/context-builder';
import { buildSystemPrompt } from '@/lib/groq/prompts';
import { extractVegaLiteSpec } from '@/lib/groq/chart-generator';
import type { ChatRequestPayload, StreamEvent } from '@/lib/groq/types';

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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), { status: 500 });
  }

  const model = body.model ?? process.env.GROQ_MODEL ?? 'llama-3.1-70b-versatile';
  const history = (body.history ?? []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    const hint = response.status === 429 ? 'Rate limit reached. Try again later.' : 'Check GROQ_API_KEY and model name.';
    return new Response(JSON.stringify({ error: `${text || 'Groq request failed'}. ${hint}` }), {
      status: response.status || 500,
    });
  }

  const readable = new ReadableStream({
    async start(controller) {
      let fullText = '';
      try {
        const reader = response.body.getReader();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += new TextDecoder().decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const payload = trimmed.replace(/^data:\s*/, '');
            if (payload === '[DONE]') {
              buffer = '';
              break;
            }
            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (!delta) continue;
              fullText += delta;
              const event: StreamEvent = { type: 'delta', text: delta };
              controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            } catch {
              // ignore malformed chunks
            }
          }
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
