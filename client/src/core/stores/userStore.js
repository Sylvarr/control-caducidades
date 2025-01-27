import { create } from "zustand";
import { createStore } from "./middleware";
import { ROLE_CONFIG } from "../types/user";
import OfflineDebugger from "../../shared/utils/debugger";

const DEFAULT_FILTERS = {
  searchTerm: "",
  role: null,
  isActive: true,
  sortBy: "username",
  sortOrder: "asc",
};

const createUserSlice = (set, get) => ({
  // Estado
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  // Getters
  getUser: (id) => get().users.find((u) => u._id === id),

  getFilteredUsers: () => {
    const { users, filters } = get();
    let filtered = [...users];

    // Aplicar filtros
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    if (filters.role) {
      filtered = filtered.filter((u) => u.role === filters.role);
    }

    if (typeof filters.isActive === "boolean") {
      filtered = filtered.filter((u) => u.isActive === filters.isActive);
    }

    // Ordenar resultados
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        const order = filters.sortOrder === "asc" ? 1 : -1;

        if (typeof aValue === "string") {
          return aValue.localeCompare(bValue) * order;
        }
        return (aValue - bValue) * order;
      });
    }

    return filtered;
  },

  getSelectedUser: () => get().selectedUser,

  // Acciones
  setUsers: (users) => {
    set({ users, loading: false, error: null });
    OfflineDebugger.log("USERS_LOADED", { count: users.length });
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
    OfflineDebugger.log("USER_SELECTED", { id: user?._id });
  },

  createUser: async (userData) => {
    set({ loading: true });

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          permissions: ROLE_CONFIG[userData.role].permissions,
        }),
      });

      if (!response.ok) throw new Error("Error al crear el usuario");

      const newUser = await response.json();
      set((state) => ({
        users: [...state.users, newUser],
        loading: false,
        error: null,
      }));

      OfflineDebugger.log("USER_CREATED", { user: newUser });
    } catch (error) {
      set({ loading: false, error: error.message });
      OfflineDebugger.error("USER_CREATE_ERROR", { error: error.message });
      throw error;
    }
  },

  updateUser: async (mutation) => {
    const { id, changes, optimisticUpdate = true } = mutation;
    const { users } = get();

    // Actualización optimista
    if (optimisticUpdate) {
      set({
        users: users.map((u) =>
          u._id === id ? { ...u, ...changes, isUpdating: true } : u
        ),
      });
    }

    try {
      // Si se está actualizando el rol, incluir los permisos correspondientes
      const updatedChanges = changes.role
        ? { ...changes, permissions: ROLE_CONFIG[changes.role].permissions }
        : changes;

      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedChanges),
      });

      if (!response.ok) throw new Error("Error al actualizar el usuario");

      const updatedUser = await response.json();
      set({
        users: users.map((u) =>
          u._id === id ? { ...updatedUser, isUpdating: false } : u
        ),
        error: null,
      });

      OfflineDebugger.log("USER_UPDATED", { id, changes });
    } catch (error) {
      // Revertir cambios si falla
      if (optimisticUpdate) {
        set({
          users: users.map((u) =>
            u._id === id ? { ...u, isUpdating: false } : u
          ),
        });
      }
      set({ error: error.message });
      OfflineDebugger.error("USER_UPDATE_ERROR", {
        id,
        error: error.message,
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    const { users } = get();

    // Actualización optimista
    set({
      users: users.map((u) => (u._id === id ? { ...u, isDeleting: true } : u)),
    });

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el usuario");

      set({
        users: users.filter((u) => u._id !== id),
        selectedUser: null,
        error: null,
      });

      OfflineDebugger.log("USER_DELETED", { id });
    } catch (error) {
      // Revertir cambios
      set({
        users: users.map((u) =>
          u._id === id ? { ...u, isDeleting: false } : u
        ),
        error: error.message,
      });
      OfflineDebugger.error("USER_DELETE_ERROR", {
        id,
        error: error.message,
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    OfflineDebugger.log("USER_FILTERS_UPDATED", { filters: newFilters });
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    OfflineDebugger.log("USER_FILTERS_CLEARED");
  },

  clearError: () => {
    set({ error: null });
  },
});

const useUserStore = create(
  createStore(createUserSlice, {
    name: "User Store",
  })
);

export default useUserStore;
