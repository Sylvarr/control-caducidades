import PropTypes from "prop-types";
import { Card } from "../../../../shared/components/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const ProductChart = ({ stats, trends, className }) => {
  if (!stats || !trends) return null;

  // Preparar datos para el gráfico de estado
  const statusData = trends.statusDistribution.map(
    ({ status, percentage }) => ({
      name: status,
      value: Math.round(percentage),
    })
  );

  // Preparar datos para el gráfico de ubicación
  const locationData = trends.locationDistribution.map(
    ({ location, percentage }) => ({
      name: location,
      value: Math.round(percentage),
    })
  );

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="font-semibold text-lg mb-6">Distribución de Productos</h3>

      <div className="space-y-8">
        {/* Gráfico por estado */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-4">Por Estado</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Porcentaje"]}
                  labelFormatter={(label) =>
                    label.charAt(0).toUpperCase() + label.slice(1)
                  }
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico por ubicación */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-4">
            Por Ubicación
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Porcentaje"]}
                  labelFormatter={(label) =>
                    label.charAt(0).toUpperCase() + label.slice(1)
                  }
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
};

ProductChart.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired,
    inactive: PropTypes.number.isRequired,
    byStatus: PropTypes.object.isRequired,
    byLocation: PropTypes.object.isRequired,
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
  className: PropTypes.string,
};

export default ProductChart;
