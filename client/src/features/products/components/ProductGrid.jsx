import PropTypes from "prop-types";
import { ProductCard } from "./ProductCard";

export const ProductGrid = ({
  products,
  onSelect,
  onDelete,
  onMove,
  isUpdating,
  isDeleting,
  isMoving,
}) => {
  if (!products.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron productos
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onSelect={() => onSelect(product)}
          onDelete={() => onDelete(product._id)}
          onMove={onMove}
          isUpdating={isUpdating && product.isUpdating}
          isDeleting={isDeleting && product.isDeleting}
          isMoving={isMoving && product.isMoving}
        />
      ))}
    </div>
  );
};

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      tipo: PropTypes.string.isRequired,
      ubicacion: PropTypes.string.isRequired,
      estado: PropTypes.string.isRequired,
      isUpdating: PropTypes.bool,
      isDeleting: PropTypes.bool,
      isMoving: PropTypes.bool,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
  isDeleting: PropTypes.bool,
  isMoving: PropTypes.bool,
};
