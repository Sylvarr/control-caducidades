import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { Select } from "../../../shared/components/Select";
import { Switch } from "../../../shared/components/Switch";
import { ROLE_CONFIG } from "../../../core/types/user";

export const UpdateModal = ({ isOpen, onClose, user, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "employee",
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      title="Editar Usuario"
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
          <Button type="submit" loading={isLoading}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};

UpdateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
  }),
  onUpdate: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default UpdateModal;
