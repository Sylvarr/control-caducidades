import { create } from "zustand";
import { createStore } from "./middleware";
import OfflineDebugger from "../../shared/utils/debugger";

const DEFAULT_FILTERS = {
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Última semana
    end: new Date().toISOString(),
  },
  status: null,
  location: null,
};

const createStatsSlice = (set, get) => ({
  // Estado
  stats: null,
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  // Getters
  getStats: () => get().stats,

  getProductStats: () => get().stats?.products || null,

  getExpirationStats: () => get().stats?.expiration || null,

  getSyncStats: () => get().stats?.sync || null,

  getUserStats: () => get().stats?.users || null,

  // Acciones
  fetchStats: async (filters = {}) => {
    const currentFilters = { ...get().filters, ...filters };
    set({ loading: true });

    try {
      // Construir query params
      const params = new URLSearchParams();
      if (currentFilters.timeRange) {
        params.append("start", currentFilters.timeRange.start);
        params.append("end", currentFilters.timeRange.end);
      }
      if (currentFilters.status) {
        params.append("status", currentFilters.status);
      }
      if (currentFilters.location) {
        params.append("location", currentFilters.location);
      }

      const response = await fetch(`/api/stats?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar estadísticas");

      const stats = await response.json();
      set({
        stats,
        loading: false,
        error: null,
      });

      OfflineDebugger.log("STATS_FETCHED", {
        filters: currentFilters,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      set({
        loading: false,
        error: error.message,
      });
      OfflineDebugger.error("STATS_FETCH_ERROR", {
        error: error.message,
        filters: currentFilters,
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    OfflineDebugger.log("STATS_FILTERS_UPDATED", { filters: newFilters });
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    OfflineDebugger.log("STATS_FILTERS_CLEARED");
  },

  clearStats: () => {
    set({ stats: null });
    OfflineDebugger.log("STATS_CLEARED");
  },

  clearError: () => {
    set({ error: null });
  },
});

const useStatsStore = create(
  createStore(createStatsSlice, {
    name: "Stats Store",
  })
);

export default useStatsStore;
