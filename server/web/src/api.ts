export function getApiKey(): string {
  return localStorage.getItem('appicon-api-key') || 'default-dev-key';
}

export function setApiKey(key: string): void {
  localStorage.setItem('appicon-api-key', key);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'X-API-Key': getApiKey(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface IconItem {
  id: string;
  name: string;
  package_name: string | null;
  bundle_id: string | null;
  developer: string | null;
  category: string | null;
  tags: string[];
  files: Array<{ size: number; format: string }>;
  created_at: string;
  updated_at: string;
}

export interface IconDetail {
  id: string;
  name: string;
  packageName: string | null;
  bundleId: string | null;
  developer: string | null;
  category: string | null;
  tags: string[];
  icons: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalIcons: number;
  totalFiles: number;
  totalSize: number;
  categories: Array<{ category: string; count: number }>;
  recentIcons: Array<{ id: string; name: string; created_at: string }>;
}

export interface ApiKey {
  key: string;
  name: string;
  enabled: number;
  created_at: string;
}

export const api = {
  getStats: () => request<Stats>('/api/stats'),

  listIcons: (limit = 50, offset = 0) =>
    request<{ results: IconItem[]; total: number }>(`/api/icons-list?limit=${limit}&offset=${offset}`),

  searchIcons: (q: string, limit = 20) =>
    request<{ results: any[]; total: number }>(`/api/icons/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getIcon: (id: string) => request<IconDetail>(`/api/icons/${encodeURIComponent(id)}`),

  updateIcon: (id: string, data: any) =>
    request(`/api/icons/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteIcon: (id: string) =>
    request(`/api/icons/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  uploadIcon: (formData: FormData) =>
    request<{ id: string; name: string; sizes: number[]; message: string }>('/api/icons/upload', {
      method: 'POST',
      body: formData,
    }),

  listKeys: () => request<ApiKey[]>('/api/keys'),

  createKey: (name: string) =>
    request<ApiKey>('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  deleteKey: (key: string) =>
    request(`/api/keys/${encodeURIComponent(key)}`, { method: 'DELETE' }),
};
