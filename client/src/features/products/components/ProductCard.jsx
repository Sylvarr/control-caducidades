import PropTypes from "prop-types";
import { useAuth } from "../../auth/hooks/useAuth";
import { Card } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Badge } from "../../../shared/components/Badge";
import { Menu } from "../../../shared/components/Menu";
import { Spinner } from "../../../shared/components/Spinner";
import {
  Edit,
  Trash2,
  MoveRight,
  AlertTriangle,
  Calendar,
  MapPin,
  Tag,
} from "lucide-react";

export const ProductCard = ({
  product,
  onSelect,
  onDelete,
  onMove,
  isUpdating,
  isDeleting,
  isMoving,
}) => {
  const { hasPermission } = useAuth();

  const getStatusBadge = () => {
    switch (product.estado) {
      case "permanente":
        return <Badge variant="success">Permanente</Badge>;
      case "promocional":
        return <Badge variant="warning">Promocional</Badge>;
      default:
        return <Badge variant="default">{product.estado}</Badge>;
    }
  };

  const getMoveOptions = () => {
    const options = [];
    if (product.estado !== "permanente") {
      options.push({
        label: "Mover a Permanente",
        icon: <MoveRight className="w-4 h-4" />,
        onClick: () => onMove(product._id, "permanente"),
      });
    }
    if (product.estado !== "promocional") {
      options.push({
        label: "Mover a Promocional",
        icon: <MoveRight className="w-4 h-4" />,
        onClick: () => onMove(product._id, "promocional"),
      });
    }
    return options;
  };

  return (
    <Card className="relative">
      {/* Estado de carga */}
      {(isUpdating || isDeleting || isMoving) && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
          <Spinner />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Encabezado */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{product.nombre}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Tag className="w-4 h-4" />
              <span>{product.tipo}</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Información */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{product.ubicacion}</span>
          </div>

          {product.fechaFrente && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Frente: {new Date(product.fechaFrente).toLocaleDateString()}
              </span>
            </div>
          )}

          {product.fechaAlmacen && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Almacén: {new Date(product.fechaAlmacen).toLocaleDateString()}
              </span>
            </div>
          )}

          {product.daysUntilExpiration <= 7 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Vence en {product.daysUntilExpiration} días</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          {hasPermission("products:edit") && (
            <Button variant="ghost" size="sm" onClick={onSelect}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}

          {hasPermission("products:delete") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}

          {hasPermission("products:move") && (
            <Menu
              trigger={
                <Button variant="ghost" size="sm">
                  <MoveRight className="w-4 h-4 mr-2" />
                  Mover
                </Button>
              }
              items={getMoveOptions()}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    ubicacion: PropTypes.string.isRequired,
    estado: PropTypes.string.isRequired,
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    daysUntilExpiration: PropTypes.number,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
  isDeleting: PropTypes.bool,
  isMoving: PropTypes.bool,
};
