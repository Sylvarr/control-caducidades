import { create } from "zustand";
import { createStore } from "./middleware";
import OfflineDebugger from "../../shared/utils/debugger";

// Configuración por defecto
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutos
const DEFAULT_STALE_TIME = 30 * 1000; // 30 segundos
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 segundo

const createQuerySlice = (set, get) => ({
  // Estado
  queries: new Map(),
  cache: new Map(),
  subscribers: new Map(),

  // Getters
  getQueryState: (queryKey) => {
    return (
      get().queries.get(queryKey) || {
        status: "idle",
        data: undefined,
        error: null,
        timestamp: 0,
        retryCount: 0,
      }
    );
  },

  getCacheEntry: (queryKey) => {
    return get().cache.get(queryKey);
  },

  // Acciones
  setQueryState: (queryKey, state) => {
    set((store) => {
      const queries = new Map(store.queries);
      queries.set(queryKey, { ...store.getQueryState(queryKey), ...state });
      return { queries };
    });

    // Notificar a los suscriptores
    get().notifySubscribers(queryKey);
  },

  setCacheEntry: (queryKey, data, options = {}) => {
    const timestamp = Date.now();
    set((store) => {
      const cache = new Map(store.cache);
      cache.set(queryKey, {
        data,
        timestamp,
        staleTime: options.staleTime || DEFAULT_STALE_TIME,
        cacheTime: options.cacheTime || DEFAULT_CACHE_TIME,
      });
      return { cache };
    });
  },

  // Suscripciones
  subscribe: (queryKey, callback) => {
    set((store) => {
      const subscribers = new Map(store.subscribers);
      const querySubscribers = subscribers.get(queryKey) || new Set();
      querySubscribers.add(callback);
      subscribers.set(queryKey, querySubscribers);
      return { subscribers };
    });

    // Retornar función de limpieza
    return () => {
      set((store) => {
        const subscribers = new Map(store.subscribers);
        const querySubscribers = subscribers.get(queryKey);
        if (querySubscribers) {
          querySubscribers.delete(callback);
          if (querySubscribers.size === 0) {
            subscribers.delete(queryKey);
          }
        }
        return { subscribers };
      });
    };
  },

  notifySubscribers: (queryKey) => {
    const state = get().getQueryState(queryKey);
    const subscribers = get().subscribers.get(queryKey);
    if (subscribers) {
      subscribers.forEach((callback) => callback(state));
    }
  },

  // Operaciones principales
  query: async (queryKey, fetcher, options = {}) => {
    const {
      staleTime = DEFAULT_STALE_TIME,
      cacheTime = DEFAULT_CACHE_TIME,
      retryCount = DEFAULT_RETRY_COUNT,
      retryDelay = DEFAULT_RETRY_DELAY,
      onSuccess,
      onError,
    } = options;

    // Verificar caché
    const cacheEntry = get().getCacheEntry(queryKey);
    const now = Date.now();

    if (cacheEntry && now - cacheEntry.timestamp < cacheEntry.staleTime) {
      OfflineDebugger.log("QUERY_CACHE_HIT", { queryKey });
      return cacheEntry.data;
    }

    // Iniciar query
    get().setQueryState(queryKey, { status: "loading" });

    const executeQuery = async (attempt = 0) => {
      try {
        const data = await fetcher();

        // Actualizar caché y estado
        get().setCacheEntry(queryKey, data, { staleTime, cacheTime });
        get().setQueryState(queryKey, {
          status: "success",
          data,
          error: null,
          timestamp: Date.now(),
        });

        onSuccess?.(data);
        return data;
      } catch (error) {
        OfflineDebugger.error("QUERY_ERROR", error, { queryKey, attempt });

        // Reintentar si es posible
        if (attempt < retryCount) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
          return executeQuery(attempt + 1);
        }

        // Error final
        get().setQueryState(queryKey, {
          status: "error",
          error: error.message,
          timestamp: Date.now(),
        });

        onError?.(error);
        throw error;
      }
    };

    return executeQuery();
  },

  // Invalidación y refresco
  invalidate: (queryKey) => {
    get().cache.delete(queryKey);
    get().setQueryState(queryKey, {
      status: "idle",
      timestamp: Date.now(),
    });
    OfflineDebugger.log("QUERY_INVALIDATED", { queryKey });
  },

  prefetch: async (queryKey, fetcher, options = {}) => {
    try {
      const data = await fetcher();
      get().setCacheEntry(queryKey, data, options);
      OfflineDebugger.log("QUERY_PREFETCHED", { queryKey });
    } catch (error) {
      OfflineDebugger.error("PREFETCH_ERROR", error, { queryKey });
    }
  },

  // Limpieza
  clearCache: () => {
    set({ cache: new Map() });
    OfflineDebugger.log("CACHE_CLEARED");
  },
});

const useQueryStore = create(
  createStore(createQuerySlice, {
    name: "Query Store",
  })
);

export default useQueryStore;
