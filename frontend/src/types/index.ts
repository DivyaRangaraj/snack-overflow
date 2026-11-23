// Core TypeScript types shared across the frontend

export type Role = 'ADMIN' | 'MEMBER';
export type Category = 'SWEET' | 'SAVOURY' | 'DRINK' | 'HEALTHY_ISH';
export type StockStatus = 'STOCKED' | 'RUNNING_LOW' | 'GONE';
export type ActionType = 'CONSUMED' | 'RESTOCKED';

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
