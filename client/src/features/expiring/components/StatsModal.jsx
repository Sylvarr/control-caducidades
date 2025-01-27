import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Badge } from "../../../shared/components/Badge";
import { AlertTriangle, AlertCircle, RefreshCw, Trash2 } from "lucide-react";

export const StatsModal = ({ isOpen, onClose, stats, onClear, onRefresh }) => {
  const renderStatusStats = (status, statusStats) => {
    if (!statusStats?.total) return null;
    return (
      <div key={status} className="border rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2 capitalize">
          {status === "permanente"
            ? "Productos Permanentes"
            : "Productos Promocionales"}
        </h4>
        <div className="space-y-2">
          <p className="flex items-center justify-between">
            <span className="text-gray-600">Total:</span>
            <Badge variant="default">{statusStats.total}</Badge>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-gray-600">
              <AlertCircle className="w-4 h-4 inline-block mr-1 text-yellow-500" />
              Advertencias:
            </span>
            <Badge variant="warning">{statusStats.warning}</Badge>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-gray-600">
              <AlertTriangle className="w-4 h-4 inline-block mr-1 text-red-500" />
              Críticos:
            </span>
            <Badge variant="error">{statusStats.critical}</Badge>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estadísticas de Vencimientos"
    >
      <div className="space-y-6">
        {/* Resumen general */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {stats.warning}
              </p>
              <p className="text-sm text-gray-600">Advertencias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {stats.critical}
              </p>
              <p className="text-sm text-gray-600">Críticos</p>
            </div>
          </div>
        </div>

        {/* Estadísticas por estado */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Por Estado</h3>
          {Object.entries(stats.byStatus).map(([status, statusStats]) =>
            renderStatusStats(status, statusStats)
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar estadísticas
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

StatsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    warning: PropTypes.number.isRequired,
    critical: PropTypes.number.isRequired,
    byStatus: PropTypes.objectOf(
      PropTypes.shape({
        total: PropTypes.number.isRequired,
        warning: PropTypes.number.isRequired,
        critical: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onClear: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default StatsModal;
