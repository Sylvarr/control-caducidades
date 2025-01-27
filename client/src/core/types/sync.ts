export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export type SyncOperation = "create" | "update" | "delete" | "move";

export interface SyncItem {
  _id: string;
  operation: SyncOperation;
  entityType: string;
  entityId: string;
  data: any;
  timestamp: string;
  retryCount: number;
  status: SyncStatus;
  error?: string;
}

export interface SyncStats {
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  error: number;
  lastSync: string | null;
}

export interface SyncFilters {
  status?: SyncStatus;
  entityType?: string;
  operation?: SyncOperation;
  searchTerm?: string;
  sortBy?: "timestamp" | "retryCount";
  sortOrder?: "asc" | "desc";
}

export interface SyncStore {
  // Estado
  queue: SyncItem[];
  stats: SyncStats;
  loading: boolean;
  error: string | null;
  filters: SyncFilters;
  isSyncing: boolean;

  // Getters
  getFilteredQueue: () => SyncItem[];
  getStats: () => SyncStats;
  getPendingCount: () => number;

  // Acciones
  addToQueue: (
    item: Omit<SyncItem, "_id" | "timestamp" | "retryCount" | "status">
  ) => void;
  removeFromQueue: (id: string) => void;
  updateItem: (id: string, updates: Partial<SyncItem>) => void;
  startSync: () => Promise<void>;
  pauseSync: () => void;
  retryItem: (id: string) => Promise<void>;
  retryAllErrors: () => Promise<void>;
  clearSynced: () => void;
  setFilters: (filters: Partial<SyncFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
  autoSync: boolean;
}

export interface SyncHook {
  // Estado
  queue: SyncItem[];
  stats: SyncStats;
  loading: boolean;
  error: string | null;
  filters: SyncFilters;
  isSyncing: boolean;
  config: SyncConfig;

  // Acciones
  addToQueue: (
    item: Omit<SyncItem, "_id" | "timestamp" | "retryCount" | "status">
  ) => void;
  removeFromQueue: (id: string) => void;
  updateItem: (id: string, updates: Partial<SyncItem>) => void;
  startSync: () => Promise<void>;
  pauseSync: () => void;
  retryItem: (id: string) => Promise<void>;
  retryAllErrors: () => Promise<void>;
  clearSynced: () => void;
  setFilters: (filters: Partial<SyncFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
  updateConfig: (config: Partial<SyncConfig>) => void;
}
