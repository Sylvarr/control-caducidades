import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { Select } from "../../../shared/components/Select";
import { Switch } from "../../../shared/components/Switch";
import { DatePicker } from "../../../shared/components/DatePicker";

export const UpdateModal = ({
  isOpen,
  onClose,
  product,
  onUpdate,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    ubicacion: "",
    estado: "",
    fechaFrente: null,
    fechaAlmacen: null,
    activo: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        tipo: product.tipo,
        ubicacion: product.ubicacion,
        estado: product.estado,
        fechaFrente: product.fechaFrente,
        fechaAlmacen: product.fechaAlmacen,
        activo: product.activo,
      });
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Producto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <Input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <Select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar...</option>
              <option value="alimento">Alimento</option>
              <option value="bebida">Bebida</option>
              <option value="limpieza">Limpieza</option>
              <option value="otro">Otro</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación
            </label>
            <Select
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar...</option>
              <option value="almacen">Almacén</option>
              <option value="frente">Frente</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <Select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar...</option>
            <option value="permanente">Permanente</option>
            <option value="promocional">Promocional</option>
          </Select>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Frente
            </label>
            <DatePicker
              value={formData.fechaFrente}
              onChange={(value) => handleDateChange("fechaFrente", value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Almacén
            </label>
            <DatePicker
              value={formData.fechaAlmacen}
              onChange={(value) => handleDateChange("fechaAlmacen", value)}
            />
          </div>
        </div>

        {/* Estado activo */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Activo</label>
            <p className="text-sm text-gray-500">
              Indica si el producto está activo en el sistema
            </p>
          </div>
          <Switch
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};

UpdateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    ubicacion: PropTypes.string.isRequired,
    estado: PropTypes.string.isRequired,
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    activo: PropTypes.bool.isRequired,
  }),
  onUpdate: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
