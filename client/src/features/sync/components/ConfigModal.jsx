import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { Switch } from "../../../shared/components/Switch";

export const ConfigModal = ({ isOpen, onClose, config, onUpdate }) => {
  const [formData, setFormData] = useState({
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 5,
    syncInterval: 30000,
    autoSync: true,
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
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
      title="Configuración de Sincronización"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reintentos máximos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reintentos máximos
          </label>
          <Input
            type="number"
            name="maxRetries"
            value={formData.maxRetries}
            onChange={handleChange}
            min={1}
            max={10}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Número máximo de intentos para sincronizar un item
          </p>
        </div>

        {/* Retraso entre reintentos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Retraso entre reintentos (ms)
          </label>
          <Input
            type="number"
            name="retryDelay"
            value={formData.retryDelay}
            onChange={handleChange}
            min={1000}
            max={60000}
            step={1000}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Tiempo de espera entre reintentos en milisegundos
          </p>
        </div>

        {/* Tamaño del lote */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamaño del lote
          </label>
          <Input
            type="number"
            name="batchSize"
            value={formData.batchSize}
            onChange={handleChange}
            min={1}
            max={20}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Número de items a sincronizar simultáneamente
          </p>
        </div>

        {/* Intervalo de sincronización */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervalo de sincronización (ms)
          </label>
          <Input
            type="number"
            name="syncInterval"
            value={formData.syncInterval}
            onChange={handleChange}
            min={5000}
            max={300000}
            step={1000}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Frecuencia de sincronización automática en milisegundos
          </p>
        </div>

        {/* Sincronización automática */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Sincronización automática
            </label>
            <p className="text-sm text-gray-500">
              Sincronizar automáticamente cuando hay items pendientes
            </p>
          </div>
          <Switch
            name="autoSync"
            checked={formData.autoSync}
            onChange={handleChange}
          />
        </div>

        {/* Acciones */}
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
    maxRetries: PropTypes.number.isRequired,
    retryDelay: PropTypes.number.isRequired,
    batchSize: PropTypes.number.isRequired,
    syncInterval: PropTypes.number.isRequired,
    autoSync: PropTypes.bool.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default ConfigModal;
