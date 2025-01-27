import { useStats } from "../hooks/useStats";
import { useAuth } from "../../auth/hooks/useAuth";
import { Alert } from "../../../shared/components/Alert";
import { Spinner } from "../../../shared/components/Spinner";
import { Button } from "../../../shared/components/Button";
import { RefreshCw } from "lucide-react";

// Componentes
import { TimeRangeFilter } from "./TimeRangeFilter";
import { ProductsCard } from "./cards/ProductsCard";
import { ExpirationCard } from "./cards/ExpirationCard";
import { SyncCard } from "./cards/SyncCard";
import { UsersCard } from "./cards/UsersCard";
import { ProductChart } from "./charts/ProductChart";
import { ExpirationChart } from "./charts/ExpirationChart";
import { ActivityTimeline } from "./ActivityTimeline";

export const Dashboard = () => {
  const { hasPermission } = useAuth();
  const {
    stats,
    productStats,
    expirationStats,
    syncStats,
    userStats,
    productTrends,
    expirationTrends,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    refetch,
  } = useStats();

  if (error) {
    return (
      <Alert variant="error" className="m-4">
        Error al cargar estadísticas: {error}
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Última actualización:{" "}
            {stats?.lastUpdated
              ? new Date(stats.lastUpdated).toLocaleString()
              : "Nunca"}
          </p>
        </div>
        <div className="flex gap-2">
          <TimeRangeFilter
            value={filters.timeRange}
            onChange={(timeRange) => setFilters({ timeRange })}
            onClear={clearFilters}
          />
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <ProductsCard stats={productStats} trends={productTrends} />
            <ExpirationCard stats={expirationStats} trends={expirationTrends} />
            <SyncCard stats={syncStats} />
            {hasPermission("users:view") && <UsersCard stats={userStats} />}
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ProductChart
              stats={productStats}
              trends={productTrends}
              className="min-h-[400px]"
            />
            <ExpirationChart
              stats={expirationStats}
              trends={expirationTrends}
              className="min-h-[400px]"
            />
          </div>

          {/* Línea de tiempo de actividad */}
          <ActivityTimeline className="mt-8" />
        </>
      )}
    </div>
  );
};

export default Dashboard;
