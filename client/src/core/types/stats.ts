import { ProductStatus } from "./product";

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  byStatus: Record<ProductStatus, number>;
  byLocation: {
    almacen: number;
    nevera: number;
  };
}

export interface ExpirationStats {
  total: number;
  warning: number;
  critical: number;
  expired: number;
  byStatus: Record<
    ProductStatus,
    {
      warning: number;
      critical: number;
      expired: number;
    }
  >;
}

export interface SyncStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  lastSync: string | null;
}

export interface UserStats {
  total: number;
  active: number;
  byRole: {
    admin: number;
    manager: number;
    employee: number;
  };
  lastActive: string | null;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface DashboardStats {
  products: ProductStats;
  expiration: ExpirationStats;
  sync: SyncStats;
  users: UserStats;
  timeRange: TimeRange;
  lastUpdated: string;
}

export interface StatsFilters {
  timeRange?: TimeRange;
  status?: ProductStatus;
  location?: "almacen" | "nevera";
}

export interface StatsStore {
  // Estado
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  filters: StatsFilters;

  // Getters
  getStats: () => DashboardStats | null;
  getProductStats: () => ProductStats;
  getExpirationStats: () => ExpirationStats;
  getSyncStats: () => SyncStats;
  getUserStats: () => UserStats;

  // Acciones
  fetchStats: (filters?: StatsFilters) => Promise<void>;
  setFilters: (filters: Partial<StatsFilters>) => void;
  clearFilters: () => void;
  clearStats: () => void;
  clearError: () => void;
}

export interface StatsQuery {
  timeRange?: TimeRange;
  groupBy?: "day" | "week" | "month";
  status?: ProductStatus;
  location?: "almacen" | "nevera";
}
