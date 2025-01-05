import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import PropTypes from "prop-types";

const UserManagement = ({
  isOpen = false,
  onClose = () => {},
  currentUser = null,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "encargado",
    restaurante: "Mercadona Alcalá",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/users", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, loadUsers]);

  // Validación en tiempo real
  const validateForm = useCallback((data) => {
    const errors = {};
    if (!data.username) {
      errors.username = "El nombre de usuario es requerido";
    } else if (data.username.length < 3) {
      errors.username = "El nombre debe tener al menos 3 caracteres";
    }

    if (!data.password) {
      errors.password = "La contraseña es requerida";
    } else if (data.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
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

  // Crear usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);

    if (Object.values(errors).filter(Boolean).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Enviando datos:", formData);

      const response = await fetch("http://localhost:5000/api/auth/users", {
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
      console.log("Respuesta del servidor:", data);

      if (!response.ok) {
        throw new Error(
          data.details
            ? `${data.error}: ${
                typeof data.details === "string"
                  ? data.details
                  : Object.values(data.details).filter(Boolean).join(", ")
              }`
            : data.error || "Error al crear usuario"
        );
      }

      await loadUsers();
      setShowCreateForm(false);
      setFormData({
        username: "",
        password: "",
        role: "encargado",
        restaurante: "Mercadona Alcalá",
      });
      setError(null);
    } catch (err) {
      console.error("Error completo:", err);
      setError(
        err.message || "Error al crear usuario. Por favor, intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/auth/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );

      if (!response.ok) throw new Error("Error al eliminar usuario");

      await loadUsers();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        onClick={() => {
          setError(null);
          setShowCreateForm(false);
          setFormData({
            username: "",
            password: "",
            role: "encargado",
            restaurante: "Mercadona Alcalá",
          });
          setFormErrors({});
          onClose();
        }}
      />

      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl z-10
        animate-[slideIn_0.3s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1d5030]" />
            <h2 className="text-lg font-bold text-[#1d5030]">
              Gestión de Usuarios
            </h2>
          </div>
          <button
            onClick={() => {
              setError(null);
              setShowCreateForm(false);
              setFormData({
                username: "",
                password: "",
                role: "encargado",
                restaurante: "Mercadona Alcalá",
              });
              setFormErrors({});
              onClose();
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {error && (
            <div
              className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm
              animate-[slideDown_0.3s_ease-out]"
            >
              {error}
            </div>
          )}

          {/* Create User Form */}
          {showCreateForm ? (
            <form
              onSubmit={handleCreateUser}
              className="space-y-4 mb-6 animate-[slideDown_0.3s_ease-out]"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md
                    ${
                      formErrors.username ? "border-red-500" : "border-gray-300"
                    }
                    focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50`}
                />
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md pr-10
                      ${
                        formErrors.password
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                      focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                      hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50"
                >
                  <option value="encargado">Encargado</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      username: "",
                      password: "",
                      role: "encargado",
                      restaurante: "Mercadona Alcalá",
                    });
                    setFormErrors({});
                    setError(null);
                  }}
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
                    !formData.username ||
                    !formData.password ||
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
                    "Crear Usuario"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-6 px-4 py-2 text-sm font-medium text-white
                bg-[#1d5030] hover:bg-[#1d5030]/90
                rounded-md transition-all duration-200
                hover:shadow-md
                flex items-center gap-2
                transform hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              Crear Usuario
            </button>
          )}

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#1d5030] animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user, index) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3
                    bg-white border border-gray-200 rounded-lg
                    transition-all duration-200
                    hover:shadow-md hover:border-gray-300
                    animate-[slideIn_0.3s_ease-out]"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {user.username}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                  {user._id !== currentUser._id &&
                    (deleteConfirm === user._id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700
                            bg-gray-50 hover:bg-gray-100
                            rounded-md transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="px-3 py-1.5 text-sm font-medium text-white
                            bg-red-600 hover:bg-red-700
                            rounded-md transition-colors"
                        >
                          Confirmar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(user._id)}
                        className="p-2 text-gray-400 hover:text-red-600
                          hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

UserManagement.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  currentUser: PropTypes.object,
};

export default UserManagement;
