import { useEffect, useCallback } from "react";
import useSyncStore from "../stores/syncStore";
import useSocketStore from "../stores/socketStore";
import OfflineDebugger from "../utils/debugger";

export const useSyncManagement = () => {
  const {
    syncInProgress,
    pendingChanges,
    error,
    isOfflineMode,
    lastSyncTime,
    loadPendingChanges,
    syncChanges,
    clearPendingChanges,
    toggleOfflineMode,
    clearError,
  } = useSyncStore();

  const { isConnected } = useSocketStore();

  // Cargar cambios pendientes al iniciar
  useEffect(() => {
    loadPendingChanges();
  }, [loadPendingChanges]);

  // Manejar errores de sincronización
  const handleSyncError = useCallback((error) => {
    OfflineDebugger.error("SYNC_MANAGEMENT_ERROR", error);
  }, []);

  // Función para forzar sincronización
  const forceSyncChanges = useCallback(async () => {
    if (!isConnected) {
      handleSyncError(new Error("No hay conexión disponible"));
      return;
    }

    try {
      await syncChanges();
    } catch (error) {
      handleSyncError(error);
    }
  }, [isConnected, syncChanges, handleSyncError]);

  // Intentar sincronizar cuando volvemos a estar online
  useEffect(() => {
    if (isConnected && pendingChanges.length > 0 && !isOfflineMode) {
      forceSyncChanges();
    }
  }, [isConnected, pendingChanges.length, isOfflineMode, forceSyncChanges]);

  return {
    syncInProgress,
    pendingChanges,
    error,
    isOfflineMode,
    lastSyncTime,
    isConnected,
    forceSyncChanges,
    clearPendingChanges,
    toggleOfflineMode,
    clearError,
  };
};
