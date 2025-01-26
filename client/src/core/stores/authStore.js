import { create } from "zustand";
import { createStore } from "./middleware";
import OfflineDebugger from "../../shared/utils/debugger";

const API_URL = import.meta.env.PROD
  ? `${window.location.origin}/api`
  : "http://localhost:5000/api";

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

const createAuthSlice = (set, get) => ({
  ...initialState,

  // Getters
  getToken: () =>
    localStorage.getItem("token") || sessionStorage.getItem("token"),

  // Acciones
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  // Inicializar el estado de autenticación
  initAuth: async () => {
    try {
      set({ loading: true, error: null });
      const token = get().getToken();

      if (!token) {
        set({ isAuthenticated: false, user: null, loading: false });
        return;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener información del usuario");
      }

      const userData = await response.json();
      set({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null,
      });

      OfflineDebugger.log("AUTH_INITIALIZED", { user: userData });
    } catch (error) {
      OfflineDebugger.error("AUTH_INIT_ERROR", error);
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error.message,
      });
    }
  },

  // Login
  login: async (credentials, rememberMe = false) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en el login");
      }

      const { token, user } = await response.json();

      // Almacenar el token según rememberMe
      if (rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      set({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      OfflineDebugger.log("LOGIN_SUCCESS", { username: user.username });
      return user;
    } catch (error) {
      OfflineDebugger.error("LOGIN_ERROR", error);
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error.message,
      });
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    set({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
    OfflineDebugger.log("LOGOUT");
  },

  // Actualizar información del usuario
  updateUser: async (userData) => {
    try {
      set({ loading: true, error: null });
      const token = get().getToken();

      const response = await fetch(`${API_URL}/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar usuario");
      }

      const updatedUser = await response.json();
      set({
        user: updatedUser,
        loading: false,
        error: null,
      });

      OfflineDebugger.log("USER_UPDATED", { user: updatedUser });
      return updatedUser;
    } catch (error) {
      OfflineDebugger.error("UPDATE_USER_ERROR", error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },
});

const useAuthStore = create(
  createStore(createAuthSlice, {
    name: "Auth Store",
    persist: {
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  })
);

export default useAuthStore;
