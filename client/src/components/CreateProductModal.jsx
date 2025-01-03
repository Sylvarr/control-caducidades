import { useState, useCallback } from "react";
import { X, RefreshCw, PackagePlus } from "lucide-react";
import PropTypes from "prop-types";

const CreateProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "permanente",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  // Crear producto
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (Object.values(errors).filter(Boolean).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:5000/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear producto");
      }

      await onProductCreated();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: "", tipo: "permanente" });
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
            <PackagePlus className="w-5 h-5 text-[#1d5030]" />
            <h2 className="text-lg font-bold text-[#1d5030]">
              Añadir nuevo producto
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

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md
                  ${formErrors.nombre ? "border-red-500" : "border-gray-300"}
                  focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50`}
              />
              {formErrors.nombre && (
                <p className="mt-1 text-sm text-red-500">{formErrors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50"
              >
                <option value="permanente">Permanente</option>
                <option value="promocional">Promocional</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700
                  bg-gray-50 hover:bg-gray-100
                  rounded-md transition-colors"
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
                className="px-4 py-2 text-sm font-medium text-white
                  bg-[#1d5030] hover:bg-[#1d5030]/90
                  rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
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
};

export default CreateProductModal;
