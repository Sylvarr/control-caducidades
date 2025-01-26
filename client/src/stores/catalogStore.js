import { create } from "zustand";
import { devtools } from "zustand/middleware";
import OfflineManager from "../services/offlineManager";

const useCatalogStore = create(
  devtools(
    (set, get) => ({
      // Estado
      products: [],
      loading: false,
      error: null,

      // Acciones
      loadProducts: async () => {
        set({ loading: true, error: null });
        try {
          const data = await OfflineManager.getAllCatalogProducts();
          set({ products: data });
        } catch (err) {
          set({ error: err.message });
          console.error("Error loading catalog:", err);
        } finally {
          set({ loading: false });
        }
      },

      updateProduct: (updatedProduct) => {
        if (!updatedProduct?._id) {
          console.warn("Attempted to update with invalid product");
          return;
        }

        set((state) => ({
          products: state.products.map((p) =>
            p._id === updatedProduct._id ? updatedProduct : p
          ),
        }));
      },

      addProduct: (newProduct) => {
        if (!newProduct) {
          console.warn("Attempted to add invalid product");
          return;
        }

        set((state) => ({
          products: [...state.products, newProduct],
        }));
      },

      deleteProduct: (productId) => {
        if (!productId) {
          console.warn("Attempted to delete with invalid productId");
          return;
        }

        set((state) => ({
          products: state.products.filter((p) => p._id !== productId),
        }));
      },

      // Selectores
      getProductById: (productId) => {
        return get().products.find((p) => p._id === productId);
      },
    }),
    {
      name: "Catalog Store",
    }
  )
);

export default useCatalogStore;
