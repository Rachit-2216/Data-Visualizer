export type DatasetContext = {
  name: string;
  rowCount: number;
  columnCount: number;
  schema: Array<{ name: string; type: string }>;
  stats: Record<string, unknown>;
  sampleRows: Array<Record<string, unknown>>;
  warnings: Array<{ severity: string; message: string }>;
};

export type ChatRequestPayload = {
  message: string;
  datasetContext?: DatasetContext | null;
  conversationId?: string | null;
  model?:
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-001'
    | 'gemini-2.0-flash-lite'
    | 'gemini-2.0-flash-lite-001'
    | 'gemini-flash-latest'
    | 'gemini-flash-lite-latest'
    | 'gemini-pro-latest'
    | `models/${string}`;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; chartSpec?: Record<string, unknown> | null }
  | { type: 'error'; message: string };
