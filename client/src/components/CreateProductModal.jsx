import { useState, useCallback, useEffect } from "react";
import {
  PackagePlus,
  X,
  RefreshCw,
  Warehouse,
  Snowflake,
  Pencil,
} from "lucide-react";
import PropTypes from "prop-types";
import usePreventScroll from "../hooks/usePreventScroll";
import { createCatalogProduct, updateCatalogProduct } from "../services/api";

const CreateProductModal = ({
  isOpen,
  onClose,
  onProductCreated,
  editingProduct,
}) => {
  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "permanente",
    ubicacion: "almacen",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del producto a editar
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nombre: editingProduct.nombre,
        tipo: editingProduct.tipo,
        ubicacion: editingProduct.ubicacion || "almacen",
      });
    }
  }, [editingProduct]);

  // Validación en tiempo real
  const validateForm = useCallback((data) => {
    const errors = {};
    if (!data.nombre) {
      errors.nombre = "El nombre del producto es requerido";
    } else if (data.nombre.length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    }
    return errors;
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      // Validar solo el campo que cambió
      const fieldError = validateForm(newFormData)[name];
      setFormErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    },
    [formData, validateForm]
  );

  // Crear o actualizar producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (Object.values(errors).filter(Boolean).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingProduct) {
        await updateCatalogProduct(editingProduct._id, formData);
      } else {
        await createCatalogProduct(formData);
      }
      await onProductCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: "", tipo: "permanente", ubicacion: "almacen" });
    setFormErrors({});
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
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
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl z-10
        animate-[slideIn_0.3s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {editingProduct ? (
              <Pencil className="w-5 h-5 text-[#1d5030]" />
            ) : (
              <PackagePlus className="w-5 h-5 text-[#1d5030]" />
            )}
            <h2 className="text-lg font-bold text-[#1d5030]">
              {editingProduct
                ? `Editar "${editingProduct.nombre}"`
                : "Añadir nuevo producto"}
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
        <div className="p-4">
          {error && (
            <div
              className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm
              animate-[slideDown_0.3s_ease-out]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre del Producto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 px-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full h-12 px-4 border rounded-lg
                  ${formErrors.nombre ? "border-red-500" : "border-gray-300"}
                  focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50
                  text-base`}
                placeholder="Ej: Café descafeinado"
              />
              {formErrors.nombre && (
                <p className="mt-1 text-sm text-red-500 px-1">
                  {formErrors.nombre}
                </p>
              )}
            </div>

            {/* Tipo de Producto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 px-1">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tipo: "permanente" }))
                  }
                  className={`h-12 flex items-center justify-center rounded-lg
                    font-medium transition-all duration-200
                    ${
                      formData.tipo === "permanente"
                        ? "bg-gray-200 text-gray-800 border-2 border-gray-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                    active:scale-95`}
                >
                  Permanente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tipo: "promocional" }))
                  }
                  className={`h-12 flex items-center justify-center rounded-lg
                    font-medium transition-all duration-200
                    ${
                      formData.tipo === "promocional"
                        ? "bg-gray-200 text-gray-800 border-2 border-gray-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                    active:scale-95`}
                >
                  Promocional
                </button>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 px-1">
                Ubicación
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, ubicacion: "almacen" }))
                  }
                  className={`h-12 flex items-center justify-center gap-2 rounded-lg
                    font-medium transition-all duration-200
                    ${
                      formData.ubicacion === "almacen"
                        ? "bg-gray-200 text-gray-800 border-2 border-gray-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                    active:scale-95`}
                >
                  <Warehouse className="w-4 h-4" />
                  Almacén
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, ubicacion: "nevera" }))
                  }
                  className={`h-12 flex items-center justify-center gap-2 rounded-lg
                    font-medium transition-all duration-200
                    ${
                      formData.ubicacion === "nevera"
                        ? "bg-gray-200 text-gray-800 border-2 border-gray-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                    active:scale-95`}
                >
                  <Snowflake className="w-4 h-4" />
                  Nevera
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="h-12 px-6 bg-gray-100 text-gray-600 rounded-lg
                  font-medium transition-all duration-200
                  hover:bg-gray-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.nombre ||
                  Object.values(formErrors).some(Boolean)
                }
                className="h-12 px-6 bg-[#1d5030] text-white rounded-lg
                  font-medium shadow-sm hover:shadow-md
                  hover:bg-[#1d5030]/90 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {editingProduct ? "Guardando..." : "Creando..."}
                  </>
                ) : editingProduct ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Producto"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

CreateProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProductCreated: PropTypes.func.isRequired,
  editingProduct: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    ubicacion: PropTypes.string,
  }),
};

export default CreateProductModal;
