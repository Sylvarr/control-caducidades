import PropTypes from "prop-types";
import { Card } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Badge } from "../../../shared/components/Badge";
import { Spinner } from "../../../shared/components/Spinner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  RotateCcw,
  Tag,
} from "lucide-react";

export const SyncQueue = ({ queue, onRetry, isSyncing }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="default">Pendiente</Badge>;
      case "syncing":
        return <Badge variant="info">Sincronizando</Badge>;
      case "synced":
        return <Badge variant="success">Sincronizado</Badge>;
      case "error":
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getOperationBadge = (operation) => {
    switch (operation) {
      case "create":
        return <Badge variant="success">Crear</Badge>;
      case "update":
        return <Badge variant="info">Actualizar</Badge>;
      case "delete":
        return <Badge variant="error">Eliminar</Badge>;
      case "move":
        return <Badge variant="warning">Mover</Badge>;
      default:
        return <Badge variant="default">{operation}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "synced":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!queue.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay items en la cola de sincronización
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queue.map((item) => (
        <Card key={item._id} className="relative">
          {/* Estado de carga */}
          {isSyncing && item.status === "syncing" && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
              <Spinner />
            </div>
          )}

          {/* Contenido */}
          <div className="p-4 space-y-4">
            {/* Encabezado */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="font-medium">{item.entityId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span className="capitalize">{item.entityType}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(item.status)}
                {getOperationBadge(item.operation)}
              </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Fecha:</span>{" "}
                {new Date(item.timestamp).toLocaleString()}
              </div>
              <div>
                <span className="text-gray-600">Reintentos:</span>{" "}
                {item.retryCount}
              </div>
            </div>

            {/* Error */}
            {item.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {item.error}
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end">
              {item.status === "error" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(item._id)}
                  disabled={isSyncing}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

SyncQueue.propTypes = {
  queue: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      operation: PropTypes.string.isRequired,
      entityType: PropTypes.string.isRequired,
      entityId: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      retryCount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      error: PropTypes.string,
    })
  ).isRequired,
  onRetry: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
};

export default SyncQueue;
