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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  admin: "#60a5fa",
  manager: "#22c55e",
  employee: "#fbbf24",
};

const UsersChart = ({ stats }) => {
  if (!stats) return null;

  const roleData = Object.entries(stats.roles).map(([role, count]) => ({
    name: role,
    value: count,
  }));

  const activityData = stats.activity.map((item) => ({
    name: item.date,
    activos: item.active,
    inactivos: item.total - item.active,
  }));

  return (
    <Card className="h-96">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Distribución por Rol</h3>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={roleData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {roleData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name.toLowerCase()]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Actividad de Usuarios</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="activos" fill="#22c55e" stackId="a" />
            <Bar dataKey="inactivos" fill="#6b7280" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

UsersChart.propTypes = {
  stats: PropTypes.shape({
    roles: PropTypes.objectOf(PropTypes.number).isRequired,
    activity: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string.isRequired,
        total: PropTypes.number.isRequired,
        active: PropTypes.number.isRequired,
      })
    ).isRequired,
  }),
};

export default UsersChart;
