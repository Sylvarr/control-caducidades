import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "../../../core/hooks/useQuery";
import useExpiringStore from "../../../core/stores/expiringStore";
import useSocket from "../../../core/hooks/useSocket";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useExpiring = () => {
  const socket = useSocket();
  const {
    config,
    loading: calculating,
    error,
    getExpiringProducts,
    getExpiringByStatus,
    getStats,
    updateConfig,
    calculateExpiringProducts,
    clearStats,
  } = useExpiringStore();

  // Query para cargar productos
  const {
    data: products,
    loading,
    error: queryError,
    refetch,
  } = useQuery({
    key: "expiring-products",
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }
      return response.json();
    },
    config: {
      cacheTime: 1000 * 60 * 5, // 5 minutos
      staleTime: 1000 * 60, // 1 minuto
    },
  });

  // Calcular productos por vencer cuando cambian los productos o la configuración
  useEffect(() => {
    if (products?.length) {
      calculateExpiringProducts(products);
    }
  }, [products, config, calculateExpiringProducts]);

  // Manejar actualizaciones del servidor
  const handleServerUpdate = useCallback(
    (update) => {
      OfflineDebugger.log("EXPIRING_SERVER_UPDATE", update);
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

    return () => {
      socket.off("product:created", handleServerUpdate);
      socket.off("product:updated", handleServerUpdate);
      socket.off("product:deleted", handleServerUpdate);
      socket.off("product:moved", handleServerUpdate);
    };
  }, [socket, handleServerUpdate]);

  // Productos por vencer agrupados por estado
  const expiringByStatus = useMemo(() => {
    const statuses = ["permanente", "promocional"];
    return statuses.reduce((acc, status) => {
      acc[status] = getExpiringByStatus(status);
      return acc;
    }, {});
  }, [getExpiringByStatus]);

  // Productos críticos (próximos a vencer)
  const criticalProducts = useMemo(() => {
    return getExpiringProducts().filter(
      (p) => p.daysUntilExpiration <= config.criticalDays
    );
  }, [getExpiringProducts, config.criticalDays]);

  return {
    // Estado
    products: getExpiringProducts(),
    expiringByStatus,
    criticalProducts,
    stats: getStats(),
    config,
    loading: loading || calculating,
    error: error || queryError,

    // Acciones
    updateConfig,
    clearStats,
    refetch,
  };
};

export default useExpiring;
