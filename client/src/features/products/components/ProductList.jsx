import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useProducts } from "../hooks/useProducts";
import { useModal } from "../../../core/hooks/useModal";
import { useToasts } from "../../../core/hooks/useToasts";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Spinner } from "../../../shared/components/Spinner";
import { Plus } from "lucide-react";

// Componentes
import { SearchBar } from "./SearchBar";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { UpdateModal } from "./UpdateModal";
import { ExpiringModal } from "./ExpiringModal";
import { ConflictModal } from "./ConflictModal";

export const ProductList = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { addToast } = useToasts();

  // Estado local
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  // Modales
  const {
    isOpen: isUpdateModalOpen,
    onOpen: openUpdateModal,
    onClose: closeUpdateModal,
  } = useModal();

  const { isOpen: isExpiringModalOpen, onClose: closeExpiringModal } =
    useModal();

  const { isOpen: isConflictModalOpen, onClose: closeConflictModal } =
    useModal();

  // Usar el hook de productos
  const {
    products,
    filters,
    loading,
    error,
    updateProduct,
    deleteProduct,
    moveProduct,
    setFilters,
    clearFilters,
    isUpdating,
    isDeleting,
    isMoving,
  } = useProducts({
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  // Manejadores de eventos
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    openUpdateModal();
  };

  const handleProductUpdate = async (changes) => {
    try {
      await updateProduct(selectedProduct._id, changes);
      addToast({
        type: "success",
        message: "Producto actualizado correctamente",
      });
      closeUpdateModal();
    } catch {
      addToast({
        type: "error",
        message: "Error al actualizar el producto",
      });
    }
  };

  const handleProductDelete = async (id) => {
    try {
      await deleteProduct(id);
      addToast({
        type: "success",
        message: "Producto eliminado correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al eliminar el producto",
      });
    }
  };

  const handleProductMove = async (id, newStatus) => {
    try {
      await moveProduct(id, newStatus);
      addToast({
        type: "success",
        message: "Producto movido correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al mover el producto",
      });
    }
  };

  const handleConflictResolution = async (resolution) => {
    try {
      await Promise.all(
        resolution.map(({ productId, changes }) =>
          updateProduct(productId, changes)
        )
      );
      setConflicts([]);
      closeConflictModal();
      addToast({
        type: "success",
        message: "Conflictos resueltos correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al resolver los conflictos",
      });
    }
  };

  if (error) {
    return (
      <Alert variant="error" className="m-4">
        Error al cargar productos: {error.message}
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-gray-600">{products.length} productos en total</p>
        </div>
        {hasPermission("products:create") && (
          <Button onClick={() => navigate("/products/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={filters.searchTerm}
            onChange={(value) => setFilters({ searchTerm: value })}
          />
        </div>
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      ) : (
        <ProductGrid
          products={products}
          onSelect={handleProductSelect}
          onDelete={handleProductDelete}
          onMove={handleProductMove}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          isMoving={isMoving}
        />
      )}

      {/* Modales */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        product={selectedProduct}
        onUpdate={handleProductUpdate}
        isLoading={isUpdating}
      />

      <ExpiringModal
        isOpen={isExpiringModalOpen}
        onClose={closeExpiringModal}
        products={products}
      />

      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={closeConflictModal}
        conflicts={conflicts}
        onResolve={handleConflictResolution}
      />
    </div>
  );
};
