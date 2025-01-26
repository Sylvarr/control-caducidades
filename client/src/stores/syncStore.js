import { create } from "zustand";
import { devtools } from "zustand/middleware";
import IndexedDB from "../services/indexedDB";
import FeatureManager from "../services/featureManager";
import useSocketStore from "./socketStore";
import useAuthStore from "./authStore";
import OfflineDebugger from "../utils/debugger";

const useSyncStore = create(
  devtools(
    (set, get) => ({
      // Estado
      syncInProgress: false,
      pendingChanges: [],
      lastSyncTime: null,
      offlineModeEnabled: FeatureManager.isEnabled("OFFLINE_MODE"),
      error: null,

      // Getters computados
      get isOfflineMode() {
        const socketStore = useSocketStore.getState();
        return get().offlineModeEnabled || !socketStore.isConnected;
      },

      // Acciones básicas
      setSyncProgress: (inProgress) => set({ syncInProgress: inProgress }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Cargar cambios pendientes
      loadPendingChanges: async () => {
        try {
          const changes = await IndexedDB.getPendingChanges();
          set({ pendingChanges: changes });
          OfflineDebugger.log("PENDING_CHANGES_LOADED", {
            count: changes.length,
          });
          return changes;
        } catch (error) {
          const errorMsg = "Error al cargar cambios pendientes";
          OfflineDebugger.error("LOAD_PENDING_CHANGES_ERROR", error);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      // Añadir un cambio pendiente
      addPendingChange: async (change) => {
        try {
          await IndexedDB.addPendingChange(change);
          const changes = await IndexedDB.getPendingChanges();
          set({ pendingChanges: changes });

          OfflineDebugger.log("PENDING_CHANGE_ADDED", {
            type: change.type,
            productId: change.productId,
          });

          // Si estamos online, intentar sincronizar inmediatamente
          const socketStore = useSocketStore.getState();
          if (socketStore.isConnected && !get().syncInProgress) {
            get().syncChanges();
          }
        } catch (error) {
          const errorMsg = "Error al añadir cambio pendiente";
          OfflineDebugger.error("ADD_PENDING_CHANGE_ERROR", error);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      // Remover un cambio pendiente
      removePendingChange: async (changeId) => {
        try {
          await IndexedDB.removePendingChange(changeId);
          const changes = await IndexedDB.getPendingChanges();
          set({ pendingChanges: changes });
          OfflineDebugger.log("PENDING_CHANGE_REMOVED", { changeId });
        } catch (error) {
          const errorMsg = "Error al remover cambio pendiente";
          OfflineDebugger.error("REMOVE_PENDING_CHANGE_ERROR", error);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      // Sincronizar cambios
      syncChanges: async () => {
        const state = get();
        const socketStore = useSocketStore.getState();
        const authStore = useAuthStore.getState();

        // Verificar condiciones para sincronizar
        if (
          state.syncInProgress ||
          !socketStore.isConnected ||
          !authStore.isAuthenticated ||
          state.pendingChanges.length === 0
        ) {
          return;
        }

        try {
          set({ syncInProgress: true, error: null });
          OfflineDebugger.log("SYNC_STARTED", {
            pendingChanges: state.pendingChanges.length,
          });

          // Agrupar cambios por tipo
          const changesByType = state.pendingChanges.reduce((acc, change) => {
            if (!acc[change.type]) acc[change.type] = [];
            acc[change.type].push(change);
            return acc;
          }, {});

          // Procesar cada tipo de cambio
          for (const [type, changes] of Object.entries(changesByType)) {
            OfflineDebugger.log("PROCESSING_CHANGES", {
              type,
              count: changes.length,
            });

            for (const change of changes) {
              try {
                // Emitir evento de sincronización vía socket
                const success = socketStore.emit("sync", {
                  type,
                  data: change.data,
                  productId: change.productId,
                  timestamp: change.timestamp,
                });

                if (success) {
                  await state.removePendingChange(change.id);
                }
              } catch (error) {
                OfflineDebugger.error("SYNC_CHANGE_ERROR", error, {
                  changeId: change.id,
                  type,
                });
                // Continuar con el siguiente cambio
              }
            }
          }

          set({
            lastSyncTime: new Date().toISOString(),
            error: null,
          });

          OfflineDebugger.log("SYNC_COMPLETED");
        } catch (error) {
          const errorMsg = "Error durante la sincronización";
          OfflineDebugger.error("SYNC_ERROR", error);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        } finally {
          set({ syncInProgress: false });
        }
      },

      // Limpiar todos los cambios pendientes
      clearPendingChanges: async () => {
        try {
          await IndexedDB.clearPendingChanges();
          set({
            pendingChanges: [],
            error: null,
          });
          OfflineDebugger.log("PENDING_CHANGES_CLEARED");
        } catch (error) {
          const errorMsg = "Error al limpiar cambios pendientes";
          OfflineDebugger.error("CLEAR_PENDING_CHANGES_ERROR", error);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      // Toggle modo offline
      toggleOfflineMode: () => {
        set((state) => ({
          offlineModeEnabled: !state.offlineModeEnabled,
          error: null,
        }));
        OfflineDebugger.log("OFFLINE_MODE_TOGGLED", {
          enabled: !get().offlineModeEnabled,
        });
      },
    }),
    {
      name: "Sync Store",
    }
  )
);

// Configurar listener para intentar sincronizar cuando se recupera la conexión
useSocketStore.subscribe(
  (state) => state.isConnected,
  (isConnected) => {
    if (isConnected) {
      const syncStore = useSyncStore.getState();
      if (syncStore.pendingChanges.length > 0) {
        syncStore.syncChanges();
      }
    }
  }
);

export default useSyncStore;
