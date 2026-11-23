import type {
  AuthResponse,
  Snack,
  SnacksResponse,
  DashboardSummary,
  ActivitiesResponse,
  CreateSnackData,
  UpdateSnackData,
  SnackFilters,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  public code: string;
  public status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('snack_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as { error?: { code?: string; message?: string } };
    throw new ApiError(
      errorData?.error?.message || 'An unexpected error occurred',
      errorData?.error?.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return data as T;
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: AuthResponse['user'] }>('/auth/me'),
};

// --- Snacks ---
function buildQueryString(filters: SnackFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sort) params.set('sort', filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const snacksApi = {
  list: (filters: SnackFilters = {}) =>
    request<SnacksResponse>(`/snacks${buildQueryString(filters)}`),

  get: (id: string) => request<Snack>(`/snacks/${id}`),

  summary: () => request<DashboardSummary>('/snacks/summary'),

  popular: () => request<{ snacks: Snack[] }>('/snacks/popular'),

  create: (data: CreateSnackData) =>
    request<Snack>('/snacks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateSnackData) =>
    request<Snack>(`/snacks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/snacks/${id}`, { method: 'DELETE' }),

  consume: (id: string, amount: number) =>
    request<Snack>(`/snacks/${id}/consume`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  restock: (id: string, amount: number) =>
    request<Snack>(`/snacks/${id}/restock`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  vote: (id: string) =>
    request<{ message: string; voteCount: number; userVoted: boolean }>(
      `/snacks/${id}/vote`,
      { method: 'POST' }
    ),

  unvote: (id: string) =>
    request<{ message: string; voteCount: number; userVoted: boolean }>(
      `/snacks/${id}/vote`,
      { method: 'DELETE' }
    ),

  activity: (params: { page?: number; limit?: number; action?: string; snackId?: string }) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    if (params.action) p.set('action', params.action);
    if (params.snackId) p.set('snackId', params.snackId);
    return request<ActivitiesResponse>(`/snacks/activity?${p.toString()}`);
  },
};

export { ApiError };
