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

const ExpirationChart = ({ stats, trends }) => {
  if (!stats || !trends) return null;

  const statusData = [
    { name: "Crítico", value: stats.critical },
    { name: "Advertencia", value: stats.warning },
    { name: "Expirado", value: stats.expired },
  ];

  const trendData = trends.map((trend) => ({
    name: trend.date,
    crítico: trend.critical,
    advertencia: trend.warning,
    expirado: trend.expired,
  }));

  return (
    <Card className="h-96">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Distribución por Estado</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f87171" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Tendencia de Expiración</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="crítico" fill="#f87171" />
            <Bar dataKey="advertencia" fill="#fbbf24" />
            <Bar dataKey="expirado" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

ExpirationChart.propTypes = {
  stats: PropTypes.shape({
    critical: PropTypes.number.isRequired,
    warning: PropTypes.number.isRequired,
    expired: PropTypes.number.isRequired,
  }),
  trends: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      critical: PropTypes.number.isRequired,
      warning: PropTypes.number.isRequired,
      expired: PropTypes.number.isRequired,
    })
  ),
};

export default ExpirationChart;
