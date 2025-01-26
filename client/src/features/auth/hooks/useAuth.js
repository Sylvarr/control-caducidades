import { useEffect } from "react";
import useAuthStore from "../../../core/stores/authStore";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    loading,
    error,
    initAuth,
    login,
    logout,
    updateUser,
    clearError,
  } = useAuthStore();

  // Inicializar autenticación al montar el componente
  useEffect(() => {
    OfflineDebugger.log("AUTH_HOOK_MOUNTED");
    initAuth();
  }, [initAuth]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      OfflineDebugger.log("AUTH_HOOK_UNMOUNTED");
    };
  }, []);

  return {
    // Estado
    isAuthenticated,
    user,
    loading,
    error,

    // Acciones
    login,
    logout,
    updateUser,
    clearError,

    // Helpers
    isAdmin: user?.role === "admin",
    isSupervisor: user?.role === "supervisor",
    hasPermission: (permission) =>
      user?.permissions?.includes(permission) ?? false,
  };
};
