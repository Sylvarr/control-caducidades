import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "../../../core/hooks/useQuery";
import useStatsStore from "../../../core/stores/statsStore";
import useSocket from "../../../core/hooks/useSocket";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useStats = (initialFilters = {}) => {
  const socket = useSocket();
  const {
    filters,
    loading: storeLoading,
    error: storeError,
    getStats,
    getProductStats,
    getExpirationStats,
    getSyncStats,
    getUserStats,
    setFilters,
    clearFilters,
    clearStats,
    clearError,
  } = useStatsStore();

  // Query para cargar estadísticas
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    key: "dashboard-stats",
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.timeRange) {
        params.append("start", filters.timeRange.start);
        params.append("end", filters.timeRange.end);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      if (filters.location) {
        params.append("location", filters.location);
      }

      const response = await fetch(`/api/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Error al cargar estadísticas");
      }
      return response.json();
    },
    config: {
      cacheTime: 1000 * 60 * 5, // 5 minutos
      staleTime: 1000 * 60, // 1 minuto
    },
  });

  // Actualizar estadísticas cuando cambian los datos
  useEffect(() => {
    if (data) {
      clearStats();
      setFilters(filters);
    }
  }, [data, setFilters, clearStats, filters]);

  // Aplicar filtros iniciales
  useEffect(() => {
    if (Object.keys(initialFilters).length) {
      setFilters(initialFilters);
    }
  }, []);

  // Manejar actualizaciones del servidor
  const handleServerUpdate = useCallback(
    (update) => {
      OfflineDebugger.log("STATS_SERVER_UPDATE", update);
      refetch();
    },
    [refetch]
  );

  // Suscribirse a eventos de socket
  useEffect(() => {
    if (!socket) return;

    socket.on("product:created", handleServerUpdate);
    socket.on("product:updated", handleServerUpdate);
    socket.on("product:deleted", handleServerUpdate);
    socket.on("product:moved", handleServerUpdate);
    socket.on("user:created", handleServerUpdate);
    socket.on("user:updated", handleServerUpdate);
    socket.on("user:deleted", handleServerUpdate);
    socket.on("sync:completed", handleServerUpdate);

    return () => {
      socket.off("product:created", handleServerUpdate);
      socket.off("product:updated", handleServerUpdate);
      socket.off("product:deleted", handleServerUpdate);
      socket.off("product:moved", handleServerUpdate);
      socket.off("user:created", handleServerUpdate);
      socket.off("user:updated", handleServerUpdate);
      socket.off("user:deleted", handleServerUpdate);
      socket.off("sync:completed", handleServerUpdate);
    };
  }, [socket, handleServerUpdate]);

  // Calcular estadísticas derivadas
  const productTrends = useMemo(() => {
    const productStats = getProductStats();
    if (!productStats) return null;

    return {
      activePercentage: (productStats.active / productStats.total) * 100,
      statusDistribution: Object.entries(productStats.byStatus).map(
        ([status, count]) => ({
          status,
          percentage: (count / productStats.total) * 100,
        })
      ),
      locationDistribution: Object.entries(productStats.byLocation).map(
        ([location, count]) => ({
          location,
          percentage: (count / productStats.total) * 100,
        })
      ),
    };
  }, [getProductStats]);

  const expirationTrends = useMemo(() => {
    const expirationStats = getExpirationStats();
    if (!expirationStats) return null;

    return {
      criticalPercentage:
        (expirationStats.critical / expirationStats.total) * 100,
      warningPercentage:
        (expirationStats.warning / expirationStats.total) * 100,
      expiredPercentage:
        (expirationStats.expired / expirationStats.total) * 100,
      statusDistribution: Object.entries(expirationStats.byStatus).map(
        ([status, counts]) => ({
          status,
          critical: (counts.critical / expirationStats.total) * 100,
          warning: (counts.warning / expirationStats.total) * 100,
          expired: (counts.expired / expirationStats.total) * 100,
        })
      ),
    };
  }, [getExpirationStats]);

  return {
    // Estado
    stats: getStats(),
    filters,
    loading: queryLoading || storeLoading,
    error: queryError || storeError,

    // Estadísticas específicas
    productStats: getProductStats(),
    expirationStats: getExpirationStats(),
    syncStats: getSyncStats(),
    userStats: getUserStats(),

    // Tendencias calculadas
    productTrends,
    expirationTrends,

    // Acciones
    setFilters,
    clearFilters,
    clearStats,
    clearError,
    refetch,
  };
};

export default useStats;
