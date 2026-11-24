import type {
  AuthResponse,
  Snack,
  SnacksResponse,
  DashboardSummary,
  ActivitiesResponse,
  CreateSnackData,
  UpdateSnackData,
  SnackFilters,
  SnackRequest,
  RequestsResponse,
  CreateRequestData,
  ApproveRequestData,
  DeclineRequestData,
  NotificationsResponse,
  Notification,
  RequestStatus,
  Category,
} from '../types';

const defaultApiUrl =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? 'https://snack-overflow-api-087z.onrender.com'
    : 'http://localhost:3001';

const rawBase = import.meta.env.VITE_API_URL || defaultApiUrl;
const API_BASE = (rawBase.startsWith('http://') || rawBase.startsWith('https://'))
  ? rawBase.replace(/\/+$/, '')
  : `https://${rawBase}`.replace(/\/+$/, '');

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

// --- Snack Requests ---
export const requestsApi = {
  create: (data: CreateRequestData) =>
    request<SnackRequest>('/snack-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  my: (params: { status?: RequestStatus | ''; page?: number; limit?: number } = {}) => {
    const p = new URLSearchParams();
    if (params.status) p.set('status', params.status);
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    const qs = p.toString();
    return request<RequestsResponse>(`/snack-requests/my${qs ? `?${qs}` : ''}`);
  },

  all: (params: {
    status?: RequestStatus | '';
    category?: Category | '';
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const p = new URLSearchParams();
    if (params.status) p.set('status', params.status);
    if (params.category) p.set('category', params.category);
    if (params.search) p.set('search', params.search);
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    const qs = p.toString();
    return request<RequestsResponse>(`/snack-requests${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => request<SnackRequest>(`/snack-requests/${id}`),

  approve: (id: string, data: ApproveRequestData) =>
    request<{ message: string; request: SnackRequest; snack: Snack }>(
      `/snack-requests/${id}/approve`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  decline: (id: string, data: DeclineRequestData) =>
    request<{ message: string; request: SnackRequest }>(
      `/snack-requests/${id}/decline`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),
};

// --- Notifications ---
export const notificationsApi = {
  list: (params: { unreadOnly?: boolean; page?: number; limit?: number } = {}) => {
    const p = new URLSearchParams();
    if (params.unreadOnly) p.set('unreadOnly', 'true');
    if (params.page) p.set('page', String(params.page));
    if (params.limit) p.set('limit', String(params.limit));
    const qs = p.toString();
    return request<NotificationsResponse>(`/notifications${qs ? `?${qs}` : ''}`);
  },

  markAsRead: (id: string) =>
    request<{ notification: Notification; unreadCount: number }>(
      `/notifications/${id}/read`,
      { method: 'PATCH' }
    ),

  markAllAsRead: () =>
    request<{ message: string; count: number; unreadCount: number }>(
      '/notifications/read-all',
      { method: 'PATCH' }
    ),
};

export { ApiError };
