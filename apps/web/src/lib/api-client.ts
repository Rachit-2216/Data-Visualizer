'use client';

import { createClient } from '@/lib/supabase/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8001';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const parseError = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return { message: `Request failed: ${response.status}`, code: undefined };
  }

  try {
    const parsed = JSON.parse(text) as { detail?: string; message?: string; code?: string };
    return {
      message: parsed.detail ?? parsed.message ?? text,
      code: parsed.code,
    };
  } catch {
    return { message: text, code: undefined };
  }
};

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async resolveAuthHeader() {
    if (this.token) {
      return `Bearer ${this.token}`;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        return `Bearer ${session.access_token}`;
      }
    } catch {
      return null;
    }

    return null;
  }

  private async buildHeaders(options: RequestInit, contentType?: string) {
    const headers = new Headers(options.headers ?? {});
    const authHeader = await this.resolveAuthHeader();
    if (authHeader && !headers.has('Authorization')) {
      headers.set('Authorization', authHeader);
    }
    if (contentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', contentType);
    }
    return headers;
  }

  async fetchRaw(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const hasBody = !!options.body && !(options.body instanceof FormData);
    const headers = await this.buildHeaders(options, hasBody ? 'application/json' : undefined);
    return fetch(url, { ...options, headers });
  }

  async requestJson<T>(endpoint: string, options: RequestInit = {}) {
    const response = await this.fetchRaw(endpoint, options);
    if (!response.ok) {
      const parsed = await parseError(response);
      throw new ApiError(parsed.message, response.status, parsed.code);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  async upload<T>(endpoint: string, formData: FormData) {
    const response = await this.fetchRaw(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const parsed = await parseError(response);
      throw new ApiError(parsed.message, response.status, parsed.code);
    }
    return (await response.json()) as T;
  }

  async *streamRequest(endpoint: string, body: object) {
    const response = await this.fetchRaw(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const parsed = await parseError(response);
      throw new ApiError(parsed.message, response.status, parsed.code);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiError('No response body', 500);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
        try {
          const data = JSON.parse(payload);
          yield data as { type: string; content?: string; spec?: object; message?: string };
        } catch {
          // Ignore malformed chunks
        }
      }
    }
  }

  async getProjects() {
    return this.requestJson<{ projects: ApiProject[] }>('/api/projects');
  }

  async createProject(payload: { name: string; description?: string }) {
    return this.requestJson<{ project: ApiProject }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProject(projectId: string) {
    return this.requestJson<{ success: boolean }>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async listProjectDatasets(projectId: string) {
    return this.requestJson<{ datasets: ApiDataset[] }>(`/api/projects/${projectId}/datasets`);
  }

  async createDataset(projectId: string, payload: ApiDatasetCreate) {
    return this.requestJson<{ dataset: ApiDataset }>(`/api/projects/${projectId}/datasets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listDatasetVersions(datasetId: string) {
    return this.requestJson<{ versions: ApiDatasetVersion[] }>(`/api/datasets/${datasetId}/versions`);
  }

  async uploadDataset(datasetId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.upload<{ dataset_version_id: string; job_id: string | null }>(
      `/api/datasets/${datasetId}/upload`,
      formData
    );
  }

  async getProfile(versionId: string) {
    return this.requestJson<{ profile: ApiDatasetProfile | null }>(
      `/api/datasets/versions/${versionId}/profile`
    );
  }

  async getJob(jobId: string) {
    return this.requestJson<{ job: ApiJob }>(`/api/jobs/${jobId}`);
  }

  async listSavedVisuals(projectId: string) {
    return this.requestJson<{ visualizations: ApiSavedVisualization[] }>(
      `/api/visuals/saved?project_id=${projectId}`
    );
  }

  async saveVisualization(payload: ApiVisualizationCreate) {
    return this.requestJson<{ visualization: ApiSavedVisualization }>('/api/visuals/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getConversations() {
    return this.requestJson<{ conversations: ApiConversation[] }>('/api/chat/conversations');
  }

  async createConversation(payload: ApiConversationCreate) {
    return this.requestJson<{ conversation: ApiConversation }>('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMessages(conversationId: string) {
    return this.requestJson<{ messages: ApiChatMessage[] }>(
      `/api/chat/conversations/${conversationId}/messages`
    );
  }

  chatStream(conversationId: string, content: string, datasetVersionId?: string) {
    return this.streamRequest(`/api/chat/conversations/${conversationId}/messages`, {
      content,
      dataset_version_id: datasetVersionId,
    });
  }

  quickChatStream(content: string, datasetVersionId?: string) {
    return this.streamRequest('/api/chat', {
      content,
      dataset_version_id: datasetVersionId,
    });
  }
}

export const apiClient = new ApiClient();

export async function apiFetch(path: string, options: RequestInit = {}) {
  return apiClient.fetchRaw(path, options);
}

export async function apiJson<T>(path: string, options: RequestInit = {}) {
  return apiClient.requestJson<T>(path, options);
}

export async function apiUpload<T>(path: string, formData: FormData) {
  return apiClient.upload<T>(path, formData);
}

export type ApiProject = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  is_demo: boolean;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ApiDataset = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  file_type: string;
  original_filename: string | null;
  created_at: string;
  updated_at: string;
  dataset_versions?: ApiDatasetVersion[];
};

export type ApiDatasetVersion = {
  id: string;
  row_count_est?: number | null;
  column_count_est?: number | null;
  row_count?: number | null;
  column_count?: number | null;
  created_at: string;
};

export type ApiDatasetProfile = {
  profile_json: {
    dataset?: Record<string, unknown>;
    schema?: { columns?: Array<{ name: string; inferred_type?: string }> };
    stats?: Record<string, unknown>;
    missing?: Record<string, unknown>;
    warnings?: Array<{ severity?: string; message?: string }>;
  };
  sample_preview_json: Array<Record<string, unknown>>;
};

export type ApiDatasetCreate = {
  name: string;
  file_type?: string;
  original_filename?: string;
  description?: string | null;
};

export type ApiJob = {
  id: string;
  status: string;
};

export type ApiSavedVisualization = {
  id: string;
  project_id: string;
  dataset_version_id: string | null;
  name: string;
  description: string | null;
  chart_type: string;
  vega_spec: Record<string, unknown>;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiVisualizationCreate = {
  project_id: string;
  dataset_version_id?: string | null;
  name: string;
  chart_type: string;
  vega_spec: Record<string, unknown>;
  description?: string | null;
};

export type ApiConversation = {
  id: string;
  user_id: string;
  project_id: string;
  dataset_version_id: string | null;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type ApiConversationCreate = {
  project_id: string;
  dataset_version_id?: string | null;
};

export type ApiChatMessage = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chart_spec: Record<string, unknown> | null;
  created_at: string;
};
