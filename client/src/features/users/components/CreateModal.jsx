import { useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { Select } from "../../../shared/components/Select";
import { Switch } from "../../../shared/components/Switch";
import { ROLE_CONFIG } from "../../../core/types/user";

const DEFAULT_USER = {
  username: "",
  email: "",
  password: "",
  role: "employee",
  isActive: true,
};

export const CreateModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState(DEFAULT_USER);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(formData);
      setFormData(DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      title="Crear Usuario"
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre de usuario
          </label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            required
            minLength={3}
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <Select
            value={formData.role}
            onChange={(value) => handleChange("role", value)}
            options={Object.entries(ROLE_CONFIG).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <Switch
              checked={formData.isActive}
              onChange={(checked) => handleChange("isActive", checked)}
            />
            <span className="text-sm font-medium">Usuario activo</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Crear Usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
};

CreateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default CreateModal;
