import { useSync } from "../hooks/useSync";
import { useToasts } from "../../../core/hooks/useToasts";
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Spinner } from "../../../shared/components/Spinner";
import {
  Play,
  Pause,
  RefreshCw,
  Settings,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";

// Componentes
import { SearchBar } from "./SearchBar";
import { SyncFilters } from "./SyncFilters";
import { SyncQueue } from "./SyncQueue";
import { ConfigModal } from "./ConfigModal";

export const SyncManagement = () => {
  const { addToast } = useToasts();

  // Modales
  const {
    isOpen: isConfigModalOpen,
    onOpen: openConfigModal,
    onClose: closeConfigModal,
  } = useModal();

  // Usar el hook de sincronización
  const {
    queue,
    stats,
    loading,
    error,
    filters,
    isSyncing,
    config,
    startSync,
    pauseSync,
    retryItem,
    retryAllErrors,
    clearSynced,
    setFilters,
    clearFilters,
    updateConfig,
  } = useSync({
    sortBy: "timestamp",
    sortOrder: "desc",
  });

  // Manejadores de eventos
  const handleStartSync = async () => {
    try {
      await startSync();
      addToast({
        type: "success",
        message: "Sincronización iniciada correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al iniciar la sincronización",
      });
    }
  };

  const handlePauseSync = () => {
    try {
      pauseSync();
      addToast({
        type: "info",
        message: "Sincronización pausada",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al pausar la sincronización",
      });
    }
  };

  const handleRetryItem = async (id) => {
    try {
      await retryItem(id);
      addToast({
        type: "success",
        message: "Item reintentado correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al reintentar el item",
      });
    }
  };

  const handleRetryAllErrors = async () => {
    try {
      await retryAllErrors();
      addToast({
        type: "success",
        message: "Reintentando todos los items con error",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al reintentar los items",
      });
    }
  };

  const handleClearSynced = () => {
    try {
      clearSynced();
      addToast({
        type: "success",
        message: "Items sincronizados eliminados",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al eliminar los items sincronizados",
      });
    }
  };

  const handleUpdateConfig = async (newConfig) => {
    try {
      updateConfig(newConfig);
      closeConfigModal();
      addToast({
        type: "success",
        message: "Configuración actualizada correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al actualizar la configuración",
      });
    }
  };

  if (error) {
    return (
      <Alert variant="error" className="m-4">
        Error en la sincronización: {error}
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cola de Sincronización</h1>
          <p className="text-gray-600">{stats.total} items en total</p>
        </div>
        <div className="flex gap-2">
          {isSyncing ? (
            <Button onClick={handlePauseSync}>
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          ) : (
            <Button onClick={handleStartSync}>
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          )}
          <Button variant="outline" onClick={openConfigModal}>
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock className="w-4 h-4" />
            <span>Pendientes</span>
          </div>
          <p className="text-2xl font-semibold">{stats.pending}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizando</span>
          </div>
          <p className="text-2xl font-semibold">{stats.syncing}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sincronizados</span>
          </div>
          <p className="text-2xl font-semibold">{stats.synced}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Errores</span>
          </div>
          <p className="text-2xl font-semibold">{stats.error}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock className="w-4 h-4" />
            <span>Última Sincronización</span>
          </div>
          <p className="text-sm">
            {stats.lastSync
              ? new Date(stats.lastSync).toLocaleString()
              : "Nunca"}
          </p>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={filters.searchTerm}
            onChange={(value) => setFilters({ searchTerm: value })}
          />
        </div>
        <SyncFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        {stats.error > 0 && (
          <Button variant="outline" onClick={handleRetryAllErrors}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reintentar Errores ({stats.error})
          </Button>
        )}
        {stats.synced > 0 && (
          <Button variant="outline" onClick={handleClearSynced}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Sincronizados ({stats.synced})
          </Button>
        )}
      </div>

      {/* Cola de sincronización */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      ) : (
        <SyncQueue
          queue={queue}
          onRetry={handleRetryItem}
          isSyncing={isSyncing}
        />
      )}

      {/* Modales */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={closeConfigModal}
        config={config}
        onUpdate={handleUpdateConfig}
      />
    </div>
  );
};

export default SyncManagement;
