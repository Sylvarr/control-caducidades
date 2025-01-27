import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "../../../core/hooks/useQuery";
import useUserStore from "../../../core/stores/userStore";
import useSocket from "../../../core/hooks/useSocket";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useUsers = (initialFilters = {}) => {
  const socket = useSocket();
  const {
    users,
    selectedUser,
    loading: storeLoading,
    error: storeError,
    filters,
    getFilteredUsers,
    setUsers,
    setSelectedUser,
    createUser,
    updateUser,
    deleteUser,
    setFilters,
    clearFilters,
    clearError,
  } = useUserStore();

  // Query para cargar usuarios
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    key: "users",
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      return response.json();
    },
    config: {
      cacheTime: 1000 * 60 * 5, // 5 minutos
      staleTime: 1000 * 60, // 1 minuto
    },
  });

  // Actualizar usuarios cuando cambian los datos
  useEffect(() => {
    if (data) {
      setUsers(data);
    }
  }, [data, setUsers]);

  // Aplicar filtros iniciales
  useEffect(() => {
    if (Object.keys(initialFilters).length) {
      setFilters(initialFilters);
    }
  }, []);

  // Manejar actualizaciones del servidor
  const handleServerUpdate = useCallback(
    (update) => {
      OfflineDebugger.log("USERS_SERVER_UPDATE", update);
      refetch();
    },
    [refetch]
  );

  // Suscribirse a eventos de socket
  useEffect(() => {
    if (!socket) return;

    socket.on("user:created", handleServerUpdate);
    socket.on("user:updated", handleServerUpdate);
    socket.on("user:deleted", handleServerUpdate);

    return () => {
      socket.off("user:created", handleServerUpdate);
      socket.off("user:updated", handleServerUpdate);
      socket.off("user:deleted", handleServerUpdate);
    };
  }, [socket, handleServerUpdate]);

  // Usuarios filtrados
  const filteredUsers = useMemo(() => {
    return getFilteredUsers();
  }, [getFilteredUsers]);

  // Estados de carga y error
  const loading = queryLoading || storeLoading;
  const error = queryError || storeError;

  // Acciones con manejo de errores
  const handleCreateUser = useCallback(
    async (userData) => {
      try {
        await createUser(userData);
      } catch (error) {
        OfflineDebugger.error("USER_CREATE_ERROR", {
          userData,
          error: error.message,
        });
        throw error;
      }
    },
    [createUser]
  );

  const handleUpdateUser = useCallback(
    async (id, changes) => {
      try {
        await updateUser({ id, changes, optimisticUpdate: true });
      } catch (error) {
        OfflineDebugger.error("USER_UPDATE_ERROR", {
          id,
          changes,
          error: error.message,
        });
        throw error;
      }
    },
    [updateUser]
  );

  const handleDeleteUser = useCallback(
    async (id) => {
      try {
        await deleteUser(id);
      } catch (error) {
        OfflineDebugger.error("USER_DELETE_ERROR", {
          id,
          error: error.message,
        });
        throw error;
      }
    },
    [deleteUser]
  );

  return {
    // Estado
    users: filteredUsers,
    selectedUser,
    filters,
    loading,
    error,

    // Acciones
    selectUser: setSelectedUser,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    setFilters,
    clearFilters,
    clearError,
    refetch,

    // Estados de operaciones
    isUpdating: users.some((u) => u.isUpdating),
    isDeleting: users.some((u) => u.isDeleting),
  };
};

export default useUsers;
