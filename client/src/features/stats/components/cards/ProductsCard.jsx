import PropTypes from "prop-types";
import { Card } from "../../../../shared/components/Card";
import { Badge } from "../../../../shared/components/Badge";
import { Package } from "lucide-react";

export const ProductsCard = ({ stats, trends }) => {
  if (!stats || !trends) return null;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Productos</h3>
          <p className="text-gray-600 text-sm">Total en catálogo</p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.total}</span>
          <Badge variant="success">
            {stats.active} activos ({Math.round(trends.activePercentage)}%)
          </Badge>
        </div>
      </div>

      {/* Distribución por estado */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">
          Distribución por estado
        </h4>
        <div className="space-y-2">
          {trends.statusDistribution.map(({ status, percentage }) => (
            <div key={status} className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {status} ({Math.round(percentage)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por ubicación */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">
          Distribución por ubicación
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {trends.locationDistribution.map(({ location, percentage }) => (
            <div
              key={location}
              className="bg-gray-50 rounded-lg p-3 text-center"
            >
              <div className="text-lg font-semibold">
                {Math.round(percentage)}%
              </div>
              <div className="text-sm text-gray-600 capitalize">{location}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

ProductsCard.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired,
    inactive: PropTypes.number.isRequired,
    byStatus: PropTypes.object.isRequired,
    byLocation: PropTypes.shape({
      almacen: PropTypes.number.isRequired,
      nevera: PropTypes.number.isRequired,
    }).isRequired,
  }),
  trends: PropTypes.shape({
    activePercentage: PropTypes.number.isRequired,
    statusDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        status: PropTypes.string.isRequired,
        percentage: PropTypes.number.isRequired,
      })
    ).isRequired,
    locationDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        location: PropTypes.string.isRequired,
        percentage: PropTypes.number.isRequired,
      })
    ).isRequired,
  }),
};

export default ProductsCard;
