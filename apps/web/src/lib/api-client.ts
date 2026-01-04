'use client';

import { createClient } from '@/lib/supabase/client';

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8001';

const buildHeaders = async (hasBody: boolean, contentType?: string) => {
  const headers = new Headers();
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  if (hasBody && contentType) {
    headers.set('Content-Type', contentType);
  }

  return headers;
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const hasBody = !!options.body && !(options.body instanceof FormData);
  const headers = await buildHeaders(hasBody, 'application/json');
  const mergedHeaders = new Headers(options.headers ?? {});
  headers.forEach((value, key) => mergedHeaders.set(key, value));

  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
}

export async function apiJson<T>(path: string, options: RequestInit = {}) {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function apiUpload<T>(path: string, formData: FormData) {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = await buildHeaders(false);
  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload failed: ${response.status}`);
      }
      return (await response.json()) as T;
    });
}

