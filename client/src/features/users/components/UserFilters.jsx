import PropTypes from "prop-types";
import { Button } from "../../../shared/components/Button";
import { Menu } from "../../../shared/components/Menu";
import { ROLE_CONFIG } from "../../../core/types/user";
import { Filter, SortAsc, SortDesc, UserCheck, UserX, X } from "lucide-react";

export const UserFilters = ({ filters, onChange, onClear }) => {
  // Manejadores de cambios
  const handleRoleChange = (role) => {
    onChange({ ...filters, role });
  };

  const handleSortChange = (sortBy, sortOrder) => {
    onChange({ ...filters, sortBy, sortOrder });
  };

  const handleActiveChange = (isActive) => {
    onChange({ ...filters, isActive });
  };

  // Generar items del menú para roles
  const getRoleMenuItems = () => {
    return Object.entries(ROLE_CONFIG).map(([role, config]) => ({
      label: config.label,
      icon: config.icon,
      onClick: () => handleRoleChange(role),
      active: filters.role === role,
    }));
  };

  // Generar items del menú para ordenamiento
  const getSortMenuItems = () => [
    {
      label: "Nombre (A-Z)",
      icon: SortAsc,
      onClick: () => handleSortChange("username", "asc"),
      active: filters.sortBy === "username" && filters.sortOrder === "asc",
    },
    {
      label: "Nombre (Z-A)",
      icon: SortDesc,
      onClick: () => handleSortChange("username", "desc"),
      active: filters.sortBy === "username" && filters.sortOrder === "desc",
    },
    {
      label: "Fecha de creación (Más reciente)",
      icon: SortDesc,
      onClick: () => handleSortChange("createdAt", "desc"),
      active: filters.sortBy === "createdAt" && filters.sortOrder === "desc",
    },
    {
      label: "Fecha de creación (Más antigua)",
      icon: SortAsc,
      onClick: () => handleSortChange("createdAt", "asc"),
      active: filters.sortBy === "createdAt" && filters.sortOrder === "asc",
    },
  ];

  // Generar items del menú para estado activo/inactivo
  const getActiveMenuItems = () => [
    {
      label: "Activos",
      icon: UserCheck,
      onClick: () => handleActiveChange(true),
      active: filters.isActive === true,
    },
    {
      label: "Inactivos",
      icon: UserX,
      onClick: () => handleActiveChange(false),
      active: filters.isActive === false,
    },
  ];

  // Verificar si hay filtros activos
  const hasActiveFilters =
    filters.role ||
    filters.isActive !== undefined ||
    (filters.sortBy !== "username" && filters.sortOrder !== "asc");

  return (
    <div className="flex gap-2">
      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Rol
          </Button>
        }
        items={getRoleMenuItems()}
      />

      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <SortAsc className="w-4 h-4 mr-2" />
            Ordenar
          </Button>
        }
        items={getSortMenuItems()}
      />

      <Menu
        trigger={
          <Button variant="outline" size="sm">
            <UserCheck className="w-4 h-4 mr-2" />
            Estado
          </Button>
        }
        items={getActiveMenuItems()}
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
      )}
    </div>
  );
};

UserFilters.propTypes = {
  filters: PropTypes.shape({
    role: PropTypes.string,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default UserFilters;
