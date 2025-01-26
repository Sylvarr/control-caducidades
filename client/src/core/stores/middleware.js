import { devtools, persist } from "zustand/middleware";
import OfflineDebugger from "../../shared/utils/debugger";

// Middleware para logging
export const withLogger = (config) => (set, get, api) =>
  config(
    (...args) => {
      OfflineDebugger.log("STORE_UPDATE", {
        store: api.storeId,
        newState: args[0],
        type: args[0]?.type,
      });
      set(...args);
    },
    get,
    api
  );

// Middleware para manejo de errores
export const withErrorHandling = (config) => (set, get, api) => {
  const errorHandler = (error, action) => {
    OfflineDebugger.error(`ERROR_IN_${api.storeId}`, error, { action });
    set({ error: error.message });
  };

  const wrapped = config(
    (args) => {
      try {
        set(args);
      } catch (error) {
        errorHandler(error, "set");
      }
    },
    get,
    api
  );

  return {
    ...wrapped,
    error: null,
    clearError: () => set({ error: null }),
  };
};

// Middleware para persistencia
export const withPersistence = (config, options) => {
  return persist(config, {
    name: `${options.name}-storage`,
    getStorage: () => localStorage,
    partialize: options.partialize || ((state) => state),
    ...options,
  });
};

// Middleware para autenticación
export const withAuth = (config) => (set, get, api) => {
  const wrapped = config(set, get, api);

  return {
    ...wrapped,
    requireAuth: async (action) => {
      const isAuthenticated = get().isAuthenticated;
      if (!isAuthenticated) {
        throw new Error("Se requiere autenticación");
      }
      return action();
    },
  };
};

// Middleware para sincronización
export const withSync = (config) => (set, get, api) => {
  const wrapped = config(set, get, api);

  return {
    ...wrapped,
    withSync: async (action) => {
      const isOffline = get().isOfflineMode;
      if (isOffline) {
        // Guardar acción para sincronización posterior
        await get().addPendingChange(action);
        return;
      }
      return action();
    },
  };
};

// Función para combinar middlewares
export const createStore = (config, options = {}) => {
  let enhancedConfig = config;

  // Añadir middleware de logging en desarrollo
  if (process.env.NODE_ENV === "development") {
    enhancedConfig = withLogger(enhancedConfig);
  }

  // Añadir manejo de errores
  enhancedConfig = withErrorHandling(enhancedConfig);

  // Añadir devtools en desarrollo
  if (process.env.NODE_ENV === "development") {
    enhancedConfig = devtools(enhancedConfig, {
      name: options.name || "Store",
    });
  }

  // Añadir persistencia si se especifica
  if (options.persist) {
    enhancedConfig = withPersistence(enhancedConfig, options.persist);
  }

  // Añadir autenticación si se requiere
  if (options.requireAuth) {
    enhancedConfig = withAuth(enhancedConfig);
  }

  // Añadir sincronización si se requiere
  if (options.withSync) {
    enhancedConfig = withSync(enhancedConfig);
  }

  return enhancedConfig;
};
