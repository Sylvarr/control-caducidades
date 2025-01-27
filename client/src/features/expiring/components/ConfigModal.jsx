import { useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { Switch } from "../../../shared/components/Switch";

export const ConfigModal = ({ isOpen, onClose, config, onUpdate }) => {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de Vencimientos"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Días de advertencia
          </label>
          <Input
            type="number"
            name="warningDays"
            value={formData.warningDays}
            onChange={handleChange}
            min={1}
            max={30}
          />
          <p className="mt-1 text-sm text-gray-500">
            Mostrar advertencia cuando falten estos días o menos
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Días críticos
          </label>
          <Input
            type="number"
            name="criticalDays"
            value={formData.criticalDays}
            onChange={handleChange}
            min={1}
            max={formData.warningDays}
          />
          <p className="mt-1 text-sm text-gray-500">
            Marcar como crítico cuando falten estos días o menos
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Revisar fecha de frente
              </label>
              <p className="text-sm text-gray-500">
                Considerar la fecha de vencimiento del frente del producto
              </p>
            </div>
            <Switch
              name="checkFrontDate"
              checked={formData.checkFrontDate}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Revisar fecha de almacén
              </label>
              <p className="text-sm text-gray-500">
                Considerar la fecha de vencimiento del almacén
              </p>
            </div>
            <Switch
              name="checkStorageDate"
              checked={formData.checkStorageDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </Modal>
  );
};

ConfigModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  config: PropTypes.shape({
    warningDays: PropTypes.number.isRequired,
    criticalDays: PropTypes.number.isRequired,
    checkFrontDate: PropTypes.bool.isRequired,
    checkStorageDate: PropTypes.bool.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default ConfigModal;
