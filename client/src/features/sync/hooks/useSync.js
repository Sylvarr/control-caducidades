import { useCallback, useEffect, useMemo } from "react";
import useSyncStore from "../../../core/stores/syncStore";
import useSocket from "../../../core/hooks/useSocket";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useSync = (initialFilters = {}) => {
  const socket = useSocket();
  const {
    queue,
    stats,
    loading,
    error,
    filters,
    isSyncing,
    config,
    getFilteredQueue,
    getStats,
    getPendingCount,
    addToQueue,
    removeFromQueue,
    updateItem,
    startSync,
    pauseSync,
    retryItem,
    retryAllErrors,
    clearSynced,
    setFilters,
    clearFilters,
    clearError,
    updateConfig,
  } = useSyncStore();

  // Aplicar filtros iniciales
  useEffect(() => {
    if (Object.keys(initialFilters).length) {
      setFilters(initialFilters);
    }
  }, []);

  // Manejar actualizaciones del servidor
  const handleServerUpdate = useCallback(
    (update) => {
      OfflineDebugger.log("SYNC_SERVER_UPDATE", update);

      // Actualizar el estado del item en la cola
      if (update.queueItemId) {
        updateItem(update.queueItemId, {
          status: update.status,
          error: update.error,
        });
      }
    },
    [updateItem]
  );

  // Suscribirse a eventos de socket
  useEffect(() => {
    if (!socket) return;

    socket.on("sync:status", handleServerUpdate);
    socket.on("sync:error", handleServerUpdate);
    socket.on("sync:completed", handleServerUpdate);

    return () => {
      socket.off("sync:status", handleServerUpdate);
      socket.off("sync:error", handleServerUpdate);
      socket.off("sync:completed", handleServerUpdate);
    };
  }, [socket, handleServerUpdate]);

  // Auto-sincronización
  useEffect(() => {
    if (!config.autoSync || isSyncing) return;

    const pendingCount = getPendingCount();
    if (pendingCount > 0) {
      const timer = setTimeout(() => {
        startSync();
      }, config.syncInterval);

      return () => clearTimeout(timer);
    }
  }, [
    config.autoSync,
    config.syncInterval,
    isSyncing,
    getPendingCount,
    startSync,
  ]);

  // Cola filtrada
  const filteredQueue = useMemo(() => {
    return getFilteredQueue();
  }, [getFilteredQueue]);

  // Estadísticas actualizadas
  const currentStats = useMemo(() => {
    return getStats();
  }, [getStats]);

  // Acciones con manejo de errores
  const handleAddToQueue = useCallback(
    async (item) => {
      try {
        addToQueue(item);
        if (config.autoSync) {
          await startSync();
        }
      } catch (error) {
        OfflineDebugger.error("SYNC_ADD_ERROR", {
          item,
          error: error.message,
        });
        throw error;
      }
    },
    [addToQueue, startSync, config.autoSync]
  );

  const handleRetryItem = useCallback(
    async (id) => {
      try {
        await retryItem(id);
      } catch (error) {
        OfflineDebugger.error("SYNC_RETRY_ERROR", {
          id,
          error: error.message,
        });
        throw error;
      }
    },
    [retryItem]
  );

  const handleRetryAllErrors = useCallback(async () => {
    try {
      await retryAllErrors();
    } catch (error) {
      OfflineDebugger.error("SYNC_RETRY_ALL_ERROR", {
        error: error.message,
      });
      throw error;
    }
  }, [retryAllErrors]);

  return {
    // Estado
    queue: filteredQueue,
    stats: currentStats,
    loading,
    error,
    filters,
    isSyncing,
    config,

    // Acciones
    addToQueue: handleAddToQueue,
    removeFromQueue,
    updateItem,
    startSync,
    pauseSync,
    retryItem: handleRetryItem,
    retryAllErrors: handleRetryAllErrors,
    clearSynced,
    setFilters,
    clearFilters,
    clearError,
    updateConfig,
  };
};

export default useSync;
