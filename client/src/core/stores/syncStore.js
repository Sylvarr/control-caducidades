import { create } from "zustand";
import { createStore } from "./middleware";
import { v4 as uuidv4 } from "uuid";
import OfflineDebugger from "../../shared/utils/debugger";

const DEFAULT_FILTERS = {
  status: null,
  entityType: null,
  operation: null,
  searchTerm: "",
  sortBy: "timestamp",
  sortOrder: "desc",
};

const DEFAULT_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000,
  batchSize: 5,
  syncInterval: 30000,
  autoSync: true,
};

const createSyncSlice = (set, get) => ({
  // Estado
  queue: [],
  stats: {
    total: 0,
    pending: 0,
    syncing: 0,
    synced: 0,
    error: 0,
    lastSync: null,
  },
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,
  isSyncing: false,
  config: DEFAULT_CONFIG,

  // Getters
  getFilteredQueue: () => {
    const { queue, filters } = get();
    let filtered = [...queue];

    // Aplicar filtros
    if (filters.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    if (filters.entityType) {
      filtered = filtered.filter(
        (item) => item.entityType === filters.entityType
      );
    }

    if (filters.operation) {
      filtered = filtered.filter(
        (item) => item.operation === filters.operation
      );
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.entityId.toLowerCase().includes(term) ||
          item.entityType.toLowerCase().includes(term)
      );
    }

    // Ordenar resultados
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        const order = filters.sortOrder === "asc" ? 1 : -1;

        if (typeof aValue === "string") {
          return aValue.localeCompare(bValue) * order;
        }
        return (aValue - bValue) * order;
      });
    }

    return filtered;
  },

  getStats: () => {
    const { queue } = get();
    return {
      total: queue.length,
      pending: queue.filter((item) => item.status === "pending").length,
      syncing: queue.filter((item) => item.status === "syncing").length,
      synced: queue.filter((item) => item.status === "synced").length,
      error: queue.filter((item) => item.status === "error").length,
      lastSync: get().stats.lastSync,
    };
  },

  getPendingCount: () => {
    return get().queue.filter((item) => item.status === "pending").length;
  },

  // Acciones
  addToQueue: (item) => {
    const newItem = {
      _id: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
      ...item,
    };

    set((state) => ({
      queue: [...state.queue, newItem],
      stats: get().getStats(),
    }));

    OfflineDebugger.log("SYNC_ITEM_ADDED", { item: newItem });
  },

  removeFromQueue: (id) => {
    set((state) => ({
      queue: state.queue.filter((item) => item._id !== id),
      stats: get().getStats(),
    }));

    OfflineDebugger.log("SYNC_ITEM_REMOVED", { id });
  },

  updateItem: (id, updates) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item._id === id ? { ...item, ...updates } : item
      ),
      stats: get().getStats(),
    }));

    OfflineDebugger.log("SYNC_ITEM_UPDATED", { id, updates });
  },

  startSync: async () => {
    const { queue, config, isSyncing } = get();
    if (isSyncing) return;

    set({ isSyncing: true });
    OfflineDebugger.log("SYNC_STARTED");

    try {
      const pendingItems = queue.filter(
        (item) => item.status === "pending" || item.status === "error"
      );

      for (let i = 0; i < pendingItems.length; i += config.batchSize) {
        const batch = pendingItems.slice(i, i + config.batchSize);
        await Promise.all(
          batch.map(async (item) => {
            try {
              // Marcar como sincronizando
              get().updateItem(item._id, { status: "syncing" });

              const response = await fetch(`/api/sync/${item.entityType}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  operation: item.operation,
                  entityId: item.entityId,
                  data: item.data,
                }),
              });

              if (!response.ok) throw new Error("Error en la sincronización");

              // Marcar como sincronizado
              get().updateItem(item._id, { status: "synced" });
            } catch (error) {
              const newRetryCount = item.retryCount + 1;
              const shouldRetry = newRetryCount < config.maxRetries;

              get().updateItem(item._id, {
                status: shouldRetry ? "pending" : "error",
                retryCount: newRetryCount,
                error: error.message,
              });

              if (shouldRetry) {
                await new Promise((resolve) =>
                  setTimeout(resolve, config.retryDelay)
                );
              }

              OfflineDebugger.error("SYNC_ITEM_ERROR", {
                id: item._id,
                error: error.message,
                retryCount: newRetryCount,
              });
            }
          })
        );
      }
    } catch (error) {
      set({ error: error.message });
      OfflineDebugger.error("SYNC_ERROR", { error: error.message });
    } finally {
      set((state) => ({
        isSyncing: false,
        stats: {
          ...state.stats,
          lastSync: new Date().toISOString(),
        },
      }));
      OfflineDebugger.log("SYNC_COMPLETED");
    }
  },

  pauseSync: () => {
    set({ isSyncing: false });
    OfflineDebugger.log("SYNC_PAUSED");
  },

  retryItem: async (id) => {
    const item = get().queue.find((item) => item._id === id);
    if (!item) return;

    get().updateItem(id, {
      status: "pending",
      retryCount: 0,
      error: null,
    });

    await get().startSync();
  },

  retryAllErrors: async () => {
    const { queue } = get();
    const errorItems = queue.filter((item) => item.status === "error");

    errorItems.forEach((item) => {
      get().updateItem(item._id, {
        status: "pending",
        retryCount: 0,
        error: null,
      });
    });

    await get().startSync();
  },

  clearSynced: () => {
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== "synced"),
      stats: get().getStats(),
    }));

    OfflineDebugger.log("SYNC_CLEARED_SYNCED");
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    OfflineDebugger.log("SYNC_FILTERS_UPDATED", { filters: newFilters });
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    OfflineDebugger.log("SYNC_FILTERS_CLEARED");
  },

  clearError: () => {
    set({ error: null });
  },

  updateConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));
    OfflineDebugger.log("SYNC_CONFIG_UPDATED", { config: newConfig });
  },
});

const useSyncStore = create(
  createStore(createSyncSlice, {
    name: "Sync Store",
  })
);

export default useSyncStore;
