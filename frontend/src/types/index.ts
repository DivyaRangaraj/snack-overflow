// Core TypeScript types shared across the frontend

export type Role = 'ADMIN' | 'MEMBER';
export type Category = 'SWEET' | 'SAVOURY' | 'DRINK' | 'HEALTHY_ISH';
export type StockStatus = 'STOCKED' | 'RUNNING_LOW' | 'GONE';
export type ActionType = 'CONSUMED' | 'RESTOCKED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED';
export type NotificationType = 'REQUEST_SUBMITTED' | 'REQUEST_APPROVED' | 'REQUEST_DECLINED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Snack {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
  stockStatus: StockStatus;
  voteCount: number;
  userVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  snackId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  snackId: string;
  action: ActionType;
  amount: number;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  snack: Pick<Snack, 'id' | 'name' | 'category'> & { imageUrl?: string | null };
}

export interface PaginationMeta {
  total: number;
  overallTotal?: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SnacksResponse {
  snacks: Snack[];
  pagination: PaginationMeta;
}

export interface ActivitiesResponse {
  activities: Activity[];
  pagination: PaginationMeta;
}

export interface DashboardSummary {
  totalTypes: number;
  stocked: number;
  runningLow: number;
  gone: number;
  totalUnits: number;
  snackOfTheWeek: (Snack & { weeklyVotes: number; totalVotes: number }) | null;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface SnackFilters {
  search?: string;
  category?: Category | '';
  status?: StockStatus | '';
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateSnackData {
  name: string;
  category: Category;
  quantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
}

export interface UpdateSnackData {
  name?: string;
  category?: Category;
  quantity?: number;
  lowStockThreshold?: number;
  imageUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Snack Request types
export interface SnackRequest {
  id: string;
  userId: string;
  snackName: string;
  category: Category;
  reason: string | null;
  status: RequestStatus;
  adminId: string | null;
  adminResponse: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: Pick<User, 'id' | 'name' | 'email'>;
  admin?: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface RequestsResponse {
  requests: SnackRequest[];
  counts?: {
    pending: number;
  };
  pagination: PaginationMeta;
}

export interface CreateRequestData {
  snackName: string;
  category: Category;
  reason?: string;
}

export interface ApproveRequestData {
  quantity?: number;
  lowStockThreshold?: number;
}

export interface DeclineRequestData {
  reason: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  requestId: string | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  request?: Pick<SnackRequest, 'id' | 'snackName' | 'status' | 'category'> | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: PaginationMeta;
}
