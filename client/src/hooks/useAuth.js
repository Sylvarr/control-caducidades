import { useEffect } from "react";
import useAuthStore from "../stores/authStore";

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
  } = useAuthStore();

  // Inicializar autenticación al montar el componente
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
  };
};
