import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useExpiring } from "../hooks/useExpiring";
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { Spinner } from "../../../shared/components/Spinner";
import { Alert } from "../../../shared/components/Alert";
import { Settings, Search, AlertTriangle } from "lucide-react";
import { ConfigModal } from "./ConfigModal";
import { StatsModal } from "./StatsModal";

export const ExpiringProducts = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const {
    products,
    expiringByStatus,
    criticalProducts,
    stats,
    config,
    loading,
    error,
    updateConfig,
    clearStats,
    refetch,
  } = useExpiring();

  // Estado local
  const [searchTerm, setSearchTerm] = useState("");
  const {
    isOpen: isConfigOpen,
    onOpen: openConfig,
    onClose: closeConfig,
  } = useModal();
  const {
    isOpen: isStatsOpen,
    onOpen: openStats,
    onClose: closeStats,
  } = useModal();

  // Filtrar productos por término de búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.nombre.toLowerCase().includes(term) ||
        product.ubicacion.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Renderizar producto individual
  const renderProduct = (product) => (
    <Card
      key={product._id}
      className={`mb-4 ${
        product.expirationStatus === "critical"
          ? "border-red-500"
          : "border-yellow-500"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{product.nombre}</h3>
          <p className="text-gray-600">{product.ubicacion}</p>
          <p className="text-sm mt-1">
            Vence en: {product.daysUntilExpiration} días
            <Badge
              variant={
                product.expirationStatus === "critical" ? "error" : "warning"
              }
              className="ml-2"
            >
              {product.expirationStatus === "critical"
                ? "Crítico"
                : "Advertencia"}
            </Badge>
          </p>
        </div>
        {hasPermission("products:edit") && (
          <Button
            variant="ghost"
            onClick={() => navigate(`/products/${product._id}`)}
          >
            Ver detalles
          </Button>
        )}
      </div>
    </Card>
  );

  if (error) {
    return (
      <Alert variant="error" className="mb-4">
        Error al cargar productos: {error.message}
      </Alert>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Productos por Vencer</h2>
          <p className="text-gray-600">
            {stats.total} productos requieren atención
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openStats} variant="outline">
            Ver Estadísticas
          </Button>
          {hasPermission("settings:edit") && (
            <Button onClick={openConfig} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          )}
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Productos críticos */}
      {criticalProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-red-500 mr-2" />
            <h3 className="text-xl font-semibold">Productos Críticos</h3>
          </div>
          <div className="space-y-4">{criticalProducts.map(renderProduct)}</div>
        </div>
      )}

      {/* Lista de productos por estado */}
      {Object.entries(expiringByStatus).map(([status, products]) => {
        if (!products.length) return null;
        return (
          <div key={status} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 capitalize">
              {status === "permanente"
                ? "Productos Permanentes"
                : "Productos Promocionales"}
            </h3>
            <div className="space-y-4">{products.map(renderProduct)}</div>
          </div>
        );
      })}

      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      )}

      {/* Sin resultados */}
      {!loading && filteredProducts.length === 0 && (
        <Alert variant="info">
          No hay productos por vencer
          {searchTerm && " que coincidan con la búsqueda"}
        </Alert>
      )}

      {/* Modales */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={closeConfig}
        config={config}
        onUpdate={updateConfig}
      />
      <StatsModal
        isOpen={isStatsOpen}
        onClose={closeStats}
        stats={stats}
        onClear={clearStats}
        onRefresh={refetch}
      />
    </div>
  );
};
