import { create } from "zustand";
import { createStore } from "./middleware";
import OfflineDebugger from "../../shared/utils/debugger";

const DEFAULT_FILTERS = {
  searchTerm: "",
  status: null,
  isActive: true,
  sortBy: "updatedAt",
  sortOrder: "desc",
};

const createProductSlice = (set, get) => ({
  // Estado
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  // Getters
  getProduct: (id) => get().products.find((p) => p._id === id),

  getFilteredProducts: () => {
    const { products, filters } = get();
    let filtered = [...products];

    // Aplicar filtros
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.ubicacion.toLowerCase().includes(term)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((p) => p.estado === filters.status);
    }

    if (typeof filters.isActive === "boolean") {
      filtered = filtered.filter((p) => p.activo === filters.isActive);
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

  getSelectedProduct: () => get().selectedProduct,

  // Acciones
  setProducts: (products) => {
    set({ products, loading: false, error: null });
    OfflineDebugger.log("PRODUCTS_LOADED", { count: products.length });
  },

  setSelectedProduct: (product) => {
    set({ selectedProduct: product });
    OfflineDebugger.log("PRODUCT_SELECTED", { id: product?._id });
  },

  updateProduct: async (mutation) => {
    const { id, changes, optimisticUpdate = true } = mutation;
    const { products } = get();

    // Actualización optimista
    if (optimisticUpdate) {
      set({
        products: products.map((p) =>
          p._id === id ? { ...p, ...changes, isUpdating: true } : p
        ),
      });
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      if (!response.ok) throw new Error("Error al actualizar el producto");

      const updatedProduct = await response.json();
      set({
        products: products.map((p) =>
          p._id === id ? { ...updatedProduct, isUpdating: false } : p
        ),
        error: null,
      });

      OfflineDebugger.log("PRODUCT_UPDATED", { id, changes });
    } catch (error) {
      // Revertir cambios si falla
      if (optimisticUpdate) {
        set({
          products: products.map((p) =>
            p._id === id ? { ...p, isUpdating: false } : p
          ),
        });
      }
      set({ error: error.message });
      OfflineDebugger.error("PRODUCT_UPDATE_ERROR", {
        id,
        error: error.message,
      });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    const { products } = get();

    // Actualización optimista
    set({
      products: products.map((p) =>
        p._id === id ? { ...p, isDeleting: true } : p
      ),
    });

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el producto");

      set({
        products: products.filter((p) => p._id !== id),
        selectedProduct: null,
        error: null,
      });

      OfflineDebugger.log("PRODUCT_DELETED", { id });
    } catch (error) {
      // Revertir cambios
      set({
        products: products.map((p) =>
          p._id === id ? { ...p, isDeleting: false } : p
        ),
        error: error.message,
      });
      OfflineDebugger.error("PRODUCT_DELETE_ERROR", {
        id,
        error: error.message,
      });
      throw error;
    }
  },

  moveProduct: async (id, newStatus) => {
    const { products } = get();

    // Actualización optimista
    set({
      products: products.map((p) =>
        p._id === id ? { ...p, estado: newStatus, isMoving: true } : p
      ),
    });

    try {
      const response = await fetch(`/api/products/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Error al mover el producto");

      const updatedProduct = await response.json();
      set({
        products: products.map((p) =>
          p._id === id ? { ...updatedProduct, isMoving: false } : p
        ),
        error: null,
      });

      OfflineDebugger.log("PRODUCT_MOVED", { id, newStatus });
    } catch (error) {
      // Revertir cambios
      set({
        products: products.map((p) =>
          p._id === id ? { ...p, estado: p.estado, isMoving: false } : p
        ),
        error: error.message,
      });
      OfflineDebugger.error("PRODUCT_MOVE_ERROR", {
        id,
        newStatus,
        error: error.message,
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    OfflineDebugger.log("PRODUCT_FILTERS_UPDATED", { filters: newFilters });
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    OfflineDebugger.log("PRODUCT_FILTERS_CLEARED");
  },

  clearError: () => {
    set({ error: null });
  },
});

const useProductStore = create(
  createStore(createProductSlice, {
    name: "Product Store",
  })
);

export default useProductStore;
