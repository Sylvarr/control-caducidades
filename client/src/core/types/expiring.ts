import { ProductState, ProductStatus } from "./product";

export interface ExpiringConfig {
  warningDays: number;
  criticalDays: number;
  checkFrontDate: boolean;
  checkStorageDate: boolean;
}

export interface ExpiringProduct extends ProductState {
  daysUntilExpiration: number;
  expirationStatus: "ok" | "warning" | "critical";
  expirationDate: string | null;
}

export interface ExpiringStats {
  total: number;
  warning: number;
  critical: number;
  byStatus: Record<
    ProductStatus,
    {
      total: number;
      warning: number;
      critical: number;
    }
  >;
}

export interface ExpiringStore {
  // Estado
  config: ExpiringConfig;
  stats: ExpiringStats;
  loading: boolean;
  error: string | null;

  // Getters
  getExpiringProducts: () => ExpiringProduct[];
  getExpiringByStatus: (status: ProductStatus) => ExpiringProduct[];
  getStats: () => ExpiringStats;

  // Acciones
  updateConfig: (config: Partial<ExpiringConfig>) => void;
  calculateExpiringProducts: (products: ProductState[]) => void;
  clearStats: () => void;
}

export interface ExpiringQuery {
  status?: ProductStatus;
  minDays?: number;
  maxDays?: number;
  sortBy?: "daysUntilExpiration" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
