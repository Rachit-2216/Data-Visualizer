// Database types matching Supabase schema

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Dataset {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DatasetVersion {
  id: string;
  dataset_id: string;
  user_id: string;
  version_number: number;
  file_path: string;
  file_type: 'csv' | 'parquet' | 'json' | 'tsv' | 'zip';
  file_size_bytes: number;
  row_count_est: number | null;
  column_count_est: number | null;
  status: 'uploaded' | 'profiling' | 'ready' | 'failed';
  created_at: string;
}

export interface DatasetProfile {
  id: string;
  dataset_version_id: string;
  user_id: string;
  profile_json: ProfileData;
  sample_preview_json: Record<string, unknown>[] | null;
  warnings_json: Warning[] | null;
  created_at: string;
}

export interface Chart {
  id: string;
  dataset_version_id: string;
  user_id: string;
  title: string;
  spec: VegaLiteSpec;
  created_at: string;
}

export interface Conversation {
  id: string;
  dataset_version_id: string | null;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  dataset_version_id: string | null;
  job_type: 'profile' | 'drift' | 'export';
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

// Imported types from other files (will be defined)
export interface ProfileData {
  schema: SchemaInfo;
  stats: DatasetStats;
  warnings: Warning[];
  charts: GeneratedChart[];
}

export interface SchemaInfo {
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  inferred_type: ColumnType;
  null_frac: number;
  unique_frac: number;
  sample_values: string[];
}

export type ColumnType =
  | 'numeric'
  | 'categorical'
  | 'datetime'
  | 'boolean'
  | 'text'
  | 'id';

export interface DatasetStats {
  row_count: number;
  column_count: number;
  memory_est_mb: number;
  duplicate_rows: number;
  duplicate_percentage: number;
}

export interface Warning {
  code: string;
  severity: 'low' | 'med' | 'high';
  message: string;
  columns?: string[];
}

export interface GeneratedChart {
  key: string;
  title: string;
  section: ChartSection;
  spec: VegaLiteSpec;
}

export type ChartSection =
  | 'summary'
  | 'missingness'
  | 'distributions'
  | 'correlations'
  | 'outliers'
  | 'categoricals'
  | 'target'
  | 'drift';

// Vega-Lite spec type (simplified)
export interface VegaLiteSpec {
  $schema?: string;
  title?: string | { text: string };
  description?: string;
  data?: { values?: unknown[]; url?: string; name?: string };
  mark?: string | { type: string; [key: string]: unknown };
  encoding?: {
    x?: EncodingChannel;
    y?: EncodingChannel;
    color?: EncodingChannel;
    size?: EncodingChannel;
    shape?: EncodingChannel;
    row?: EncodingChannel;
    column?: EncodingChannel;
    [key: string]: EncodingChannel | undefined;
  };
  layer?: VegaLiteSpec[];
  hconcat?: VegaLiteSpec[];
  vconcat?: VegaLiteSpec[];
  width?: number | 'container';
  height?: number | 'container';
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EncodingChannel {
  field?: string;
  type?: 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
  aggregate?: string;
  bin?: boolean | { maxbins?: number };
  scale?: Record<string, unknown>;
  axis?: Record<string, unknown> | null;
  legend?: Record<string, unknown> | null;
  title?: string | null;
  [key: string]: unknown;
}
