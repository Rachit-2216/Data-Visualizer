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
  model?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; chartSpec?: Record<string, unknown> | null }
  | { type: 'error'; message: string };
