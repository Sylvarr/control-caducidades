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
  completed: "#22c55e",
  pending: "#fbbf24",
  failed: "#f87171",
};

const SyncChart = ({ stats }) => {
  if (!stats) return null;

  const statusData = [
    { name: "Completados", value: stats.completed },
    { name: "Pendientes", value: stats.pending },
    { name: "Fallidos", value: stats.failed },
  ];

  const operationData = [
    { name: "Crear", value: stats.operations.create },
    { name: "Actualizar", value: stats.operations.update },
    { name: "Eliminar", value: stats.operations.delete },
    { name: "Mover", value: stats.operations.move },
  ];

  return (
    <Card className="h-96">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Estado de Sincronización</h3>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {statusData.map((entry, index) => (
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
        <h3 className="text-lg font-semibold">Operaciones por Tipo</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={operationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

SyncChart.propTypes = {
  stats: PropTypes.shape({
    completed: PropTypes.number.isRequired,
    pending: PropTypes.number.isRequired,
    failed: PropTypes.number.isRequired,
    operations: PropTypes.shape({
      create: PropTypes.number.isRequired,
      update: PropTypes.number.isRequired,
      delete: PropTypes.number.isRequired,
      move: PropTypes.number.isRequired,
    }).isRequired,
  }),
};

export default SyncChart;
