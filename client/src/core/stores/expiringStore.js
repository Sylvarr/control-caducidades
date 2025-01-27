import { create } from "zustand";
import { createStore } from "./middleware";
import OfflineDebugger from "../../shared/utils/debugger";

const DEFAULT_CONFIG = {
  warningDays: 7,
  criticalDays: 3,
  checkFrontDate: true,
  checkStorageDate: true,
};

const createExpiringSlice = (set, get) => ({
  // Estado
  config: DEFAULT_CONFIG,
  stats: {
    total: 0,
    warning: 0,
    critical: 0,
    byStatus: {},
  },
  loading: false,
  error: null,

  // Getters
  getExpiringProducts: () => {
    const { products, config } = get();
    return (
      products?.filter((p) => p.daysUntilExpiration <= config.warningDays) || []
    );
  },

  getExpiringByStatus: (status) => {
    return get()
      .getExpiringProducts()
      .filter((p) => p.estado === status);
  },

  getStats: () => get().stats,

  // Acciones
  updateConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));
    get().calculateExpiringProducts(get().products);
    OfflineDebugger.log("EXPIRING_CONFIG_UPDATED", { config: newConfig });
  },

  calculateExpiringProducts: (products) => {
    if (!products?.length) return;

    const { config } = get();
    const now = new Date();
    const stats = {
      total: 0,
      warning: 0,
      critical: 0,
      byStatus: {},
    };

    const expiringProducts = products.map((product) => {
      // Calcular fecha de vencimiento más próxima
      let expirationDate = null;
      let daysUntilExpiration = Infinity;

      if (config.checkFrontDate && product.fechaFrente) {
        const frontDate = new Date(product.fechaFrente);
        const frontDays = Math.ceil((frontDate - now) / (1000 * 60 * 60 * 24));
        if (frontDays < daysUntilExpiration) {
          daysUntilExpiration = frontDays;
          expirationDate = product.fechaFrente;
        }
      }

      if (config.checkStorageDate && product.fechaAlmacen) {
        const storageDate = new Date(product.fechaAlmacen);
        const storageDays = Math.ceil(
          (storageDate - now) / (1000 * 60 * 60 * 24)
        );
        if (storageDays < daysUntilExpiration) {
          daysUntilExpiration = storageDays;
          expirationDate = product.fechaAlmacen;
        }
      }

      // Determinar estado de vencimiento
      let expirationStatus = "ok";
      if (daysUntilExpiration <= config.criticalDays) {
        expirationStatus = "critical";
        stats.critical++;
        stats.total++;
      } else if (daysUntilExpiration <= config.warningDays) {
        expirationStatus = "warning";
        stats.warning++;
        stats.total++;
      }

      // Actualizar estadísticas por estado
      if (expirationStatus !== "ok") {
        if (!stats.byStatus[product.estado]) {
          stats.byStatus[product.estado] = {
            total: 0,
            warning: 0,
            critical: 0,
          };
        }
        stats.byStatus[product.estado].total++;
        stats.byStatus[product.estado][expirationStatus]++;
      }

      return {
        ...product,
        daysUntilExpiration,
        expirationStatus,
        expirationDate,
      };
    });

    set({
      products: expiringProducts,
      stats,
      loading: false,
      error: null,
    });

    OfflineDebugger.log("EXPIRING_PRODUCTS_CALCULATED", {
      total: stats.total,
      warning: stats.warning,
      critical: stats.critical,
    });
  },

  clearStats: () => {
    set({
      stats: {
        total: 0,
        warning: 0,
        critical: 0,
        byStatus: {},
      },
      products: [],
    });
    OfflineDebugger.log("EXPIRING_STATS_CLEARED");
  },
});

const useExpiringStore = create(
  createStore(createExpiringSlice, {
    name: "Expiring Store",
    persist: {
      partialize: (state) => ({
        config: state.config,
      }),
    },
  })
);

export default useExpiringStore;
