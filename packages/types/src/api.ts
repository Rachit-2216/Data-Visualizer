// API request/response types

import type { Project, Dataset, DatasetVersion, Chart, Job } from './database';
import type { FullProfile } from './profile';
import type { ChartIntent, GeneratedChartData } from './chart';

// Projects
export interface CreateProjectRequest {
  name: string;
}

export interface CreateProjectResponse {
  project: Project;
}

// Datasets
export interface CreateDatasetRequest {
  project_id: string;
  name: string;
  description?: string;
}

export interface CreateDatasetResponse {
  dataset: Dataset;
}

// Upload
export interface GetUploadUrlRequest {
  dataset_id: string;
  filename: string;
  content_type: string;
  file_size: number;
}

export interface GetUploadUrlResponse {
  upload_url: string;
  storage_path: string;
  expires_at: string;
}

export interface CommitUploadRequest {
  dataset_id: string;
  storage_path: string;
  file_type: string;
  file_size: number;
}

export interface CommitUploadResponse {
  version: DatasetVersion;
  job: Job;
}

// Profile
export interface GetProfileResponse {
  profile: FullProfile;
  charts: GeneratedChartData[];
}

export interface GetProfileStatusResponse {
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  error?: string;
}

// Charts
export interface ListChartsResponse {
  charts: Chart[];
}

export interface CreateChartRequest {
  dataset_version_id: string;
  title: string;
  spec: Record<string, unknown>;
}

export interface CreateChartResponse {
  chart: Chart;
}

export interface GenerateChartRequest {
  dataset_version_id: string;
}

export interface GenerateChartResponse {
  charts: GeneratedChartData[];
}

// Chat
export interface ChatRequest {
  message: string;
  dataset_version_id: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  chart_intent?: ChartIntent;
  chart_spec?: Record<string, unknown>;
  suggestions?: string[];
  conversation_id: string;
}

// Sandbox (if server-side execution)
export interface ExecuteCodeRequest {
  code: string;
  dataset_version_id: string;
}

export interface ExecuteCodeResponse {
  output: string;
  error?: string;
  variables?: Record<string, unknown>;
  execution_time_ms: number;
}

// Jobs
export interface GetJobStatusResponse {
  job: Job;
}

// Error response
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
