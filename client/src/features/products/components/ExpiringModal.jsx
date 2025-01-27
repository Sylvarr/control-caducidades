import PropTypes from "prop-types";
import { useMemo } from "react";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Badge } from "../../../shared/components/Badge";
import { Card } from "../../../shared/components/Card";
import { AlertTriangle, Calendar } from "lucide-react";

export const ExpiringModal = ({ isOpen, onClose, products }) => {
  const expiringProducts = useMemo(() => {
    return products
      .filter((p) => p.daysUntilExpiration <= 7)
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }, [products]);

  const groupedProducts = useMemo(() => {
    return expiringProducts.reduce((acc, product) => {
      const status = product.estado;
      if (!acc[status]) acc[status] = [];
      acc[status].push(product);
      return acc;
    }, {});
  }, [expiringProducts]);

  const renderProduct = (product) => (
    <Card key={product._id} className="mb-4">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{product.nombre}</h4>
            <p className="text-sm text-gray-600">{product.ubicacion}</p>
          </div>
          <Badge
            variant={product.daysUntilExpiration <= 3 ? "error" : "warning"}
          >
            {product.daysUntilExpiration} días
          </Badge>
        </div>

        <div className="space-y-2">
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
        </div>
      </div>
    </Card>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Productos por Vencer">
      <div className="space-y-6">
        {/* Resumen */}
        <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800">
              {expiringProducts.length} productos por vencer
            </h4>
            <p className="text-sm text-yellow-700">
              Los siguientes productos vencerán en los próximos 7 días. Por
              favor, revisa las fechas y toma las acciones necesarias.
            </p>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([status, products]) => (
            <div key={status}>
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {status === "permanente"
                  ? "Productos Permanentes"
                  : "Productos Promocionales"}
              </h3>
              <div className="space-y-4">{products.map(renderProduct)}</div>
            </div>
          ))}
        </div>

        {/* Sin resultados */}
        {expiringProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay productos por vencer en los próximos 7 días
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

ExpiringModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      ubicacion: PropTypes.string.isRequired,
      estado: PropTypes.string.isRequired,
      fechaFrente: PropTypes.string,
      fechaAlmacen: PropTypes.string,
      daysUntilExpiration: PropTypes.number.isRequired,
    })
  ).isRequired,
};
