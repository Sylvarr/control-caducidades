import PropTypes from "prop-types";
import { Card } from "../../../../shared/components/Card";
import { Badge } from "../../../../shared/components/Badge";
import { AlertTriangle } from "lucide-react";

export const ExpirationCard = ({ stats, trends }) => {
  if (!stats || !trends) return null;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Vencimientos</h3>
          <p className="text-gray-600 text-sm">Productos por vencer</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.total}</span>
          <Badge variant="error">
            {stats.critical} críticos ({Math.round(trends.criticalPercentage)}%)
          </Badge>
        </div>
      </div>

      {/* Distribución por estado */}
      <div className="mt-4 space-y-3">
        {/* Críticos */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-red-700">Críticos</span>
            <span className="text-sm text-red-700">
              {Math.round(trends.criticalPercentage)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${trends.criticalPercentage}%` }}
            />
          </div>
        </div>

        {/* Advertencia */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-yellow-700">
              Advertencia
            </span>
            <span className="text-sm text-yellow-700">
              {Math.round(trends.warningPercentage)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${trends.warningPercentage}%` }}
            />
          </div>
        </div>

        {/* Vencidos */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Vencidos</span>
            <span className="text-sm text-gray-700">
              {Math.round(trends.expiredPercentage)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 rounded-full"
              style={{ width: `${trends.expiredPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Distribución por estado */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-600 mb-3">
          Distribución por estado
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {trends.statusDistribution.map(
            ({ status, critical, warning, expired }) => (
              <div key={status} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium capitalize mb-2">
                  {status}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Críticos</span>
                    <span>{Math.round(critical)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-600">Advertencia</span>
                    <span>{Math.round(warning)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Vencidos</span>
                    <span>{Math.round(expired)}%</span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </Card>
  );
};

ExpirationCard.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    warning: PropTypes.number.isRequired,
    critical: PropTypes.number.isRequired,
    expired: PropTypes.number.isRequired,
    byStatus: PropTypes.object.isRequired,
  }),
  trends: PropTypes.shape({
    criticalPercentage: PropTypes.number.isRequired,
    warningPercentage: PropTypes.number.isRequired,
    expiredPercentage: PropTypes.number.isRequired,
    statusDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        status: PropTypes.string.isRequired,
        critical: PropTypes.number.isRequired,
        warning: PropTypes.number.isRequired,
        expired: PropTypes.number.isRequired,
      })
    ).isRequired,
  }),
};

export default ExpirationCard;
