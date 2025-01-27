import PropTypes from "prop-types";
import { Button } from "../../../shared/components/Button";
import { Menu } from "../../../shared/components/Menu";
import {
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  RotateCcw,
  Tag,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const SyncFilters = ({ filters, onChange, onClear }) => {
  const handleStatusChange = (status) => {
    onChange({ status });
  };

  const handleEntityTypeChange = (entityType) => {
    onChange({ entityType });
  };

  const handleOperationChange = (operation) => {
    onChange({ operation });
  };

  const handleSortChange = (sortBy, sortOrder) => {
    onChange({ sortBy, sortOrder });
  };

  const getStatusItems = () => [
    {
      label: "Todos",
      icon: <Filter className="w-4 h-4" />,
      onClick: () => handleStatusChange(null),
      active: !filters.status,
    },
    {
      label: "Pendientes",
      icon: <Clock className="w-4 h-4" />,
      onClick: () => handleStatusChange("pending"),
      active: filters.status === "pending",
    },
    {
      label: "Sincronizando",
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: () => handleStatusChange("syncing"),
      active: filters.status === "syncing",
    },
    {
      label: "Sincronizados",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: () => handleStatusChange("synced"),
      active: filters.status === "synced",
    },
    {
      label: "Errores",
      icon: <AlertTriangle className="w-4 h-4" />,
      onClick: () => handleStatusChange("error"),
      active: filters.status === "error",
    },
  ];

  const getEntityTypeItems = () => [
    {
      label: "Todos",
      icon: <Tag className="w-4 h-4" />,
      onClick: () => handleEntityTypeChange(null),
      active: !filters.entityType,
    },
    {
      label: "Productos",
      icon: <Tag className="w-4 h-4" />,
      onClick: () => handleEntityTypeChange("product"),
      active: filters.entityType === "product",
    },
    {
      label: "Usuarios",
      icon: <Tag className="w-4 h-4" />,
      onClick: () => handleEntityTypeChange("user"),
      active: filters.entityType === "user",
    },
  ];

  const getOperationItems = () => [
    {
      label: "Todas",
      icon: <Filter className="w-4 h-4" />,
      onClick: () => handleOperationChange(null),
      active: !filters.operation,
    },
    {
      label: "Crear",
      icon: <Filter className="w-4 h-4" />,
      onClick: () => handleOperationChange("create"),
      active: filters.operation === "create",
    },
    {
      label: "Actualizar",
      icon: <Filter className="w-4 h-4" />,
      onClick: () => handleOperationChange("update"),
      active: filters.operation === "update",
    },
    {
      label: "Eliminar",
      icon: <Filter className="w-4 h-4" />,
      onClick: () => handleOperationChange("delete"),
      active: filters.operation === "delete",
    },
    {
      label: "Mover",
      icon: <Filter className="w-4 h-4" />,
      onClick: () => handleOperationChange("move"),
      active: filters.operation === "move",
    },
  ];

  const getSortItems = () => [
    {
      label: "Más recientes",
      icon: <SortDesc className="w-4 h-4" />,
      onClick: () => handleSortChange("timestamp", "desc"),
      active: filters.sortBy === "timestamp" && filters.sortOrder === "desc",
    },
    {
      label: "Más antiguos",
      icon: <SortAsc className="w-4 h-4" />,
      onClick: () => handleSortChange("timestamp", "asc"),
      active: filters.sortBy === "timestamp" && filters.sortOrder === "asc",
    },
    {
      label: "Más reintentos",
      icon: <SortDesc className="w-4 h-4" />,
      onClick: () => handleSortChange("retryCount", "desc"),
      active: filters.sortBy === "retryCount" && filters.sortOrder === "desc",
    },
    {
      label: "Menos reintentos",
      icon: <SortAsc className="w-4 h-4" />,
      onClick: () => handleSortChange("retryCount", "asc"),
      active: filters.sortBy === "retryCount" && filters.sortOrder === "asc",
    },
  ];

  const hasActiveFilters =
    filters.status ||
    filters.entityType ||
    filters.operation ||
    (filters.sortBy !== "timestamp" && filters.sortOrder !== "desc");

  return (
    <div className="flex gap-2">
      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Estado
          </Button>
        }
        items={getStatusItems()}
      />

      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <Tag className="w-4 h-4 mr-2" />
            Tipo
          </Button>
        }
        items={getEntityTypeItems()}
      />

      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Operación
          </Button>
        }
        items={getOperationItems()}
      />

      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <SortAsc className="w-4 h-4 mr-2" />
            Ordenar
          </Button>
        }
        items={getSortItems()}
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
      )}
    </div>
  );
};

SyncFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    entityType: PropTypes.string,
    operation: PropTypes.string,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default SyncFilters;
