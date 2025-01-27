import PropTypes from "prop-types";
import { Card } from "../../../../shared/components/Card";
import { Badge } from "../../../../shared/components/Badge";
import { Users } from "lucide-react";
import { formatDate } from "../../../../shared/utils/date";

export const UsersCard = ({ stats }) => {
  if (!stats) return null;

  const activePercentage = (stats.active / stats.total) * 100;
  const roleDistribution = Object.entries(stats.byRole).map(
    ([role, count]) => ({
      role,
      percentage: (count / stats.total) * 100,
    })
  );

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Users className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Usuarios</h3>
          <p className="text-gray-600 text-sm">Actividad del sistema</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.total}</span>
          <Badge variant="success">
            {stats.active} activos ({Math.round(activePercentage)}%)
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Última actividad:{" "}
          {stats.lastActive ? formatDate(stats.lastActive) : "Nunca"}
        </p>
      </div>

      {/* Distribución por rol */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-600 mb-3">
          Distribución por rol
        </h4>
        <div className="space-y-3">
          {roleDistribution.map(({ role, percentage }) => (
            <div key={role}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium capitalize">{role}</span>
                <span className="text-sm text-gray-600">
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de roles */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        {Object.entries(stats.byRole).map(([role, count]) => (
          <div key={role} className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold">{count}</div>
            <div className="text-sm text-gray-600 capitalize">{role}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

UsersCard.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired,
    byRole: PropTypes.shape({
      admin: PropTypes.number.isRequired,
      manager: PropTypes.number.isRequired,
      employee: PropTypes.number.isRequired,
    }).isRequired,
    lastActive: PropTypes.string,
  }),
};

export default UsersCard;
