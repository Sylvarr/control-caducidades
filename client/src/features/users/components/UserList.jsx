import PropTypes from "prop-types";
import { useAuth } from "../../auth/hooks/useAuth";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { ROLE_CONFIG } from "../../../core/types/user";
import { formatDate } from "../../../shared/utils/date";
import { Edit2, Trash2 } from "lucide-react";

export const UserList = ({
  users,
  onSelect,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  const { hasPermission, currentUser } = useAuth();

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron usuarios
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <Card key={user._id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{user.username}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <Badge
              variant={user.isActive ? "success" : "error"}
              className="capitalize"
            >
              {user.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="mt-4">
            <Badge
              variant="info"
              className="capitalize"
              icon={ROLE_CONFIG[user.role]?.icon}
            >
              {ROLE_CONFIG[user.role]?.label}
            </Badge>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Último acceso: {formatDate(user.lastLogin)}</p>
            <p>Creado: {formatDate(user.createdAt)}</p>
          </div>

          {hasPermission("users:manage") && currentUser._id !== user._id && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(user)}
                disabled={isUpdating}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(user._id)}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

UserList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      isActive: PropTypes.bool.isRequired,
      lastLogin: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  isDeleting: PropTypes.bool.isRequired,
};

export default UserList;
