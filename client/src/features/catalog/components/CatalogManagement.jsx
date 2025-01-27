import { useState, useMemo } from "react";
import {
  Package,
  PackagePlus,
  Trash2,
  X,
  RefreshCw,
  Tag,
  Search,
  Pencil,
} from "lucide-react";
import PropTypes from "prop-types";
import { useCatalog } from "../hooks/useCatalog";
import CreateProductModal from "./CreateProductModal";
import usePreventScroll from "../../../hooks/usePreventScroll";

const TYPE_STYLES = {
  permanente: {
    color: "text-[#1d5030]",
    bg: "bg-[#1d5030]/10",
  },
  promocional: {
    color: "text-[#c17817]",
    bg: "bg-[#c17817]/10",
  },
};

const CatalogManagement = ({ isOpen, onClose }) => {
  // Prevenir scroll cuando el modal está abierto
  usePreventScroll(isOpen);

  // Estado local
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Usar el nuevo hook de catálogo
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    isDeleting,
    deleteError,
  } = useCatalog();

  // Filtrar y agrupar productos
  const groupedProducts = useMemo(() => {
    const filtered = products.filter((product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      permanentes: filtered.filter((p) => p.tipo === "permanente"),
      promocionales: filtered.filter((p) => p.tipo === "promocional"),
    };
  }, [products, searchTerm]);

  // Manejadores
  const handleClose = () => {
    setSelectedProductId(null);
    setDeleteConfirm(null);
    setEditingProduct(null);
    onClose();
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  const handleProductUpdate = async (updatedProduct) => {
    if (editingProduct) {
      await updateProduct({
        productId: editingProduct._id,
        updates: updatedProduct,
      });
    } else {
      await createProduct(updatedProduct);
    }
    setShowCreateModal(false);
    setEditingProduct(null);
  };

  // Renderizar producto
  const renderProduct = (product) => (
    <div
      key={product._id}
      onClick={() =>
        setSelectedProductId(
          selectedProductId === product._id ? null : product._id
        )
      }
      className={`
        flex items-center justify-between p-3 
        ${selectedProductId === product._id ? "bg-gray-100" : "bg-gray-50"}
        rounded-md transition-colors
        active:bg-gray-200
      `}
    >
      <div className="flex items-center gap-3">
        <Tag
          className={`w-4 h-4 ${
            TYPE_STYLES[product.tipo]?.color || "text-gray-400"
          }`}
        />
        <span className="text-gray-900">{product.nombre}</span>
      </div>

      {deleteConfirm === product._id ? (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(product._id);
            }}
            disabled={isDeleting}
            className="h-10 px-4 bg-red-600 text-white rounded-lg
              hover:bg-red-700 transition-colors flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            Confirmar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(null);
            }}
            className="h-10 px-4 bg-gray-200 text-gray-700 rounded-lg
              hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        selectedProductId === product._id && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingProduct(product);
              }}
              className="h-10 w-10 flex items-center justify-center text-gray-600 
                hover:text-gray-900 hover:bg-gray-200 transition-colors rounded-lg"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(product._id);
              }}
              className="h-10 w-10 flex items-center justify-center text-gray-600
                hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4
        animate-[fadeIn_0.2s_ease-out]"
      >
        <div
          className="fixed inset-0 bg-black/50 
            animate-[fadeIn_0.2s_ease-out]"
          onClick={handleClose}
        />

        <div
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl z-10
          animate-[slideIn_0.3s_ease-out]"
          data-modal-content
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1d5030]" />
              <h2 className="text-lg font-bold text-[#1d5030]">
                Gestión de Catálogo
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div
            className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto"
            data-scrollable
          >
            {(error || deleteError) && (
              <div
                className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm
                animate-[slideDown_0.3s_ease-out]"
              >
                {error || deleteError}
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo permitir letras y espacios, máximo 15 caracteres
                    if (
                      /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]*$/.test(value) &&
                      value.length <= 15
                    ) {
                      setSearchTerm(value);
                    }
                  }}
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
                    text-gray-900 placeholder-gray-500"
                  maxLength={15}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Botón Añadir */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1d5030] text-white rounded-md
                  hover:bg-[#1d5030]/90 transition-colors font-medium"
              >
                <PackagePlus className="w-4 h-4" />
                Añadir Producto
              </button>
            </div>

            {/* Lista de productos */}
            <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : groupedProducts.permanentes.length === 0 &&
                groupedProducts.promocionales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron productos
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Productos Permanentes */}
                  {groupedProducts.permanentes.length > 0 && (
                    <div>
                      <h3
                        className={`text-sm font-medium mb-2 flex items-center gap-2
                          ${TYPE_STYLES.permanente.color}`}
                      >
                        <Tag className="w-4 h-4" />
                        Productos Permanentes
                      </h3>
                      <div className="space-y-2">
                        {groupedProducts.permanentes.map(renderProduct)}
                      </div>
                    </div>
                  )}

                  {/* Productos Promocionales */}
                  {groupedProducts.promocionales.length > 0 && (
                    <div>
                      <h3
                        className={`text-sm font-medium mb-2 flex items-center gap-2
                          ${TYPE_STYLES.promocional.color}`}
                      >
                        <Tag className="w-4 h-4" />
                        Productos Promocionales
                      </h3>
                      <div className="space-y-2">
                        {groupedProducts.promocionales.map(renderProduct)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateProductModal
        isOpen={showCreateModal || editingProduct !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProduct(null);
        }}
        onProductCreated={handleProductUpdate}
        editingProduct={editingProduct}
      />
    </>
  );
};

CatalogManagement.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CatalogManagement;
