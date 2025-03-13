import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Trash2, Eye, EyeOff, RefreshCw, WifiOff } from "lucide-react";
import PropTypes from "prop-types";
import config from "../config";
import usePreventScroll from "../hooks/usePreventScroll";
import ModalContainer from "./ModalContainer";
import { useSocket } from "../hooks/useSocket";
import OfflineManager from "../services/offlineManager";

const UserManagement = ({
  isOpen = false,
  onClose = () => {},
  currentUser = null,
}) => {
  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);
  const { socket } = useSocket();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "encargado",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Verificar estado offline al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const checkOfflineStatus = () => {
        const offlineStatus = !navigator.onLine || OfflineManager.isOfflineMode;
        setIsOffline(offlineStatus);
        return offlineStatus;
      };
      
      // Verificar estado inicial
      const initialOfflineStatus = checkOfflineStatus();
      
      // Si estamos online, cargar usuarios
      if (!initialOfflineStatus) {
        loadUsers();
      }
      
      // Configurar listeners para cambios en la conectividad
      const handleOnline = () => {
        setIsOffline(false);
        loadUsers();
      };
      
      const handleOffline = () => {
        setIsOffline(true);
      };
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [isOpen]);

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/auth/users`, {
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

  // Escuchar eventos de socket para actualizaciones de usuarios
  useEffect(() => {
    if (!socket) return;

    const handleUserUpdate = (data) => {
      console.log("Recibida actualización de usuario:", data);

      if (data.type === "create") {
        setUsers((prevUsers) => [
          ...prevUsers,
          {
            ...data.user,
            _id: data.user.id,
          },
        ]);
      } else if (data.type === "update") {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === data.user.id
              ? {
                  ...user,
                  ...data.user,
                  _id: data.user.id,
                }
              : user
          )
        );
      } else if (data.type === "delete") {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== data.userId)
        );
      }
    };

    socket.on("userUpdate", handleUserUpdate);

    return () => {
      socket.off("userUpdate", handleUserUpdate);
    };
  }, [socket]);

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

      const response = await fetch(`${config.apiUrl}/auth/users`, {
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
      const response = await fetch(`${config.apiUrl}/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar usuario");

      await loadUsers();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setShowCreateForm(false);
    setFormData({
      username: "",
      password: "",
      role: "encargado",
    });
    setFormErrors({});
    onClose();
  };

  const title = (
    <div className="flex items-center gap-2">
      <Users className="w-5 h-5 text-[#1d5030]" />
      <span>Gestión de Usuarios</span>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={false}
      onClose={handleClose}
      title={title}
      containerClassName="max-w-2xl"
    >
      {/* Content */}
      <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {/* Mensaje de alerta para modo offline */}
        {isOffline && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-md
            animate-[slideDown_0.3s_ease-out] text-amber-800 flex items-start gap-3">
            <WifiOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Servicio no disponible</h3>
              <p className="text-sm">
                La gestión de usuarios no está disponible en modo offline por razones de seguridad.
                Por favor, conéctate a internet para administrar usuarios.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div
            className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm
            animate-[slideDown_0.3s_ease-out]"
          >
            {error}
          </div>
        )}

        {/* Botón de crear usuario (oculto en modo offline) */}
        {!showCreateForm && !isOffline && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full p-3 mb-4 flex items-center justify-center gap-2
              bg-[#1d5030] text-white rounded-lg
              hover:bg-[#1d5030]/90 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Crear Nuevo Usuario
          </button>
        )}

        {/* Formulario de creación (oculto en modo offline) */}
        {showCreateForm && !isOffline && (
          <form
            onSubmit={handleCreateUser}
            className="mb-6 p-4 bg-gray-50 rounded-lg
              animate-[slideDown_0.3s_ease-out]"
          >
            <h3 className="text-lg font-semibold text-[#1d5030] mb-4">
              Crear Nuevo Usuario
            </h3>

            {/* Username field */}
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md
                  ${
                    formErrors.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#1d5030]"
                  }
                  focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              />
              {formErrors.username && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.username}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md pr-10
                    ${
                      formErrors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-[#1d5030]"
                    }
                    focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                    p-1 text-gray-400 hover:text-gray-600"
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

            {/* Role field */}
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-[#1d5030] focus:ring-opacity-50"
              >
                <option value="encargado">Encargado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Form buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    username: "",
                    password: "",
                    role: "encargado",
                  });
                  setFormErrors({});
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700
                  bg-gray-100 hover:bg-gray-200
                  rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
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
        )}

        {/* Lista de usuarios */}
        <div className="space-y-3">
          {loading && !isOffline ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#1d5030] animate-spin" />
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                className="p-3 bg-white border border-gray-200 rounded-lg
                  flex items-center justify-between gap-4
                  hover:border-[#1d5030]/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#2d3748] truncate">
                    {user.username}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {user.role === "admin" ? "Administrador" : "Encargado"}
                  </p>
                </div>

                {/* Botón de eliminar (oculto en modo offline) */}
                {currentUser?._id !== user._id && !isOffline && (
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    className="p-2 text-red-500 hover:bg-red-50
                      rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                {/* Confirmación de eliminación */}
                {deleteConfirm === user._id && !isOffline && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4
                      bg-black/50 animate-[fadeIn_0.2s_ease-out]"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    <div
                      className="bg-white p-6 rounded-lg shadow-xl
                        animate-[slideIn_0.3s_ease-out]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¿Eliminar usuario?
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Esta acción no se puede deshacer.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700
                            bg-gray-100 hover:bg-gray-200
                            rounded-md transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="px-4 py-2 text-sm font-medium text-white
                            bg-red-500 hover:bg-red-600
                            rounded-md transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Mensaje si no hay usuarios para mostrar */}
          {!loading && users.length === 0 && !isOffline && (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios para mostrar
            </div>
          )}
        </div>
      </div>
    </ModalContainer>
  );
};

UserManagement.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.string,
    restaurante: PropTypes.string,
  }),
};

export default UserManagement;
