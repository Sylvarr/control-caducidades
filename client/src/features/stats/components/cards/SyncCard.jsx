import PropTypes from "prop-types";
import { Card } from "../../../../shared/components/Card";
import { Badge } from "../../../../shared/components/Badge";
import { RefreshCw } from "lucide-react";
import { formatDate } from "../../../../shared/utils/date";

export const SyncCard = ({ stats }) => {
  if (!stats) return null;

  const completedPercentage = (stats.completed / stats.total) * 100;
  const pendingPercentage = (stats.pending / stats.total) * 100;
  const failedPercentage = (stats.failed / stats.total) * 100;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <RefreshCw className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Sincronización</h3>
          <p className="text-gray-600 text-sm">Estado del sistema</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.total}</span>
          <Badge variant="info">
            {stats.pending} pendientes ({Math.round(pendingPercentage)}%)
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Última sincronización:{" "}
          {stats.lastSync ? formatDate(stats.lastSync) : "Nunca"}
        </p>
      </div>

      {/* Distribución de estados */}
      <div className="mt-6 space-y-3">
        {/* Completados */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-green-700">
              Completados
            </span>
            <span className="text-sm text-green-700">
              {stats.completed} ({Math.round(completedPercentage)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${completedPercentage}%` }}
            />
          </div>
        </div>

        {/* Pendientes */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-700">
              Pendientes
            </span>
            <span className="text-sm text-blue-700">
              {stats.pending} ({Math.round(pendingPercentage)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${pendingPercentage}%` }}
            />
          </div>
        </div>

        {/* Fallidos */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-red-700">Fallidos</span>
            <span className="text-sm text-red-700">
              {stats.failed} ({Math.round(failedPercentage)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${failedPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

SyncCard.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    pending: PropTypes.number.isRequired,
    completed: PropTypes.number.isRequired,
    failed: PropTypes.number.isRequired,
    lastSync: PropTypes.string,
  }),
};

export default SyncCard;
