import { create } from "zustand";
import { createStore } from "./middleware";
import OfflineManager from "../../services/offlineManager";
import OfflineDebugger from "../../shared/utils/debugger";

const createCatalogSlice = (set, get) => ({
  // Estado
  products: [],
  loading: false,
  error: null,

  // Getters
  getProductById: (productId) => {
    return get().products.find((p) => p._id === productId);
  },

  // Acciones
  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await OfflineManager.getAllCatalogProducts();
      set({ products: data });
      return data;
    } catch (err) {
      const error = err.message || "Error al cargar el catálogo";
      set({ error });
      OfflineDebugger.error("CATALOG_LOAD_ERROR", err);
      throw new Error(error);
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (productId, updates) => {
    try {
      const updatedProduct = await OfflineManager.updateCatalogProduct(
        productId,
        updates
      );
      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
      }));
      return updatedProduct;
    } catch (err) {
      OfflineDebugger.error("CATALOG_UPDATE_ERROR", err, {
        productId,
        updates,
      });
      throw err;
    }
  },

  createProduct: async (productData) => {
    try {
      const newProduct = await OfflineManager.createCatalogProduct(productData);
      set((state) => ({
        products: [...state.products, newProduct],
      }));
      return newProduct;
    } catch (err) {
      OfflineDebugger.error("CATALOG_CREATE_ERROR", err, { productData });
      throw err;
    }
  },

  deleteProduct: async (productId) => {
    try {
      await OfflineManager.deleteCatalogProduct(productId);
      set((state) => ({
        products: state.products.filter((p) => p._id !== productId),
      }));
    } catch (err) {
      OfflineDebugger.error("CATALOG_DELETE_ERROR", err, { productId });
      throw err;
    }
  },

  // Acciones de sincronización
  handleServerUpdate: (update) => {
    const { type, data } = update;

    switch (type) {
      case "create":
        set((state) => ({
          products: [...state.products, data],
        }));
        break;

      case "update":
        set((state) => ({
          products: state.products.map((p) => (p._id === data._id ? data : p)),
        }));
        break;

      case "delete":
        set((state) => ({
          products: state.products.filter((p) => p._id !== data),
        }));
        break;

      default:
        OfflineDebugger.warn("UNKNOWN_CATALOG_UPDATE", { type, data });
    }
  },
});

const useCatalogStore = create(
  createStore(createCatalogSlice, {
    name: "Catalog Store",
  })
);

export default useCatalogStore;
