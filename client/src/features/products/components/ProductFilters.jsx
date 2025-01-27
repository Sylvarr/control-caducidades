import PropTypes from "prop-types";
import { Button } from "../../../shared/components/Button";
import { Menu } from "../../../shared/components/Menu";
import {
  Filter,
  SortAsc,
  SortDesc,
  Check,
  RotateCcw,
  Tag,
  MapPin,
  Clock,
} from "lucide-react";

export const ProductFilters = ({ filters, onChange, onClear }) => {
  const handleStatusChange = (status) => {
    onChange({ status });
  };

  const handleSortChange = (sortBy, sortOrder) => {
    onChange({ sortBy, sortOrder });
  };

  const handleActiveChange = (isActive) => {
    onChange({ isActive });
  };

  const getStatusItems = () => [
    {
      label: "Todos",
      icon: <Check className="w-4 h-4" />,
      onClick: () => handleStatusChange(null),
      active: !filters.status,
    },
    {
      label: "Permanentes",
      icon: <Tag className="w-4 h-4" />,
      onClick: () => handleStatusChange("permanente"),
      active: filters.status === "permanente",
    },
    {
      label: "Promocionales",
      icon: <Tag className="w-4 h-4" />,
      onClick: () => handleStatusChange("promocional"),
      active: filters.status === "promocional",
    },
  ];

  const getSortItems = () => [
    {
      label: "Nombre (A-Z)",
      icon: <SortAsc className="w-4 h-4" />,
      onClick: () => handleSortChange("nombre", "asc"),
      active: filters.sortBy === "nombre" && filters.sortOrder === "asc",
    },
    {
      label: "Nombre (Z-A)",
      icon: <SortDesc className="w-4 h-4" />,
      onClick: () => handleSortChange("nombre", "desc"),
      active: filters.sortBy === "nombre" && filters.sortOrder === "desc",
    },
    {
      label: "Ubicación (A-Z)",
      icon: <MapPin className="w-4 h-4" />,
      onClick: () => handleSortChange("ubicacion", "asc"),
      active: filters.sortBy === "ubicacion" && filters.sortOrder === "asc",
    },
    {
      label: "Ubicación (Z-A)",
      icon: <MapPin className="w-4 h-4" />,
      onClick: () => handleSortChange("ubicacion", "desc"),
      active: filters.sortBy === "ubicacion" && filters.sortOrder === "desc",
    },
    {
      label: "Más recientes",
      icon: <Clock className="w-4 h-4" />,
      onClick: () => handleSortChange("updatedAt", "desc"),
      active: filters.sortBy === "updatedAt" && filters.sortOrder === "desc",
    },
    {
      label: "Más antiguos",
      icon: <Clock className="w-4 h-4" />,
      onClick: () => handleSortChange("updatedAt", "asc"),
      active: filters.sortBy === "updatedAt" && filters.sortOrder === "asc",
    },
  ];

  const getActiveItems = () => [
    {
      label: "Todos",
      icon: <Check className="w-4 h-4" />,
      onClick: () => handleActiveChange(null),
      active: filters.isActive === null,
    },
    {
      label: "Activos",
      icon: <Check className="w-4 h-4" />,
      onClick: () => handleActiveChange(true),
      active: filters.isActive === true,
    },
    {
      label: "Inactivos",
      icon: <Check className="w-4 h-4" />,
      onClick: () => handleActiveChange(false),
      active: filters.isActive === false,
    },
  ];

  const hasActiveFilters =
    filters.status ||
    filters.isActive !== null ||
    (filters.sortBy !== "updatedAt" && filters.sortOrder !== "desc");

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
            <SortAsc className="w-4 h-4 mr-2" />
            Ordenar
          </Button>
        }
        items={getSortItems()}
      />

      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <Check className="w-4 h-4 mr-2" />
            Activos
          </Button>
        }
        items={getActiveItems()}
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

ProductFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    isActive: PropTypes.bool,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
